import { useMemo, useState } from 'react';
import { Ban, Download, Link2, UserCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { UnknownFace } from '@/data/types';
import { Card, CardHeader, Chip, Drawer, Empty, Field, Input, Modal, Plate, Segmented, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { CamFeed, FaceCrop } from '@/components/vision';
import { cn, downloadFile, hhmm, toCsv, todayStamp, when } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMinWidth } from '@/lib/hooks';

type Range = '24h' | '7d' | '30d';
const statusChip: Record<UnknownFace['status'], [string, 'red' | 'amber' | 'teal' | 'grey']> = {
  unresolved: ['Unresolved', 'amber'], known: ['Known now', 'teal'], registered: ['Registered', 'teal'], watchlisted: ['Watchlisted', 'red'],
};

function FacePanel({ f, onDone }: { f: UnknownFace; onDone?: () => void }) {
  const alerts = useStore((s) => s.alerts);
  const units = useStore((s) => s.units);
  const { resolveFace, watchFace, addAlertNote } = useStore.getState();
  const [modal, setModal] = useState<null | 'watch' | 'known' | 'attach'>(null);
  const [reason, setReason] = useState(`${f.description}. Seen at ${f.where}.`);
  const [unit, setUnit] = useState(units[0].unit);
  const [note, setNote] = useState('Family member of the unit');
  const openAlerts = alerts.filter((a) => a.status !== 'closed');
  const [alertId, setAlertId] = useState(openAlerts[0]?.id ?? '');
  const repeat = new Set(f.sightings.map((s) => new Date(s.at).toDateString())).size;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3.5">
        <FaceCrop variant={f.variant} className="w-28 shrink-0" />
        <div className="flex flex-col gap-1.5">
          <Chip tone={repeat >= 3 ? 'red' : statusChip[f.status][1]}>{repeat >= 3 ? `Repeat unknown · ${repeat} days` : statusChip[f.status][0]}</Chip>
          <span className="text-[17px] font-extrabold">Unknown U-{f.id.replace('uf-', '0923-0')}</span>
          <span className="text-[12.5px] leading-snug text-muted">{f.description}. Closest resident match {f.similarity}%, below the 80% threshold.</span>
        </div>
      </div>
      {f.resolution && <p className="rounded-lg bg-teal-soft px-3 py-2 text-[12.5px] font-semibold text-teal-dark">{f.resolution}</p>}
      <div className="grid grid-cols-3 gap-2">
        {[[f.sightings.length, 'Sightings'], [new Set(f.sightings.map((s) => s.camera)).size, 'Cameras'], [0, 'Registrations']].map(([v, l]) => (
          <div key={l as string} className="rounded-xl bg-ice p-2.5"><div className="text-lg font-extrabold">{v}</div><div className="text-[11.5px] text-muted">{l}</div></div>
        ))}
      </div>
      <div className="flex flex-col">
        <span className="eyebrow pb-2">Sightings</span>
        {f.sightings.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5 border-t border-line-soft py-2">
            <CamFeed scene={s.scene} tone="red" live={false} size="xs" className="w-[72px] shrink-0 rounded-md" showBox={false} />
            <div className="flex flex-col"><span className="text-[12.5px] font-bold">{s.camera}</span><span className="font-mono text-[11.5px] text-muted">{when(s.at)}</span></div>
          </div>
        ))}
      </div>
      {f.status === 'unresolved' || f.status === 'known' ? (
        <div className="flex flex-col gap-2">
          <Button variant="danger" icon={<Ban className="h-4 w-4" />} onClick={() => setModal('watch')}>Add to watchlist</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button icon={<UserCheck className="h-4 w-4" />} onClick={() => setModal('known')} disabled={f.status === 'known'}>Mark as known</Button>
            <Button icon={<Link2 className="h-4 w-4" />} onClick={() => setModal('attach')}>Attach</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => { resolveFace(f.id, 'unresolved', ''); toast.info('Moved back to unresolved'); }}>Undo decision</Button>
      )}
      <p className="text-[11.5px] leading-relaxed text-muted">Unknown-face snapshots are kept for 30 days, then deleted automatically, unless attached to an incident.</p>

      <Modal open={modal === 'watch'} onClose={() => setModal(null)} title="Add to watchlist" description="Guards are alerted on the next sighting. Needs MC approval within 7 days."
        footer={<><Button onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" onClick={() => { watchFace(f.id, reason); setModal(null); onDone?.(); toast.success('Added to watchlist', 'All guards will be alerted on the next sighting.'); }}>Add to watchlist</Button></>}>
        <Field label="Reason">{(id) => <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
      </Modal>
      <Modal open={modal === 'known'} onClose={() => setModal(null)} title="Mark as known" description="Links this face to a unit so it is not flagged again today."
        footer={<><Button onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" onClick={() => { resolveFace(f.id, 'known', `${note} · ${unit}`); setModal(null); onDone?.(); toast.success('Marked as known', `${note} · ${unit}`); }}>Save</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Unit">{(id) => <Select id={id} value={unit} onChange={(e) => setUnit(e.target.value)}>{units.map((u) => <option key={u.unit} value={u.unit}>{u.unit} · {u.name}</option>)}</Select>}</Field>
          <Field label="Who is this?">{(id) => <Input id={id} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        </div>
      </Modal>
      <Modal open={modal === 'attach'} onClose={() => setModal(null)} title="Attach to an incident" description="The snapshot is kept for as long as the incident."
        footer={<><Button onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" disabled={!alertId} onClick={() => { addAlertNote(alertId, `Attached unknown face U-${f.id.replace('uf-', '0923-0')} (${f.where})`); setModal(null); toast.success('Attached to incident'); }}>Attach</Button></>}>
        {openAlerts.length ? (
          <Field label="Incident">{(id) => <Select id={id} value={alertId} onChange={(e) => setAlertId(e.target.value)}>{openAlerts.map((a) => <option key={a.id} value={a.id}>{a.ref} · {a.title}</option>)}</Select>}</Field>
        ) : <p className="text-sm text-muted">There are no open incidents.</p>}
      </Modal>
    </div>
  );
}

export default function Unregistered() {
  const faces = useStore((s) => s.unknownFaces);
  const plates = useStore((s) => s.unknownPlates);
  const units = useStore((s) => s.units);
  const { linkPlate, watchPlate } = useStore.getState();
  const [range, setRange] = useState<Range>('24h');
  const [place, setPlace] = useState('all');
  const [status, setStatus] = useState('unresolved-first');
  const [selId, setSelId] = useState<string>(faces[0]?.id);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isXl = useMinWidth(1280);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [linkUnit, setLinkUnit] = useState(units[0].unit);

  const list = useMemo(() => {
    const limit = { '24h': 1440, '7d': 7 * 1440, '30d': 30 * 1440 }[range];
    let l = faces.filter((f) => (Date.now() - +new Date(f.at)) / 60000 <= limit);
    if (place !== 'all') l = l.filter((f) => f.where.toLowerCase().includes(place));
    if (status === 'unresolved') l = l.filter((f) => f.status === 'unresolved');
    if (status === 'unresolved-first') l = [...l].sort((a, b) => Number(b.status === 'unresolved') - Number(a.status === 'unresolved'));
    return l;
  }, [faces, range, place, status]);
  const sel = faces.find((f) => f.id === selId) ?? list[0];
  const unresolved = faces.filter((f) => f.status === 'unresolved').length;
  const repeat = faces.filter((f) => new Set(f.sightings.map((s) => new Date(s.at).toDateString())).size >= 3).length;

  const exportCsv = () => {
    downloadFile(`unregistered-${todayStamp()}.csv`, toCsv([
      ['Type', 'ID / plate', 'Where', 'Time', 'Status', 'Note'],
      ...list.map((f) => ['Face', f.id, f.where, when(f.at), f.status, f.resolution ?? f.note]),
      ...plates.map((p) => ['Plate', p.plate, p.lane, when(p.firstSeen), p.status, p.outcome]),
    ]));
    toast.success('Unregistered report downloaded');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Time range" value={range} onChange={setRange} options={[{ value: '24h', label: 'Last 24 hours' }, { value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }]} />
        <label className="flex items-center gap-2 text-[12.5px] font-bold text-muted-dark">Entry point
          <Select value={place} onChange={(e) => setPlace(e.target.value)} className="w-auto"><option value="all">All</option><option value="gate">Gates</option><option value="lobby">Lobbies</option><option value="perimeter">Perimeter</option><option value="carpark">Carpark</option></Select>
        </label>
        <label className="flex items-center gap-2 text-[12.5px] font-bold text-muted-dark">Status
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto"><option value="unresolved-first">Unresolved first</option><option value="unresolved">Unresolved only</option><option value="all">All</option></Select>
        </label>
        <span className="flex-1" />
        <Button icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Export</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[[faces.length, 'Unknown faces', 'Last 30 days', ''], [plates.length, 'Unknown plates', `${plates.filter((p) => p.status === 'open').length} still open`, ''], [unresolved, 'Unresolved', 'Need a decision', 'text-danger-ink'], [repeat, 'Repeat unknowns', 'Seen on 3+ days', 'text-warn-ink']].map(([v, l, n, c]) => (
          <Card key={l as string} className="flex items-center gap-3.5 p-4"><span className={cn('text-[28px] font-extrabold tracking-tight', c as string)}>{v}</span><div className="flex flex-col"><span className="text-[13px] font-bold">{l}</span><span className="text-xs text-muted">{n}</span></div></Card>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="h2">Unknown faces · {list.length}</h2><span className="sub">Not matched to any resident, visitor, contractor or staff profile</span></div>
          {list.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((f) => (
                <button key={f.id} type="button" aria-pressed={isXl ? sel?.id === f.id : undefined} onClick={() => { setSelId(f.id); setMobileOpen(true); }} className={cn('card flex flex-col gap-2 p-2.5 text-left', sel?.id === f.id && 'ring-2 ring-brand')}>
                  <div className="relative"><FaceCrop variant={f.variant} /><Chip tone={statusChip[f.status][1]} className="absolute left-1.5 top-1.5">{statusChip[f.status][0]}</Chip></div>
                  <div className="flex flex-col px-0.5"><span className="text-[13px] font-bold">{f.where}</span><span className="text-[11.5px] text-muted"><span className="font-mono">{hhmm(f.at)}</span> · {f.note}</span></div>
                </button>
              ))}
            </div>
          ) : <Card><Empty title="No unknown faces" body="Nothing matches these filters." /></Card>}
        </div>
        <Card className="hidden p-5 xl:block">{sel ? <FacePanel key={sel.id} f={sel} /> : <Empty title="Select a face" />}</Card>
      </div>
      <div>
        <Drawer open={mobileOpen && !!sel && !isXl} onClose={() => setMobileOpen(false)} title="Unknown person">
          <div className="p-5">{sel && <FacePanel key={sel.id} f={sel} onDone={() => setMobileOpen(false)} />}</div>
        </Drawer>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="p-4" title={`Unknown plates · ${plates.length}`} sub="Read at the gates, matching no resident vehicle or visitor pass" />
        <div className="overflow-x-auto">
          <table className="tbl min-w-[760px]">
            <thead><tr><th>Plate</th><th>Vehicle</th><th>First seen</th><th>Attempts</th><th>Lane</th><th>Outcome</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {plates.map((p) => (
                <tr key={p.id}>
                  <td><Plate>{p.plate}</Plate></td>
                  <td>{p.vehicle}</td>
                  <td className="font-mono text-[12.5px]">{when(p.firstSeen)}</td>
                  <td className="font-bold">{p.attempts}</td>
                  <td>{p.lane}</td>
                  <td><Chip tone={p.status === 'watchlisted' ? 'red' : p.status === 'linked' ? 'teal' : 'grey'}>{p.status === 'watchlisted' ? 'Watchlisted' : p.outcome}</Chip></td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <Button size="sm" disabled={p.status !== 'open'} onClick={() => setLinkId(p.id)}>Link to unit</Button>
                      <Button size="sm" disabled={p.status === 'watchlisted'} onClick={() => { watchPlate(p.id); toast.success(`${p.plate} added to watchlist`); }}>Watchlist</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Modal open={!!linkId} onClose={() => setLinkId(null)} title="Link plate to a unit" description="The car will be let in automatically from now on."
        footer={<><Button onClick={() => setLinkId(null)}>Cancel</Button><Button variant="primary" onClick={() => { linkPlate(linkId!, linkUnit); setLinkId(null); toast.success('Plate linked', `Now registered to ${linkUnit}`); }}>Link</Button></>}>
        <Field label="Unit">{(id) => <Select id={id} value={linkUnit} onChange={(e) => setLinkUnit(e.target.value)}>{units.map((u) => <option key={u.unit} value={u.unit}>{u.unit} · {u.name}</option>)}</Select>}</Field>
      </Modal>
    </div>
  );
}
