import { useState } from 'react';
import { Ban, Car, Plus, RefreshCw, Search, Trash2, User } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, Chip, Confirm, Empty, Field, Input, Modal, Plate, Segmented, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { FaceCrop } from '@/components/vision';
import { cn, dayLabel } from '@/lib/utils';
import { toast } from '@/store/toast';
import type { WatchEntry } from '@/data/types';

const LEVELS: WatchEntry['level'][] = ['Alert all guards', 'Alert only', 'Deny entry', 'Deny and alert'];
const levelTone = (l: WatchEntry['level']) => (l.startsWith('Deny') ? 'red' : 'amber') as 'red' | 'amber';

export default function Watchlist() {
  const watchlist = useStore((s) => s.watchlist);
  const session = useStore((s) => s.session.portal);
  const { addWatch, removeWatch, renewWatch } = useStore.getState();
  const [tab, setTab] = useState<'all' | 'person' | 'vehicle'>('all');
  const [q, setQ] = useState('');
  const [add, setAdd] = useState(false);
  const [del, setDel] = useState<WatchEntry | null>(null);
  const [kind, setKind] = useState<'person' | 'vehicle'>('vehicle');
  const [name, setName] = useState('');
  const [plate, setPlate] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [reason, setReason] = useState('');
  const [level, setLevel] = useState<WatchEntry['level']>('Alert all guards');
  const [until, setUntil] = useState('3 months');

  const list = watchlist
    .filter((w) => tab === 'all' || w.kind === tab)
    .filter((w) => !q || `${w.name} ${w.plate ?? ''} ${w.reason}`.toLowerCase().includes(q.toLowerCase()));

  const submit = () => {
    if (kind === 'vehicle' && !plate.trim()) return toast.error('Enter the plate number');
    if (kind === 'person' && !name.trim()) return toast.error('Enter a name or description');
    if (!reason.trim()) return toast.error('A reason is required', 'Every watchlist entry must say why, for PDPA.');
    const d = new Date();
    d.setMonth(d.getMonth() + (until === '1 month' ? 1 : until === '3 months' ? 3 : 6));
    addWatch({
      kind, name: kind === 'vehicle' ? name || 'Vehicle of interest' : name, plate: kind === 'vehicle' ? plate.toUpperCase().trim() : undefined, vehicle: kind === 'vehicle' ? vehicle : undefined,
      variant: kind === 'person' ? 1 + Math.floor(Math.random() * 8) : undefined, reason, level, addedBy: session?.name ?? 'Farah Hanim',
      until: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    });
    toast.success('Added to watchlist', `Guards will be alerted when ${kind === 'vehicle' ? plate.toUpperCase() : 'this person'} is seen.`);
    setAdd(false); setName(''); setPlate(''); setVehicle(''); setReason('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['People', watchlist.filter((w) => w.kind === 'person').length, 'Face match on every camera'],
          ['Vehicles', watchlist.filter((w) => w.kind === 'vehicle').length, 'Plate match at both gates'],
          ['Deny entry', watchlist.filter((w) => w.level.startsWith('Deny')).length, 'Barrier stays closed'],
          ['Hits this month', 6, 'All refused or escorted out'],
        ].map(([l, v, n]) => (
          <Card key={String(l)} className="flex flex-col gap-1.5 p-4"><span className="text-[12.5px] font-bold text-muted-dark">{l}</span><span className="text-[26px] font-extrabold tracking-tight">{v}</span><span className="text-xs text-muted">{n}</span></Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
          <CardHeader title="Watchlist" sub="Entries expire automatically. The committee must renew them, and every change is logged." action={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAdd(true)}>Add entry</Button>} />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Type" value={tab} onChange={setTab} options={[{ value: 'all', label: `All · ${watchlist.length}` }, { value: 'person', label: 'People' }, { value: 'vehicle', label: 'Vehicles' }]} />
            <div className="relative ml-auto w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input aria-label="Search watchlist" placeholder="Name, plate or reason" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
            </div>
          </div>
        </div>
        <ul className="grid gap-3 px-4 pb-4 md:grid-cols-2 2xl:grid-cols-3">
          {list.map((w) => (
            <li key={w.id} className="flex flex-col gap-3 rounded-2xl border border-line p-4">
              <div className="flex items-start gap-3">
                {w.kind === 'person' ? <FaceCrop variant={w.variant} className="h-14 w-14 shrink-0" /> : <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-navy text-white"><Car className="h-6 w-6" /></span>}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {w.plate ? <Plate>{w.plate}</Plate> : <span className="font-bold">{w.name}</span>}
                    <Chip tone={levelTone(w.level)}>{w.level}</Chip>
                  </div>
                  <p className="mt-1 text-xs text-muted">{w.plate ? `${w.vehicle ?? ''} · ${w.name}` : w.kind === 'person' ? 'Person' : ''}</p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-dark">{w.reason}</p>
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div><dt className="text-muted">Added by</dt><dd className="font-semibold">{w.addedBy}</dd></div>
                <div><dt className="text-muted">Expires</dt><dd className="font-semibold">{w.until}</dd></div>
                <div><dt className="text-muted">Last seen</dt><dd className={cn('font-semibold', /today/i.test(w.lastSeen) && 'text-danger-ink')}>{w.lastSeen}</dd></div>
              </dl>
              <div className="mt-auto flex gap-2">
                <Button size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => { renewWatch(w.id); toast.success('Renewed for 6 months', 'Expires 23 Mar 2027.'); }}>Renew</Button>
                <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDel(w)}>Remove</Button>
                <span className="ml-auto self-center text-[11px] text-muted">Added {dayLabel(w.addedAt)}</span>
              </div>
            </li>
          ))}
        </ul>
        {!list.length && <Empty icon={<Ban className="h-5 w-5" />} title="No entries" body="Nothing matches this filter." />}
      </Card>

      <Modal open={add} onClose={() => setAdd(false)} title="Add to watchlist" description="Only add people or vehicles with a documented reason. Entries expire unless renewed."
        footer={<><Button onClick={() => setAdd(false)}>Cancel</Button><Button variant="primary" onClick={submit}>Add entry</Button></>}>
        <div className="flex flex-col gap-3">
          <Segmented label="Entry type" full value={kind} onChange={setKind} options={[{ value: 'vehicle', label: <span className="flex items-center justify-center gap-1.5"><Car className="h-4 w-4" />Vehicle</span> }, { value: 'person', label: <span className="flex items-center justify-center gap-1.5"><User className="h-4 w-4" />Person</span> }]} />
          {kind === 'vehicle' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Plate number">{(id) => <Input id={id} value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="WXY 8812" className="font-mono uppercase" />}</Field>
              <Field label="Vehicle">{(id) => <Input id={id} value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="Silver Perodua Myvi" />}</Field>
            </div>
          )}
          <Field label={kind === 'person' ? 'Name or description' : 'Label (optional)'}>{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === 'person' ? 'e.g. Ex-contractor, RN-0376' : 'e.g. Former tenant vehicle'} />}</Field>
          {kind === 'person' && <p className="rounded-xl bg-ice p-3 text-xs text-muted-dark">To add a face, open the person in the Unregistered gallery and choose Add to watchlist. The snapshot is attached automatically.</p>}
          <Field label="Reason">{(id) => <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What happened, and the reference number if any" />}</Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="What happens on a match">{(id) => <Select id={id} value={level} onChange={(e) => setLevel(e.target.value as WatchEntry['level'])}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
            <Field label="Expires after">{(id) => <Select id={id} value={until} onChange={(e) => setUntil(e.target.value)}>{['1 month', '3 months', '6 months'].map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
          </div>
        </div>
      </Modal>

      <Confirm open={!!del} onClose={() => setDel(null)} danger confirmLabel="Remove" title="Remove from watchlist?"
        body={`${del?.plate ?? del?.name} will no longer trigger alerts. This is recorded in the audit log.`}
        onConfirm={() => { if (del) { removeWatch(del.id); useStore.getState().log({ who: session?.name ?? 'Farah Hanim', role: 'Building Manager', action: 'Deleted', record: `Watchlist entry ${del.plate ?? del.name}` }); toast.info('Removed from watchlist'); } }} />
    </div>
  );
}
