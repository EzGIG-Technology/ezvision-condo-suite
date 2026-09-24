import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bell, CalendarPlus, Camera, Megaphone, Package, Plus, Send, Vote, Wallet, Wrench, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, Checkbox, Chip, Empty, Field, Input, Modal, Progress, Segmented, Select, Switch, Textarea, type ChipTone } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, relative, rm, when } from '@/lib/utils';
import { toast } from '@/store/toast';
import type { Ticket } from '@/data/types';

type Tab = 'announcements' | 'bookings' | 'tickets' | 'fees' | 'parcels' | 'voting';
const TABS: { value: Tab; label: string }[] = [
  { value: 'announcements', label: 'Announcements' }, { value: 'bookings', label: 'Facility bookings' }, { value: 'tickets', label: 'Tickets' },
  { value: 'fees', label: 'Fees' }, { value: 'parcels', label: 'Parcel room' }, { value: 'voting', label: 'E-voting' },
];
const STATES: Ticket['state'][] = ['New', 'Assigned', 'In progress', 'Investigating', 'Monitoring', 'Resolved'];
const stateTone: Record<Ticket['state'], ChipTone> = { New: 'blue', Assigned: 'purple', 'In progress': 'amber', Investigating: 'amber', Monitoring: 'grey', Resolved: 'teal' };
const FACILITIES = ['Function hall', 'BBQ pit 1', 'BBQ pit 2', 'Squash court', 'Tennis court', 'Gym studio'];

export default function Community() {
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'announcements';
  const setTab = (t: Tab) => setParams((p) => { p.set('tab', t); p.delete('compose'); return p; }, { replace: true });
  return (
    <div className="flex flex-col gap-5">
      <Segmented label="Community section" value={tab} onChange={setTab} options={TABS} />
      {tab === 'announcements' && <Announcements />}
      {tab === 'bookings' && <Bookings />}
      {tab === 'tickets' && <Tickets />}
      {tab === 'fees' && <Fees />}
      {tab === 'parcels' && <ParcelRoom />}
      {tab === 'voting' && <Voting />}
    </div>
  );
}

function Announcements() {
  const announcements = useStore((s) => s.announcements);
  const session = useStore((s) => s.session.portal);
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get('compose') === '1');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('All towers');
  const [channels, setChannels] = useState<string[]>(['App push', 'WhatsApp']);
  useEffect(() => { if (params.get('compose') === '1') setOpen(true); }, [params]);
  const close = () => { setOpen(false); if (params.get('compose')) setParams((p) => { p.delete('compose'); return p; }, { replace: true }); };
  const send = () => {
    if (!title.trim() || !body.trim()) return toast.error('Add a title and message');
    if (!channels.length) return toast.error('Pick at least one channel');
    useStore.getState().sendAnnouncement({ title, body, audience, channels, sentBy: session?.name ?? 'Farah Hanim' });
    toast.success('Announcement sent', `${audience} · ${channels.join(', ')}`);
    setTitle(''); setBody(''); close();
  };
  const toggleCh = (c: string) => setChannels((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  const reach = audience === 'All towers' ? 1284 : audience.startsWith('Tower') ? 428 : 212;

  return (
    <Card className="overflow-hidden">
      <div className="p-4"><CardHeader title="Announcements" sub="Sent to residents by app push, WhatsApp and email" action={<Button variant="primary" icon={<Megaphone className="h-4 w-4" />} onClick={() => setOpen(true)}>New announcement</Button>} /></div>
      <ul className="divide-y divide-line-soft">
        {announcements.map((a) => (
          <li key={a.id} className="flex flex-col gap-1.5 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2"><p className="font-bold">{a.title}</p><Chip tone="blue">{a.audience}</Chip>{a.channels.map((c) => <Chip key={c}>{c}</Chip>)}</div>
            <p className="text-[13px] text-muted-dark">{a.body}</p>
            <p className="text-xs text-muted">{when(a.sentAt)} · {a.sentBy} · read by {Math.round(60 + (a.id.length * 7) % 30)}%</p>
          </li>
        ))}
      </ul>
      <Modal open={open} onClose={close} title="New announcement" size="lg"
        footer={<><Button onClick={close}>Cancel</Button><Button variant="primary" icon={<Send className="h-4 w-4" />} onClick={send}>Send to {reach.toLocaleString()} residents</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Title">{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lift maintenance, Tower A" />}</Field>
          <Field label="Message">{(id) => <Textarea id={id} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What, when, and what residents should do" />}</Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Audience">{(id) => <Select id={id} value={audience} onChange={(e) => setAudience(e.target.value)}>{['All towers', 'Tower A', 'Tower B', 'Tower C', 'Owners only', 'Tenants only'].map((o) => <option key={o}>{o}</option>)}</Select>}</Field>
            <div className="flex flex-col gap-1.5"><span className="label">Channels</span><div className="flex flex-wrap gap-3 pt-1.5">{['App push', 'WhatsApp', 'Email', 'Lobby screens'].map((c) => <Checkbox key={c} checked={channels.includes(c)} onChange={() => toggleCh(c)} label={c} />)}</div></div>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

function Bookings() {
  const bookings = useStore((s) => s.bookings);
  const { createBooking, cancelBooking } = useStore.getState();
  const [day, setDay] = useState(0);
  const [open, setOpen] = useState(false);
  const [fac, setFac] = useState(FACILITIES[0]);
  const [unit, setUnit] = useState('');
  const [from, setFrom] = useState(10);
  const [to, setTo] = useState(12);
  const date = new Date(); date.setDate(date.getDate() + day);
  const todays = bookings.filter((b) => b.status === 'confirmed' && new Date(b.date).toDateString() === date.toDateString());
  const H0 = 7, H1 = 23;

  const add = () => {
    if (!unit.trim()) return toast.error('Enter the unit');
    if (to <= from) return toast.error('End time must be after start');
    const clash = todays.some((b) => b.facility === fac && from < b.to && to > b.from);
    if (clash) return toast.error('That slot is taken', `${fac} is already booked in that time.`);
    const d = new Date(date); d.setHours(from, 0, 0, 0);
    const paid = /hall/i.test(fac) ? [150, 300] : /BBQ/.test(fac) ? [30, 100] : [0, 0];
    createBooking({ facility: fac, unit: unit.toUpperCase(), date: d.toISOString(), from, to, fee: paid[0], deposit: paid[1] });
    toast.success('Booking confirmed', `${fac} · ${from}:00 to ${to}:00`);
    setOpen(false); setUnit('');
  };

  return (
    <Card className="p-4">
      <CardHeader title="Facility bookings" sub={date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        action={<Button variant="primary" size="sm" icon={<CalendarPlus className="h-4 w-4" />} onClick={() => setOpen(true)}>Book for a unit</Button>} />
      <div className="mt-3"><Segmented label="Day" value={String(day)} onChange={(v) => setDay(Number(v))} options={[0, 1, 2, 3, 4, 5, 6].map((d) => ({ value: String(d), label: d === 0 ? 'Today' : new Date(Date.now() + d * 864e5).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }) }))} /></div>
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="ml-32 flex text-[11px] text-muted">{Array.from({ length: H1 - H0 }, (_, i) => <span key={i} className="flex-1 border-l border-line-soft pl-1">{H0 + i}:00</span>)}</div>
          {FACILITIES.map((f) => (
            <div key={f} className="flex items-center border-t border-line-soft">
              <span className="w-32 shrink-0 py-3 text-[13px] font-semibold">{f}</span>
              <div className="relative h-10 flex-1">
                {todays.filter((b) => b.facility === f).map((b) => (
                  <div key={b.id} className={cn('absolute top-1 flex h-8 items-center justify-between gap-1 overflow-hidden rounded-lg px-2 text-[11.5px] font-bold', b.unit === 'Management' ? 'bg-grape-soft text-grape-ink' : 'bg-brand-soft text-brand-ink')}
                    style={{ left: `${((b.from - H0) / (H1 - H0)) * 100}%`, width: `${((b.to - b.from) / (H1 - H0)) * 100}%` }}>
                    <span className="truncate">{b.label ?? b.unit}</span>
                    <button type="button" aria-label={`Cancel ${f} booking for ${b.unit}`} onClick={() => { cancelBooking(b.id); toast.info('Booking cancelled', b.deposit ? `Deposit ${rm(b.deposit)} refunded to ${b.unit}.` : undefined); }} className="rounded p-0.5 hover:bg-white/60"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {!todays.length && <p className="mt-3 text-sm text-muted">No bookings on this day.</p>}
      <Modal open={open} onClose={() => setOpen(false)} title="Book a facility for a unit"
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={add}>Confirm booking</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Facility">{(id) => <Select id={id} value={fac} onChange={(e) => setFac(e.target.value)}>{FACILITIES.map((f) => <option key={f}>{f}</option>)}</Select>}</Field>
          <Field label="Unit">{(id) => <Input id={id} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="A-15-07" className="font-mono uppercase" />}</Field>
          <Field label="From">{(id) => <Select id={id} value={from} onChange={(e) => setFrom(Number(e.target.value))}>{Array.from({ length: 16 }, (_, i) => i + 7).map((h) => <option key={h} value={h}>{h}:00</option>)}</Select>}</Field>
          <Field label="To">{(id) => <Select id={id} value={to} onChange={(e) => setTo(Number(e.target.value))}>{Array.from({ length: 16 }, (_, i) => i + 8).map((h) => <option key={h} value={h}>{h}:00</option>)}</Select>}</Field>
        </div>
      </Modal>
    </Card>
  );
}

function Tickets() {
  const tickets = useStore((s) => s.tickets);
  const { setTicketState, createTicket } = useStore.getState();
  const [filter, setFilter] = useState<'open' | 'all' | 'Resolved'>('open');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [unit, setUnit] = useState('');
  const [evidence, setEvidence] = useState(false);
  const list = tickets.filter((t) => (filter === 'all' ? true : filter === 'open' ? t.state !== 'Resolved' : t.state === 'Resolved'));
  const add = () => {
    if (!title.trim()) return toast.error('Describe the issue');
    createTicket({ title, meta: `Raised by management · ${unit ? unit.toUpperCase() : 'common area'}`, evidence, state: 'New', unit: unit || undefined });
    toast.success('Ticket created'); setOpen(false); setTitle(''); setUnit('');
  };
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><h2 className="h2">Tickets</h2><p className="sub">Defects, complaints and by-law cases. Camera clips attach automatically when a detection raised the ticket.</p></div>
        <div className="flex gap-2"><Segmented label="Ticket filter" value={filter} onChange={setFilter} options={[{ value: 'open', label: 'Open' }, { value: 'Resolved', label: 'Resolved' }, { value: 'all', label: 'All' }]} /><Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>New ticket</Button></div>
      </div>
      <ul className="divide-y divide-line-soft">
        {list.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ice text-muted"><Wrench className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1"><p className="font-semibold">{t.title} <span className="font-mono text-xs text-muted">{t.id}</span></p><p className="text-xs text-muted">{t.meta}</p></div>
            {t.evidence && <Chip tone="blue"><Camera className="h-3 w-3" />Clip attached</Chip>}
            <Chip tone={stateTone[t.state]}>{t.state}</Chip>
            <Select aria-label={`Change state of ${t.id}`} value={t.state} onChange={(e) => { setTicketState(t.id, e.target.value as Ticket['state']); toast.info(`${t.id} → ${e.target.value}`); }} className="h-8 w-36 text-xs">
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </li>
        ))}
      </ul>
      {!list.length && <Empty title="No tickets here" />}
      <Modal open={open} onClose={() => setOpen(false)} title="New ticket"
        footer={<><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={add}>Create ticket</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Issue">{(id) => <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Corridor light out, Tower B L9" />}</Field>
          <Field label="Unit (optional)">{(id) => <Input id={id} value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="B-09-02" className="font-mono uppercase" />}</Field>
          <Checkbox checked={evidence} onChange={setEvidence} label="Attach the last camera clip from this area" />
        </div>
      </Modal>
    </Card>
  );
}

function Fees() {
  const restriction = useStore((s) => s.feeRestriction);
  const units = useStore((s) => s.units);
  const setRestriction = useStore((s) => s.setFeeRestriction);
  const arrears = units.filter((u) => !u.feesOk);
  const rows = [
    { unit: 'A-15-04', name: 'Sharmila Devi', owed: 3078, months: 9 },
    { unit: 'B-06-02', name: 'Yusof Hamid', owed: 2052, months: 6 },
    { unit: 'C-11-07', name: 'Cheng Lai Fong', owed: 1026, months: 3 },
    { unit: 'B-19-01', name: 'Ramesh Pillai', owed: 1026, months: 3 },
  ];
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="overflow-hidden">
        <div className="p-4"><CardHeader title="Arrears" sub={`${rows.length + arrears.length - 1} units more than 3 months behind`} action={<Button size="sm" icon={<Bell className="h-4 w-4" />} onClick={() => toast.success('Reminders sent', `${rows.length} units got a push and email with a pay link.`)}>Remind all</Button>} /></div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[560px]">
            <thead><tr><th>Unit</th><th>Owner</th><th>Owed</th><th>Months</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.unit}>
                  <td className="font-mono font-bold">{r.unit}</td><td>{r.name}</td><td className="font-semibold text-danger-ink">{rm(r.owed)}</td><td>{r.months}</td>
                  <td className="text-right"><Button size="sm" variant="ghost" onClick={() => toast.success(`Reminder sent to ${r.unit}`)}>Remind</Button><Button size="sm" variant="ghost" onClick={() => toast.info(`Form 20 notice drafted for ${r.unit}`, 'Saved to Reports for the JMB to sign.')}>Legal notice</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="flex flex-col gap-5">
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="h2">Collection, Q3 2026</h2>
          <p className="text-[28px] font-extrabold tracking-tight">92.4%</p>
          <Progress value={92.4} color="#14A38F" label="Collection rate" />
          <p className="text-xs text-muted">{rm(1_883_000)} of {rm(2_038_000)} collected · 41% by auto-debit</p>
        </Card>
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="h2">Restrict facilities for arrears</h2><p className="sub mt-1">Units more than 3 months behind cannot book facilities or register extra car stickers. Gate access is never restricted.</p></div>
            <Switch checked={restriction} onChange={(v) => { setRestriction(v); toast.info(v ? 'Restriction on' : 'Restriction off', v ? 'Bookings blocked for units in arrears.' : 'All units can book again.'); }} label="Restrict facilities for arrears" />
          </div>
          <Chip tone={restriction ? 'amber' : 'grey'}><Wallet className="h-3 w-3" />{restriction ? 'On, per house rule 22(b)' : 'Off'}</Chip>
        </Card>
      </div>
    </div>
  );
}

function ParcelRoom() {
  const parcels = useStore((s) => s.parcels);
  const [f, setF] = useState<'waiting' | 'collected'>('waiting');
  const list = parcels.filter((p) => p.status === f);
  const old = parcels.filter((p) => p.status === 'waiting' && Date.now() - +new Date(p.loggedAt) > 90 * 60000);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div><h2 className="h2">Parcel room</h2><p className="sub">{parcels.filter((p) => p.status === 'waiting').length} waiting · shelves A to F · logged by guards on the tablet</p></div>
        <div className="flex gap-2"><Segmented label="Parcel status" value={f} onChange={setF} options={[{ value: 'waiting', label: 'Waiting' }, { value: 'collected', label: 'Collected' }]} />
          <Button size="sm" icon={<Bell className="h-4 w-4" />} disabled={!old.length} onClick={() => toast.success('Reminders sent', `${old.length} residents with parcels older than 90 min.`)}>Remind old</Button></div>
      </div>
      <div className="overflow-x-auto">
        <table className="tbl min-w-[720px]">
          <thead><tr><th>Unit</th><th>Recipient</th><th>Courier</th><th>Size</th><th>Shelf</th><th>{f === 'waiting' ? 'Logged' : 'Collected'}</th><th>By</th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}><td className="font-mono font-bold">{p.unit}</td><td>{p.recipient}</td><td>{p.courier}</td><td><Chip tone={p.size === 'Chilled' ? 'blue' : 'grey'}>{p.size}</Chip></td><td className="font-mono">{p.shelf}</td><td>{f === 'waiting' ? relative(p.loggedAt) : when(p.collectedAt)}</td><td className="text-muted-dark">{f === 'waiting' ? p.loggedBy : p.collectedBy}</td></tr>
            ))}
          </tbody>
        </table>
        {!list.length && <Empty icon={<Package className="h-5 w-5" />} title="Nothing here" />}
      </div>
    </Card>
  );
}

function Voting() {
  const [votes, setVotes] = useState({ yes: 318, no: 74, abstain: 22 });
  const [open, setOpen] = useState(false);
  const total = votes.yes + votes.no + votes.abstain;
  const quorum = Math.round((total / 612) * 100);
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3"><div><Chip tone="teal" dot>Open until 30 Sep</Chip><h2 className="mt-2 text-lg font-extrabold">Install 12 EV chargers at B1</h2><p className="sub mt-1">Special resolution · RM 86,000 from the sinking fund · EGM 2026/2</p></div><Vote className="h-6 w-6 text-muted" /></div>
        {([['yes', 'For', '#14A38F'], ['no', 'Against', '#E5484D'], ['abstain', 'Abstain', '#9FB0DB']] as const).map(([k, l, c]) => (
          <div key={k} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[13px]"><span className="font-semibold">{l}</span><span className="font-bold">{votes[k]} · {Math.round((votes[k] / total) * 100)}%</span></div>
            <Progress value={(votes[k] / total) * 100} color={c} label={l} />
          </div>
        ))}
        <p className="text-xs text-muted">{total} of 612 parcels voted · {quorum}% turnout · one vote per unit, weighted by share units</p>
        <div className="flex flex-wrap gap-2">
          <Button icon={<Bell className="h-4 w-4" />} onClick={() => toast.success('Reminder sent', `${612 - total} units that have not voted.`)}>Remind non-voters</Button>
          <Button variant="primary" onClick={() => setOpen(true)}>Record proxy vote</Button>
        </div>
      </Card>
      <Card className="flex flex-col gap-3 p-5">
        <h2 className="h2">Past resolutions</h2>
        {[['Raise maintenance fee to RM 0.78 per sq ft', 'Passed · 71%', 'teal'], ['Ban short-term rentals (Airbnb)', 'Passed · 83%', 'teal'], ['Repaint Tower C facade', 'Not passed · 44%', 'red']].map(([t, r, tone]) => (
          <div key={t} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3"><span className="text-[13px] font-semibold">{t}</span><Chip tone={tone as ChipTone}>{r}</Chip></div>
        ))}
      </Card>
      <Modal open={open} onClose={() => setOpen(false)} title="Record proxy vote" description="For owners who voted on paper at the management office."
        footer={<Button onClick={() => setOpen(false)}>Cancel</Button>}>
        <div className="grid grid-cols-3 gap-2">
          {([['yes', 'For'], ['no', 'Against'], ['abstain', 'Abstain']] as const).map(([k, l]) => (
            <Button key={k} variant={k === 'yes' ? 'teal' : k === 'no' ? 'danger' : 'secondary'} onClick={() => { setVotes((v) => ({ ...v, [k]: v[k] + 1 })); toast.success(`Proxy vote recorded: ${l}`); setOpen(false); }}>{l}</Button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
