import { useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, CircleAlert, Plus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { LiftBooking, Permit } from '@/data/types';
import { Card, CardHeader, Checkbox, Chip, Drawer, Empty, Field, Input, Modal, Segmented, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { FaceCrop } from '@/components/vision';
import { permitLabel, permitTone } from '@/lib/labels';
import { cn, rm, when } from '@/lib/utils';
import { toast } from '@/store/toast';
import { useMinWidth } from '@/lib/hooks';
import { MOVE_DEPOSIT, MOVE_SLOTS, slotTaken } from '@/lib/moves';

type Tab = 'active' | 'review' | 'all';

function PermitDetail({ p }: { p: Permit }) {
  const { setPermitStatus, markDepositPaid, createTicket } = useStore.getState();
  const [modal, setModal] = useState<null | 'changes' | 'reject'>(null);
  const [comment, setComment] = useState('Please upload a public liability insurance certificate valid until the end of the works.');
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1"><span className="font-mono text-xs font-bold text-muted">{p.id} · submitted {when(p.submittedAt)}</span><h3 className="text-lg font-extrabold leading-snug">{p.unit} · {p.scope}</h3><span className="sub">Owner {p.owner} · {p.contractor}</span></div>
        <Chip tone={permitTone[p.status]}>{permitLabel[p.status]}</Chip>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[['Dates', `${p.start} to ${p.end}`], ['Working hours', p.hours], ['Deposit', `${rm(p.deposit)} · ${p.depositPaid ? 'paid' : 'unpaid'}`], ['Allowed zones', p.zones]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-ice p-2.5"><div className="text-[11.5px] font-semibold text-muted">{k}</div><div className="text-[13px] font-bold">{v}</div></div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Documents</span>
        {p.docs.map((d) => (
          <div key={d.name} className="flex items-center gap-2.5 text-[13px] font-semibold">
            <span className={cn('flex h-[22px] w-[22px] items-center justify-center rounded-full', d.ok ? 'bg-teal-soft text-teal-dark' : 'bg-warn-soft text-warn-ink')}>{d.ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <CircleAlert className="h-3.5 w-3.5" />}</span>
            <span className="flex-1">{d.name}</span><span className={cn('text-xs', d.ok ? 'text-teal-dark' : 'text-warn-ink')}>{d.note}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <span className="eyebrow">Workers · {p.workers.length}</span>
        {p.workers.map((w) => (
          <div key={w.name} className="flex items-center gap-2.5">
            <FaceCrop variant={w.variant} className="w-9" rounded="rounded-lg" />
            <div className="flex flex-1 flex-col"><span className="text-[13px] font-bold">{w.name}</span><span className="font-mono text-[11.5px] text-muted">{w.id}</span></div>
            <Chip tone={w.enrolled ? 'teal' : 'grey'}>{w.enrolled ? 'Face enrolled' : 'Invite sent'}</Chip>
          </div>
        ))}
      </div>
      {(p.status === 'review' || p.status === 'changes_requested') && (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => setModal('changes')}>Request changes</Button>
          <Button variant="primary" onClick={() => { setPermitStatus(p.id, p.depositPaid ? 'active' : 'awaiting_deposit'); toast.success(`${p.id} approved`, 'The owner and contractor are notified. Workers get entry links.'); }}>Approve permit</Button>
          <Button variant="ghost" className="col-span-2 text-danger-ink" onClick={() => setModal('reject')}>Reject application</Button>
        </div>
      )}
      {p.status === 'awaiting_deposit' && <Button variant="primary" onClick={() => { markDepositPaid(p.id); toast.success('Deposit recorded', `${p.id} is now active`); }}>Mark deposit as paid</Button>}
      {p.status === 'breach' && (
        <div className="flex flex-col gap-2 rounded-xl bg-danger-soft p-3">
          <p className="text-[13px] font-semibold text-danger-ink">A worker stayed 4 hours past the permitted hours yesterday.</p>
          <Button variant="danger" onClick={() => { createTicket({ title: `Permit breach warning ${p.id}`, meta: `${p.unit} · worker overstay`, evidence: true, state: 'Assigned', unit: p.unit }); setPermitStatus(p.id, 'active'); toast.success('Warning issued', 'Logged as a ticket and sent to the owner and contractor.'); }}>Issue warning</Button>
        </div>
      )}
      {(p.status === 'active' || p.status === 'ending') && <Button onClick={() => { setPermitStatus(p.id, 'completed'); toast.success(`${p.id} marked complete`, 'Deposit refund starts after the inspection.'); }}>Mark works complete</Button>}
      <Modal open={modal === 'changes'} onClose={() => setModal(null)} title="Request changes" description="The owner sees this in the resident app."
        footer={<><Button onClick={() => setModal(null)}>Cancel</Button><Button variant="primary" onClick={() => { setPermitStatus(p.id, 'changes_requested'); setModal(null); toast.success('Changes requested'); }}>Send</Button></>}>
        <Field label="What needs to change">{(id) => <Textarea id={id} value={comment} onChange={(e) => setComment(e.target.value)} />}</Field>
      </Modal>
      <Modal open={modal === 'reject'} onClose={() => setModal(null)} title={`Reject ${p.id}?`} description="The owner can apply again."
        footer={<><Button onClick={() => setModal(null)}>Cancel</Button><Button variant="danger" onClick={() => { setPermitStatus(p.id, 'rejected'); setModal(null); toast.info(`${p.id} rejected`); }}>Reject</Button></>}>
        <Field label="Reason">{(id) => <Textarea id={id} defaultValue="Works of this type need an engineer's letter. Please reapply with one." />}</Field>
      </Modal>
    </div>
  );
}

function LiftCalendar() {
  const bookings = useStore((s) => s.liftBookings);
  const session = useStore((s) => s.session.portal);
  const { createLiftBooking, setLiftStatus, setLiftChecklist, log } = useStore.getState();
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<LiftBooking | null>(null);
  const [f, setF] = useState({ unit: 'A-15-07', what: 'Move-in', day: '1', slot: MOVE_SLOTS[0], mover: '', plate: '', crew: '3' });
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 2 + i); return d; });
  const requests = bookings.filter((b) => b.status === 'requested').sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const live = sel ? bookings.find((b) => b.id === sel.id) ?? sel : null;
  const who = session?.name ?? 'Farah Hanim';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[A-C]-\d{2}-\d{2}$/.test(f.unit)) return toast.error('Enter a unit like A-15-07');
    const d = new Date(); d.setDate(d.getDate() + +f.day); d.setHours(9, 0, 0, 0);
    const lift = `Tower ${f.unit[0]} service lift`;
    if (slotTaken(bookings, lift, d, f.slot)) return toast.error('That slot is taken', `${lift} is already booked then.`);
    const kind = f.what === 'Move-out' ? 'move_out' : f.what === 'Delivery' ? 'delivery' : 'move_in';
    const isMove = kind !== 'delivery';
    const id = createLiftBooking({
      date: d.toISOString(), slot: f.slot, what: f.what, unit: f.unit, lift, kind, status: 'requested', requestedBy: 'management',
      mover: f.mover.trim() || undefined, lorryPlate: f.plate.trim().toUpperCase() || undefined, crew: Number(f.crew),
      deposit: isMove ? MOVE_DEPOSIT : 0, depositPaid: !isMove, checklist: { pre: false, post: false },
    });
    setLiftStatus(id, 'approved');
    log({ who, role: 'Building Manager', action: 'Added', record: `Service lift booking ${f.what} ${f.unit}` });
    setOpen(false);
    toast.success('Service lift booked', `${f.what} · ${f.unit} · ${f.slot}`);
  };
  const decide = (b: LiftBooking, status: 'approved' | 'rejected' | 'completed') => {
    setLiftStatus(b.id, status);
    log({ who, role: 'Building Manager', action: status === 'approved' ? 'Approved' : status === 'completed' ? 'Closed' : 'Changed', record: `Service lift booking ${b.what} ${b.unit}` });
    toast.success(status === 'approved' ? 'Move approved' : status === 'rejected' ? 'Move not approved' : 'Move closed', status === 'approved' ? `The guard now expects ${b.lorryPlate ?? 'the mover'}.` : status === 'completed' && b.depositPaid && b.deposit ? `Deposit ${rm(b.deposit)} refunded to ${b.unit}.` : `${b.unit} has been notified.`);
    if (status !== 'approved') setSel(null);
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <CardHeader title="Service lift bookings" sub="Move-ins, move-outs and bulk deliveries · the lift is padded and locked to the booking" action={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Add booking</Button>} />
      {requests.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl bg-warn-soft p-3">
          <p className="text-[13px] font-bold text-warn-ink">{requests.length} move request{requests.length > 1 ? 's' : ''} from residents</p>
          {requests.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-2.5 text-[13px]">
              <span className="min-w-0 flex-1"><span className="font-bold">{b.what} · {b.unit}</span><span className="block text-xs text-muted">{new Date(b.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {b.slot} · {b.mover} · {b.lorryPlate} · deposit {b.depositPaid ? 'paid' : 'unpaid'}</span></span>
              <Button size="sm" onClick={() => decide(b, 'rejected')}>Reject</Button>
              <Button size="sm" variant="primary" onClick={() => decide(b, 'approved')}>Approve</Button>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
        {days.map((d) => {
          const items = bookings.filter((b) => b.status !== 'rejected' && new Date(b.date).toDateString() === d.toDateString());
          const today = d.toDateString() === new Date().toDateString();
          return (
            <div key={d.toISOString()} className={cn('flex min-h-[140px] flex-col gap-2 rounded-xl p-2.5', today ? 'bg-brand-soft' : 'bg-[#F7F9FD]')}>
              <div className="flex items-baseline justify-between"><span className="text-[12.5px] font-extrabold">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span><span className="text-[11.5px] text-muted">{d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span></div>
              {items.map((b) => (
                <button type="button" key={b.id} onClick={() => setSel(b)} className="flex flex-col gap-0.5 rounded-lg bg-white p-2 text-left hover:ring-2 hover:ring-brand/30" style={{ boxShadow: `inset 3px 0 0 ${b.kind === 'move_out' ? '#F59E0B' : b.kind === 'delivery' ? '#14A38F' : '#1D4FE0'}` }}>
                  <span className="font-mono text-[11px] font-bold text-muted">{b.slot}</span><span className="text-xs font-bold">{b.what} · {b.unit}</span><span className="text-[11px] text-muted">{b.status === 'requested' ? 'Waiting for approval' : b.status === 'completed' ? 'Completed' : b.lift}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Book the service lift"
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="lift" variant="primary">Book</Button></>}>
        <form id="lift" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          <Field label="Unit">{(id) => <Input id={id} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value.toUpperCase() })} />}</Field>
          <Field label="Purpose">{(id) => <Select id={id} value={f.what} onChange={(e) => setF({ ...f, what: e.target.value })}><option>Move-in</option><option>Move-out</option><option>Delivery</option></Select>}</Field>
          <Field label="Day">{(id) => <Select id={id} value={f.day} onChange={(e) => setF({ ...f, day: e.target.value })}>{[0, 1, 2, 3, 4].map((n) => { const d = new Date(); d.setDate(d.getDate() + n); return <option key={n} value={n}>{d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</option>; })}</Select>}</Field>
          <Field label="Slot">{(id) => <Select id={id} value={f.slot} onChange={(e) => setF({ ...f, slot: e.target.value })}>{MOVE_SLOTS.map((sl) => <option key={sl}>{sl}</option>)}</Select>}</Field>
          <Field label="Mover or supplier">{(id) => <Input id={id} value={f.mover} onChange={(e) => setF({ ...f, mover: e.target.value })} placeholder="e.g. Lori Express Movers" />}</Field>
          <Field label="Lorry plate">{(id) => <Input id={id} value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value })} placeholder="BPK 3321" className="font-mono uppercase" />}</Field>
        </form>
      </Modal>
      <Modal open={!!live} onClose={() => setSel(null)} title={live ? `${live.what} · ${live.unit}` : ''} description={live ? `${new Date(live.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })} · ${live.slot} · ${live.lift}` : ''}
        footer={live && <>
          <Button onClick={() => setSel(null)}>Close</Button>
          {live.status === 'requested' && <><Button onClick={() => decide(live, 'rejected')}>Reject</Button><Button variant="primary" onClick={() => decide(live, 'approved')}>Approve</Button></>}
          {(live.status ?? 'approved') === 'approved' && <Button variant="primary" disabled={!!live.checklist && !live.checklist.post} onClick={() => decide(live, 'completed')}>{live.depositPaid && live.deposit ? `Close and refund ${rm(live.deposit)}` : 'Mark completed'}</Button>}
        </>}>
        {live && (
          <div className="flex flex-col gap-3">
            <dl className="grid grid-cols-2 gap-2 text-[13px]">
              <div><dt className="text-xs text-muted">Mover</dt><dd className="font-semibold">{live.mover ?? '—'}</dd></div>
              <div><dt className="text-xs text-muted">Lorry plate</dt><dd className="font-mono font-semibold">{live.lorryPlate ?? '—'}</dd></div>
              <div><dt className="text-xs text-muted">Crew</dt><dd className="font-semibold">{live.crew ?? '—'}</dd></div>
              <div><dt className="text-xs text-muted">Damage deposit</dt><dd className="font-semibold">{live.deposit ? `${rm(live.deposit)} · ${live.depositRefunded ? 'refunded' : live.depositPaid ? 'paid' : 'unpaid'}` : 'None'}</dd></div>
            </dl>
            {live.checklist && live.status !== 'requested' && live.status !== 'rejected' && (
              <div className="flex flex-col gap-2 rounded-xl bg-ice p-3">
                <p className="text-xs font-bold text-muted-dark">Inspection checklist</p>
                <Checkbox checked={live.checklist.pre} onChange={(v) => setLiftChecklist(live.id, 'pre', v)} label="Before the move: lift padded, lobby and lift photographed" />
                <Checkbox checked={live.checklist.post} onChange={(v) => setLiftChecklist(live.id, 'post', v)} label="After the move: no damage to lift, walls or floors" />
                {!live.checklist.post && live.status === 'approved' && <p className="text-[11.5px] text-muted">Tick the after-move inspection to close the booking and refund the deposit.</p>}
              </div>
            )}
          </div>
        )}
      </Modal>
    </Card>
  );
}

function NewPermitModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const units = useStore((s) => s.units);
  const createPermit = useStore((s) => s.createPermit);
  const [f, setF] = useState({ unit: units[0].unit, scope: '', contractor: '', start: '', end: '', deposit: '1000' });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.scope || !f.contractor) return toast.error('Fill in the work and contractor');
    const u = units.find((x) => x.unit === f.unit)!;
    const id = createPermit({ kind: 'renovation', unit: f.unit, owner: u.owner, scope: f.scope, contractor: f.contractor, workers: [], start: f.start || 'TBC', end: f.end || 'TBC', hours: 'Mon to Sat, 09:00 to 17:30', zones: `Tower ${f.unit[0]} · service lift`, deposit: +f.deposit, depositPaid: false, docs: [{ name: 'Floor plan with work marked', ok: false, note: 'Missing' }, { name: 'Contractor SSM registration', ok: false, note: 'Missing' }] });
    toast.success(`${id} created`, 'The owner is asked to upload documents.');
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title="New renovation permit" footer={<><Button onClick={onClose}>Cancel</Button><Button type="submit" form="np" variant="primary">Create permit</Button></>}>
      <form id="np" onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="Unit">{(id) => <Select id={id} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{units.map((u) => <option key={u.unit}>{u.unit}</option>)}</Select>}</Field>
        <Field label="Deposit (RM)">{(id) => <Input id={id} type="number" value={f.deposit} onChange={(e) => setF({ ...f, deposit: e.target.value })} />}</Field>
        <Field label="Work" className="sm:col-span-2">{(id) => <Input id={id} value={f.scope} onChange={(e) => setF({ ...f, scope: e.target.value })} placeholder="e.g. Bathroom re-tiling" />}</Field>
        <Field label="Contractor company" className="sm:col-span-2">{(id) => <Input id={id} value={f.contractor} onChange={(e) => setF({ ...f, contractor: e.target.value })} />}</Field>
        <Field label="Start">{(id) => <Input id={id} type="date" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />}</Field>
        <Field label="End">{(id) => <Input id={id} type="date" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} />}</Field>
      </form>
    </Modal>
  );
}

export default function Permits() {
  const permits = useStore((s) => s.permits);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get('id') ? 'all' : 'active');
  const [newOpen, setNewOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const isXl = useMinWidth(1280);
  const list = useMemo(() => permits.filter((p) => (tab === 'active' ? ['active', 'ending', 'breach', 'awaiting_deposit'].includes(p.status) : tab === 'review' ? ['review', 'changes_requested'].includes(p.status) : true)), [permits, tab]);
  const selId = params.get('id') ?? list[0]?.id;
  const sel = permits.find((p) => p.id === selId);
  const select = (id: string) => { setParams({ id }); setMobile(true); };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Permit views" value={tab} onChange={setTab} options={[
          { value: 'active', label: `Active · ${permits.filter((p) => ['active', 'ending', 'breach', 'awaiting_deposit'].includes(p.status)).length}` },
          { value: 'review', label: `Applications · ${permits.filter((p) => ['review', 'changes_requested'].includes(p.status)).length}` },
          { value: 'all', label: 'All permits' },
        ]} />
        <span className="flex-1" />
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setNewOpen(true)}>New permit</Button>
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl min-w-[780px]">
              <thead><tr><th>Permit</th><th>Unit and scope</th><th>Contractor</th><th>Workers</th><th>Period</th><th>Deposit</th><th>Status</th></tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className={cn('clickable', sel?.id === p.id && 'bg-[#EEF3FF]')} tabIndex={0} onClick={() => select(p.id)} onKeyDown={(e) => e.key === 'Enter' && select(p.id)} aria-label={`Open ${p.id}`}>
                    <td className="font-mono text-[12.5px] font-bold">{p.id}</td>
                    <td><div className="flex flex-col"><span className="font-bold">{p.unit}</span><span className="text-xs text-muted">{p.scope}</span></div></td>
                    <td>{p.contractor}</td>
                    <td><span className="font-bold">{p.onSite}</span><span className="text-muted"> / {p.workers.length}</span></td>
                    <td className="text-[12.5px]">{p.start} to {p.end}</td>
                    <td className="text-[12.5px]">{rm(p.deposit)} {p.depositPaid ? 'paid' : <span className="font-bold text-warn-ink">unpaid</span>}</td>
                    <td><Chip tone={permitTone[p.status]}>{permitLabel[p.status]}</Chip></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && <Empty title="Nothing here" body="No permits in this view." />}
          </div>
        </Card>
        <Card className="hidden p-5 xl:block">{sel ? <PermitDetail key={sel.id} p={sel} /> : <Empty title="Select a permit" />}</Card>
      </div>
      <div><Drawer open={mobile && !!sel && !isXl} onClose={() => setMobile(false)} title="Permit">{sel && <div className="p-5"><PermitDetail p={sel} /></div>}</Drawer></div>
      <LiftCalendar />
      <NewPermitModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
