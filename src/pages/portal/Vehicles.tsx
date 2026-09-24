import { useMemo, useState } from 'react';
import { Ban, Bell, FileWarning, Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { makeReads, type PlateRead } from '@/data/anpr';
import { Card, CardHeader, Chip, Drawer, Field, Input, Modal, Plate, Segmented, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { CamFeed } from '@/components/vision';
import { cn, hhmm, hhmmss, when } from '@/lib/utils';
import { toast } from '@/store/toast';
import type { Scene, Tone } from '@/data/types';

type Tab = 'all' | 'visitor' | 'unknown' | 'exit';
const barrierTone = (b: PlateRead['barrier']) => (b.startsWith('Denied') ? 'red' : b === 'Guard opened' ? 'blue' : 'teal') as 'red' | 'blue' | 'teal';

interface Violation { id: string; tone: Tone; scene: Scene; tag: string; box: string; cam: string; time: string; title: string; body: string; plate: string; unit: string; state: 'open' | 'notified' | 'notice' }
const VIOLATIONS: Violation[] = [
  { id: 'vi-1', tone: 'red', scene: 'carpark', tag: 'Fire lane', box: 'VJT 902 · fire lane 22m', cam: 'CAM 21 · B1 ramp', time: '21:52', title: 'Parked in fire lane', body: 'Resident of B-05-03. Parked for 22 minutes next to hydrant H-3.', plate: 'VJT 902', unit: 'B-05-03', state: 'open' },
  { id: 'vi-2', tone: 'amber', scene: 'carpark', tag: 'Bay misuse', box: 'VJR 4410 · bay 214', cam: 'CAM 22 · Carpark B2', time: '20:18', title: 'Wrong resident bay', body: 'Car from B-03-11 is in bay B2-214, which belongs to B-12-05.', plate: 'VJR 4410', unit: 'B-03-11', state: 'open' },
  { id: 'vi-3', tone: 'amber', scene: 'carpark', tag: 'Double parked', box: 'WPN 6621 · blocking 2', cam: 'CAM 25 · Carpark B3', time: '19:47', title: 'Double parking', body: 'Blocking two cars in row F. Owner notified by app at 19:48.', plate: 'WPN 6621', unit: 'C-09-10', state: 'notified' },
  { id: 'vi-4', tone: 'blue', scene: 'carpark', tag: 'Abandoned', box: 'BHC 118 · 11 days', cam: 'CAM 27 · Carpark B3', time: '11 days', title: 'Not moved for 11 days', body: 'No unit on record. Flat rear tyre. Tow notice under house rule 14.', plate: 'BHC 118', unit: '—', state: 'open' },
];

export default function Vehicles() {
  const reads = useMemo(() => makeReads().filter((r) => (Date.now() - +new Date(r.at)) / 60000 < 600), []);
  const visits = useStore((s) => s.visits);
  const watchlist = useStore((s) => s.watchlist);
  const units = useStore((s) => s.units);
  const { addWatch, addNotice, createTicket, extendVisit } = useStore.getState();
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<PlateRead | null>(null);
  const [viol, setViol] = useState(VIOLATIONS);
  const [notice, setNotice] = useState<Violation | null>(null);
  const [fine, setFine] = useState('50');
  const [bay, setBay] = useState<number | null>(null);

  const list = reads.filter((r) => (tab === 'all' ? true : tab === 'visitor' ? r.kind === 'visitor' || r.kind === 'courier' : tab === 'unknown' ? r.kind === 'unknown' || r.kind === 'watchlist' : r.kind === 'exit'))
    .filter((r) => !q || r.plate.replace(/\s/g, '').toLowerCase().includes(q.replace(/\s/g, '').toLowerCase()));
  const overstays = visits.filter((v) => v.plate && v.status === 'on_site' && new Date(v.validTo) < new Date());
  const extraOver = [{ id: 'x1', plate: 'BQR 5512', unit: 'A-03-09', ended: '19:00', over: '3h 14m' }, { id: 'x2', plate: 'WKM 830', unit: 'C-17-01', ended: '20:30', over: '1h 44m' }];
  const occ = [1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 0, 1, 1, 2, 1, 1, 1, 0, 1, 1, 1, 2, 1, 0, 1, 2, 1, 1, 0];
  const bayInfo = (i: number) => (occ[i] === 0 ? 'Free' : occ[i] === 2 ? 'Overstay' : 'Occupied');

  const notifyAll = () => {
    overstays.forEach((v) => v.unit === 'A-15-07' && addNotice({ unit: v.unit, title: 'Your guest is past their pass', body: `${v.name}'s car ${v.plate} is still inside. Extend the pass or ask them to leave.`, kind: 'vehicle', link: '/app/visitors' }));
    toast.success('Hosts notified', `${overstays.length + extraOver.length} units got a push and WhatsApp message.`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[['Vehicle entries today', '412', '316 resident · 81 visitor · 15 contractor', ''], ['Plate read accuracy', '99.2%', '3 manual corrections today', ''], ['Unknown plates', String(reads.filter((r) => r.kind === 'unknown').length + 3), 'Refused at barrier', 'text-danger-ink'], ['Visitor overstays', String(overstays.length + extraOver.length), 'Longest 3h 14m', 'text-warn-ink'], ['Parking violations', String(viol.filter((v) => v.state === 'open').length + 5), 'Fire lane, bays, obstruction', 'text-warn-ink']].map(([l, v, n, c]) => (
          <Card key={l} className="flex flex-col gap-1.5 p-4"><span className="text-[12.5px] font-bold text-muted-dark">{l}</span><span className={cn('text-[26px] font-extrabold tracking-tight', c)}>{v}</span><span className="text-xs text-muted">{n}</span></Card>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div><h2 className="h2">ANPR log</h2><p className="sub">Every plate read at the gates, matched in under 300 ms</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex h-9 items-center gap-2 rounded-[10px] border border-line-strong px-2.5 text-muted"><Search className="h-4 w-4" /><span className="sr-only">Find plate</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Plate" className="w-24 bg-transparent font-mono text-[13px] uppercase text-navy outline-none" /></label>
              <Segmented label="ANPR filter" value={tab} onChange={setTab} options={[{ value: 'all', label: 'All' }, { value: 'visitor', label: 'Visitors' }, { value: 'unknown', label: 'Unknown' }, { value: 'exit', label: 'Exits' }]} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl min-w-[720px]">
              <thead><tr><th>Time</th><th>Snapshot</th><th>Plate</th><th>Matched to</th><th>Lane</th><th>Barrier</th></tr></thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className="clickable" tabIndex={0} onClick={() => setOpen(r)} onKeyDown={(e) => e.key === 'Enter' && setOpen(r)} aria-label={`Open read ${r.plate}`}>
                    <td className="font-mono text-[12.5px] font-bold">{hhmmss(r.at)}</td>
                    <td><CamFeed scene="gate" tone={barrierTone(r.barrier)} plate={r.plate} live={false} showBox={false} size="xs" className="w-[84px] rounded-md" /></td>
                    <td><Plate>{r.plate}</Plate></td>
                    <td><div className="flex flex-col"><span className={cn('font-bold', r.kind === 'unknown' || r.kind === 'watchlist' ? 'text-danger-ink' : '')}>{r.match}</span><span className="text-[11.5px] text-muted">{r.detail}</span></div></td>
                    <td className="text-[12.5px]">{r.lane}</td>
                    <td><Chip tone={barrierTone(r.barrier)}>{r.barrier}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && <p className="p-8 text-center text-sm text-muted">No plate reads match.</p>}
          </div>
        </Card>

        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3 p-5">
            <CardHeader title="Visitor bays · B1" action={<span className="text-[13px] font-extrabold">{occ.filter(Boolean).length} / {occ.length}</span>} />
            <div className="grid grid-cols-10 gap-1.5">
              {occ.map((s, i) => (
                <button key={i} type="button" onClick={() => setBay(i)} aria-label={`Bay V${i + 1}, ${bayInfo(i)}`} className={cn('flex h-8 items-center justify-center rounded-md text-[9.5px] font-extrabold', s === 0 ? 'border border-[#C9D5EC] bg-white text-muted' : s === 2 ? 'bg-warn text-white' : 'bg-brand text-white', bay === i && 'ring-2 ring-navy ring-offset-1')}>
                  {s ? `V${i + 1}` : ''}
                </button>
              ))}
            </div>
            <p className="min-h-[18px] text-xs font-semibold text-muted-dark">{bay === null ? 'Tap a bay for details.' : `Bay V${bay + 1} · ${bayInfo(bay)}${occ[bay] === 2 ? ' · pass ended 1h 14m ago' : occ[bay] === 1 ? ' · visitor within pass' : ''}`}</p>
            <div className="flex gap-3.5 text-[11.5px] font-semibold text-muted-dark">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand" />Occupied</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-warn" />Overstay</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-[#C9D5EC] bg-white" />Free</span>
            </div>
          </Card>
          <Card className="flex flex-col gap-2 p-5">
            <CardHeader title={`Overstays · ${overstays.length + extraOver.length}`} />
            {overstays.map((v) => (
              <div key={v.id} className="flex items-center gap-2.5 border-t border-line-soft py-2">
                <Plate>{v.plate}</Plate>
                <div className="flex min-w-0 flex-1 flex-col"><span className="text-[12.5px] font-bold">Guest of {v.unit}</span><span className="text-[11.5px] text-muted">Pass ended {hhmm(v.validTo)}</span></div>
                <Button size="sm" onClick={() => { extendVisit(v.id, 1); toast.success('Pass extended 1 hour', v.plate); }}>+1 h</Button>
              </div>
            ))}
            {extraOver.map((o) => (
              <div key={o.id} className="flex items-center gap-2.5 border-t border-line-soft py-2">
                <Plate>{o.plate}</Plate>
                <div className="flex min-w-0 flex-1 flex-col"><span className="text-[12.5px] font-bold">Guest of {o.unit}</span><span className="text-[11.5px] text-muted">Pass ended {o.ended}</span></div>
                <Chip tone="amber">+{o.over}</Chip>
              </div>
            ))}
            <Button icon={<Bell className="h-4 w-4" />} onClick={notifyAll}>Notify all hosts</Button>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="h2">Parking violations</h2><span className="sub">Evidence clipped automatically · fines follow the house rules approved at the AGM</span></div>
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {viol.map((v) => (
            <Card key={v.id} className="flex flex-col gap-2.5 p-3">
              <CamFeed scene={v.scene} tone={v.tone} tag={v.tag} boxLabel={v.box} cam={v.cam} time={v.time} live={false} size="sm" />
              <div className="flex flex-col gap-1 px-0.5"><div className="flex items-center justify-between gap-2"><span className="text-[13.5px] font-bold">{v.title}</span><Plate>{v.plate}</Plate></div><span className="text-xs leading-snug text-muted">{v.body}</span></div>
              <div className="mt-auto flex gap-2 px-0.5 pb-0.5">
                {v.state === 'open' ? (
                  <>
                    <Button size="sm" className="flex-1" onClick={() => { setViol(viol.map((x) => (x.id === v.id ? { ...x, state: 'notified' } : x))); toast.success(`${v.unit === '—' ? 'Owner' : v.unit} notified`, 'Push and WhatsApp sent with the clip.'); }}>Notify</Button>
                    <Button size="sm" className="flex-1" icon={<FileWarning className="h-3.5 w-3.5" />} onClick={() => setNotice(v)}>Notice</Button>
                  </>
                ) : <Chip tone={v.state === 'notice' ? 'red' : 'teal'} className="w-full justify-center">{v.state === 'notice' ? 'Notice issued' : 'Owner notified'}</Chip>}
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title="Plate read">
        {open && (
          <div className="flex flex-col gap-4 p-5">
            <CamFeed scene="gate" tone={barrierTone(open.barrier)} plate={open.plate} tag={open.barrier} boxLabel={`${open.plate} · ${open.colour} ${open.vehicle}`} cam={`${open.camera} · ${open.lane}`} time={hhmmss(open.at)} live={false} size="md" />
            <div className="grid grid-cols-2 gap-2.5 text-[13px]">
              {[['Plate', open.plate], ['Vehicle', `${open.colour} ${open.vehicle}`], ['Matched to', open.match], ['Read at', when(open.at)], ['Lane', open.lane], ['Barrier', open.barrier]].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-ice p-2.5"><div className="text-[11.5px] font-bold text-muted">{k}</div><div className="font-bold capitalize">{v}</div></div>
              ))}
            </div>
            <p className="text-[13px] text-muted-dark">{open.detail}</p>
            <Button variant="danger" icon={<Ban className="h-4 w-4" />} disabled={watchlist.some((w) => w.plate === open.plate)}
              onClick={() => { addWatch({ kind: 'vehicle', name: 'Vehicle from ANPR log', plate: open.plate, vehicle: `${open.colour} ${open.vehicle}`, reason: `Added from ANPR log: ${open.detail}`, level: 'Alert only', addedBy: 'Farah Hanim', until: '31 Dec 2026' }); toast.success(`${open.plate} added to watchlist`); }}>
              {watchlist.some((w) => w.plate === open.plate) ? 'Already on watchlist' : 'Add to watchlist'}
            </Button>
          </div>
        )}
      </Drawer>
      <Modal open={!!notice} onClose={() => setNotice(null)} title="Issue a parking notice" description={notice ? `${notice.plate} · ${notice.title}` : ''}
        footer={<><Button onClick={() => setNotice(null)}>Cancel</Button><Button variant="danger" onClick={() => {
          if (!notice) return;
          setViol(viol.map((x) => (x.id === notice.id ? { ...x, state: 'notice' } : x)));
          createTicket({ title: `Parking notice: ${notice.title} (${notice.plate})`, meta: `${notice.unit} · RM ${fine} under house rule 14`, evidence: true, state: 'Assigned', unit: notice.unit });
          setNotice(null);
          toast.success('Notice issued', `RM ${fine} added to ${notice.unit}'s next bill`);
        }}>Issue notice</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Unit">{(id) => <Select id={id} defaultValue={notice?.unit}>{[notice?.unit ?? '—', ...units.map((u) => u.unit)].filter((v, i, a) => a.indexOf(v) === i).map((u) => <option key={u}>{u}</option>)}</Select>}</Field>
          <Field label="Fine (RM)">{(id) => <Input id={id} type="number" min={0} value={fine} onChange={(e) => setFine(e.target.value)} />}</Field>
          <p className="text-[12.5px] text-muted sm:col-span-2">The clip and snapshot are attached. The owner can appeal within 14 days in the resident app.</p>
        </div>
      </Modal>
    </div>
  );
}
