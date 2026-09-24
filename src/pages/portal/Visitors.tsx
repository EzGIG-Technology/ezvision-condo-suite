import { useMemo, useState, type FormEvent } from 'react';
import { CalendarPlus, Copy, Download, LogIn, LogOut, Phone, Plus, RefreshCw, Search, Timer, XCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Visit, VisitType } from '@/data/types';
import { Avatar, Card, CardHeader, Chip, Drawer, Empty, Field, Input, Modal, Plate, Segmented, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { FaceCrop } from '@/components/vision';
import { colorFor, visitStatusLabel, visitStatusTone, visitTypeLabel, visitTypeTone } from '@/lib/labels';
import { cn, downloadFile, hhmm, maskPhone, relative, toCsv, todayStamp, when } from '@/lib/utils';
import { toast } from '@/store/toast';

type Tab = 'on_site' | 'expected' | 'all' | 'recurring';
const TYPES: ('all' | VisitType)[] = ['all', 'guest', 'contractor', 'rider', 'helper', 'tutor'];

function RegisterModal({ open, onClose, event }: { open: boolean; onClose: () => void; event?: boolean }) {
  const units = useStore((s) => s.units);
  const createVisit = useStore((s) => s.createVisit);
  const [f, setF] = useState({ name: '', phone: '', unit: units[0].unit, type: 'guest' as VisitType, plate: '', hours: '4', people: '20', title: 'Birthday party' });
  const [err, setErr] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!event && (!f.name.trim() || f.phone.replace(/\D/g, '').length < 9)) return setErr('Enter the visitor name and a valid mobile number.');
    const u = units.find((x) => x.unit === f.unit)!;
    const now = new Date();
    createVisit({
      name: event ? `${f.title} · ${f.people} guests` : f.name.trim(), phone: event ? '—' : f.phone, type: event ? 'event' : f.type, unit: f.unit, host: u.name.replace(' (tenant)', ''),
      plate: f.plate.trim().toUpperCase() || undefined, status: 'expected', validFrom: now.toISOString(), validTo: new Date(now.getTime() + +f.hours * 3600_000).toISOString(),
      selfie: false, faceVariant: 1 + Math.floor(Math.random() * 8), people: event ? +f.people : 1, createdBy: 'management',
    });
    toast.success(event ? 'Event pass created' : 'Visitor registered', event ? `${f.people} guests for ${f.unit}. Each guest gets the link by WhatsApp.` : `${f.name} can enter for the next ${f.hours} hours.`);
    setErr('');
    setF({ ...f, name: '', phone: '', plate: '' });
    onClose();
  };
  return (
    <Modal open={open} onClose={onClose} title={event ? 'Create an event pass' : 'Register a visitor'} description={event ? 'One link for all guests of a party or gathering.' : 'The visitor gets a QR pass by WhatsApp.'}
      footer={<><Button onClick={onClose}>Cancel</Button><Button type="submit" form="reg" variant="primary">{event ? 'Create event pass' : 'Register and send pass'}</Button></>}>
      <form id="reg" onSubmit={submit} className="grid gap-3 sm:grid-cols-2" noValidate>
        {event ? (
          <>
            <Field label="Event name" className="sm:col-span-2">{(id) => <Input id={id} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />}</Field>
            <Field label="Guests">{(id) => <Input id={id} type="number" min={1} max={60} value={f.people} onChange={(e) => setF({ ...f, people: e.target.value })} />}</Field>
          </>
        ) : (
          <>
            <Field label="Visitor name">{(id) => <Input id={id} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Full name" />}</Field>
            <Field label="Mobile number">{(id) => <Input id={id} type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="012-345 6789" />}</Field>
            <Field label="Type">{(id) => <Select id={id} value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as VisitType })}>{TYPES.slice(1).map((t) => <option key={t} value={t}>{visitTypeLabel[t as VisitType]}</option>)}</Select>}</Field>
          </>
        )}
        <Field label="Host unit">{(id) => <Select id={id} value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{units.filter((u) => u.tag !== 'Vacant').map((u) => <option key={u.unit} value={u.unit}>{u.unit} · {u.name}</option>)}</Select>}</Field>
        <Field label="Valid for">{(id) => <Select id={id} value={f.hours} onChange={(e) => setF({ ...f, hours: e.target.value })}><option value="2">2 hours</option><option value="4">4 hours</option><option value="8">8 hours</option><option value="24">24 hours</option></Select>}</Field>
        {!event && <Field label="Car plate (optional)">{(id) => <Input id={id} value={f.plate} onChange={(e) => setF({ ...f, plate: e.target.value })} placeholder="e.g. VFB 1180" className="font-mono uppercase" />}</Field>}
        {err && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-[13px] font-semibold text-danger-ink sm:col-span-2">{err}</p>}
      </form>
    </Modal>
  );
}

function VisitDrawer({ v, onClose }: { v?: Visit; onClose: () => void }) {
  const { checkInVisit, checkOutVisit, extendVisit, cancelVisit } = useStore.getState();
  if (!v) return null;
  const link = `${window.location.origin}/v/${v.id}`;
  return (
    <Drawer open={!!v} onClose={onClose} title="Visit details">
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3.5">
          <FaceCrop variant={v.faceVariant} className="w-20" />
          <div className="flex flex-col gap-1"><span className="text-lg font-extrabold">{v.name}</span><span className="font-mono text-xs text-muted">{maskPhone(v.phone)}</span><div className="flex gap-1.5"><Chip tone={visitTypeTone[v.type]}>{visitTypeLabel[v.type]}</Chip><Chip tone={visitStatusTone[v.status]}>{visitStatusLabel[v.status]}</Chip></div></div>
        </div>
        <dl className="grid grid-cols-2 gap-2.5 text-[13px]">
          {[['Host', `${v.unit} · ${v.host}`], ['Pass', `${hhmm(v.validFrom)} to ${hhmm(v.validTo)}`], ['Entry', v.entry ?? '—'], ['Verification', v.verification ?? 'Not yet'], ['Checked in', v.checkIn ? when(v.checkIn) : '—'], ['Checked out', v.checkOut ? when(v.checkOut) : '—'], ['People', String(v.people)], ['Selfie', v.selfie ? 'Pre-enrolled' : 'No']].map(([k, val]) => (
            <div key={k} className="rounded-xl bg-ice p-2.5"><dt className="text-[11.5px] font-bold text-muted">{k}</dt><dd className="font-bold">{val}</dd></div>
          ))}
        </dl>
        {v.plate && <div className="flex items-center gap-2 text-[13px] font-semibold">Vehicle <Plate>{v.plate}</Plate></div>}
        <div className="grid grid-cols-2 gap-2">
          {v.status === 'expected' && <Button variant="primary" icon={<LogIn className="h-4 w-4" />} onClick={() => { checkInVisit(v.id, 'Manual · portal'); toast.success(`${v.name} checked in`); }}>Check in</Button>}
          {v.status === 'on_site' && <Button variant="primary" icon={<LogOut className="h-4 w-4" />} onClick={() => { checkOutVisit(v.id); toast.success(`${v.name} checked out`); }}>Check out</Button>}
          {(v.status === 'expected' || v.status === 'on_site') && <Button icon={<Timer className="h-4 w-4" />} onClick={() => { extendVisit(v.id, 1); toast.success('Pass extended by 1 hour'); }}>Extend 1 h</Button>}
          <Button icon={<Copy className="h-4 w-4" />} onClick={() => { navigator.clipboard?.writeText(link).catch(() => undefined); toast.success('Pass link copied', link); }}>Copy pass link</Button>
          {v.status === 'expected' && <Button variant="danger" icon={<XCircle className="h-4 w-4" />} onClick={() => { cancelVisit(v.id); toast.info('Pass cancelled'); onClose(); }}>Cancel pass</Button>}
        </div>
      </div>
    </Drawer>
  );
}

export default function Visitors() {
  const visits = useStore((s) => s.visits);
  const approvals = useStore((s) => s.approvals);
  const respond = useStore((s) => s.respondApproval);
  const extendVisit = useStore((s) => s.extendVisit);
  const [tab, setTab] = useState<Tab>('on_site');
  const [type, setType] = useState<(typeof TYPES)[number]>('all');
  const [tower, setTower] = useState('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [reg, setReg] = useState<null | 'visitor' | 'event'>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const waiting = approvals.filter((a) => a.status === 'waiting');
  const recurring = visits.filter((v) => v.recurringDays);

  const rows = useMemo(() => {
    let l = [...visits].sort((a, b) => +new Date(b.checkIn ?? b.validFrom) - +new Date(a.checkIn ?? a.validFrom));
    if (tab === 'on_site') l = l.filter((v) => v.status === 'on_site');
    if (tab === 'expected') l = l.filter((v) => v.status === 'expected');
    if (tab === 'recurring') l = l.filter((v) => v.recurringDays);
    if (type !== 'all') l = l.filter((v) => v.type === type);
    if (tower !== 'all') l = l.filter((v) => v.unit.startsWith(tower));
    if (q) l = l.filter((v) => `${v.name} ${v.unit} ${v.plate ?? ''} ${v.host}`.toLowerCase().includes(q.toLowerCase()));
    return l;
  }, [visits, tab, type, tower, q]);
  const PAGE = 8;
  const pageRows = rows.slice(page * PAGE, page * PAGE + PAGE);

  const exportCsv = () => {
    downloadFile(`visitor-log-${todayStamp()}.csv`, toCsv([['Name', 'Type', 'Unit', 'Host', 'Plate', 'Entry', 'In', 'Out', 'Pass until', 'Verification', 'Status'],
      ...rows.map((v) => [v.name, v.type, v.unit, v.host, v.plate, v.entry, when(v.checkIn), when(v.checkOut), when(v.validTo), v.verification, v.status])]));
    toast.success('Visitor log exported', `${rows.length} rows`);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Visitor views" value={tab} onChange={(t) => { setTab(t); setPage(0); }} options={[
          { value: 'on_site', label: `On site · ${visits.filter((v) => v.status === 'on_site').length}` }, { value: 'expected', label: `Expected · ${visits.filter((v) => v.status === 'expected').length}` },
          { value: 'all', label: 'All visits' }, { value: 'recurring', label: `Recurring · ${recurring.length}` },
        ]} />
        <span className="flex-1" />
        <Button icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Export</Button>
        <Button icon={<CalendarPlus className="h-4 w-4" />} onClick={() => setReg('event')}>Event pass</Button>
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setReg('visitor')}>Register visitor</Button>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 p-4">
          <label className="flex h-10 w-full items-center gap-2 rounded-[10px] border border-line-strong px-3 text-muted sm:w-72">
            <Search className="h-4 w-4" /><span className="sr-only">Search visitors</span>
            <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Name, unit or plate" className="min-w-0 flex-1 bg-transparent text-[13px] text-navy outline-none" />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TYPES.map((t) => (
              <button key={t} type="button" onClick={() => { setType(t); setPage(0); }} aria-pressed={type === t} className={cn('h-9 rounded-full border px-3 text-[12.5px] font-semibold', type === t ? 'border-navy bg-navy text-white' : 'border-line-strong bg-white text-muted-dark hover:border-navy')}>
                {t === 'all' ? 'All types' : visitTypeLabel[t]}
              </button>
            ))}
          </div>
          <span className="flex-1" />
          <label className="flex items-center gap-2 text-[12.5px] font-bold text-muted-dark">Tower
            <Select value={tower} onChange={(e) => { setTower(e.target.value); setPage(0); }} className="w-auto"><option value="all">All towers</option><option value="A">Tower A</option><option value="B">Tower B</option><option value="C">Tower C</option></Select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[960px]">
            <thead><tr><th>Visitor</th><th>Type</th><th>Host</th><th>Entry</th><th>Vehicle</th><th>In</th><th>Pass until</th><th>Verification</th><th>Status</th></tr></thead>
            <tbody>
              {pageRows.map((v) => {
                const over = v.status === 'on_site' && new Date(v.validTo) < new Date();
                return (
                  <tr key={v.id} className="clickable" onClick={() => setOpenId(v.id)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setOpenId(v.id)} aria-label={`Open ${v.name}`}>
                    <td><div className="flex items-center gap-2.5"><Avatar name={v.name} color={colorFor(v.name)} /><div className="flex flex-col"><span className="font-bold">{v.name}</span><span className="font-mono text-[11.5px] text-muted">{maskPhone(v.phone)}</span></div></div></td>
                    <td><Chip tone={visitTypeTone[v.type]}>{visitTypeLabel[v.type]}</Chip></td>
                    <td><div className="flex flex-col"><span className="font-bold">{v.unit}</span><span className="text-[11.5px] text-muted">{v.host}</span></div></td>
                    <td>{v.entry ?? '—'}</td>
                    <td>{v.plate ? <Plate>{v.plate}</Plate> : <span className="text-muted">On foot</span>}</td>
                    <td className="font-mono text-[12.5px]">{v.checkIn ? hhmm(v.checkIn) : '—'}</td>
                    <td className="font-mono text-[12.5px]">{when(v.validTo)}</td>
                    <td className="text-xs text-muted-dark">{v.verification ?? '—'}</td>
                    <td><Chip tone={over ? 'red' : visitStatusTone[v.status]}>{over ? 'Overstay' : visitStatusLabel[v.status]}</Chip></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <Empty title="No visitors here" body="Try another tab or clear the filters." />}
        </div>
        <div className="flex items-center justify-between p-3 px-4 text-[12.5px] text-muted">
          <span>Showing {rows.length ? page * PAGE + 1 : 0}–{Math.min(rows.length, page * PAGE + PAGE)} of {rows.length}</span>
          <div className="flex gap-1.5"><Button size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button><Button size="sm" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage(page + 1)}>Next</Button></div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="flex flex-col gap-3 p-5">
          <CardHeader title="Walk-ins waiting for resident approval" action={<Chip tone={waiting.length ? 'amber' : 'teal'}>{waiting.length} waiting</Chip>} />
          {waiting.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#F7F9FD] p-3">
              <FaceCrop variant={a.faceVariant} className="w-12" />
              <div className="flex min-w-0 flex-1 flex-col"><span className="text-[13.5px] font-bold">{a.visitorName} → {a.unit}</span><span className="text-xs text-muted">{a.purpose} · waiting {relative(a.createdAt)}</span></div>
              <div className="flex gap-1.5">
                <Button size="sm" icon={<Phone className="h-3.5 w-3.5" />} onClick={() => toast.info(`Calling ${a.unit}`, 'The guardhouse line is ringing the unit.')}>Call</Button>
                <Button size="sm" variant="primary" onClick={() => { respond(a.id, true, 'Management (by phone)'); toast.success(`${a.visitorName} approved`, 'The guard can let them in now.'); }}>Approve</Button>
                <Button size="sm" variant="ghost" onClick={() => { respond(a.id, false, 'Management'); toast.info(`${a.visitorName} declined`); }}>Decline</Button>
              </div>
            </div>
          ))}
          {!waiting.length && <Empty title="No one waiting" body="New walk-in requests from the guardhouse appear here." />}
        </Card>
        <Card className="flex flex-col gap-2 p-5">
          <CardHeader title="Recurring passes" sub="Helpers, drivers and tutors" />
          {recurring.map((v) => (
            <div key={v.id} className="flex items-center gap-3 border-t border-line-soft py-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-grape-soft text-grape-ink"><RefreshCw className="h-4 w-4" /></span>
              <div className="flex min-w-0 flex-1 flex-col"><span className="text-[13.5px] font-bold">{v.name} · {visitTypeLabel[v.type].toLowerCase()} for {v.unit}</span><span className="text-xs text-muted">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].filter((_, i) => v.recurringDays![i]).length} days a week · {hhmm(v.validFrom)} to {hhmm(v.validTo)}</span></div>
              <Button size="sm" onClick={() => { extendVisit(v.id, 24 * 30); toast.success('Renewed for 30 days', v.name); }}>Renew</Button>
            </div>
          ))}
        </Card>
      </div>
      <RegisterModal open={reg !== null} event={reg === 'event'} onClose={() => setReg(null)} />
      <VisitDrawer v={visits.find((v) => v.id === openId)} onClose={() => setOpenId(null)} />
    </div>
  );
}
