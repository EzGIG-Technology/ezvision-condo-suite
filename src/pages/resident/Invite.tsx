import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Contact, Minus, Plus, Send } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Checkbox, Field, Input, Select, Switch, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { visitTypeLabel } from '@/lib/labels';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import type { VisitType } from '@/data/types';

const TYPES: VisitType[] = ['guest', 'family', 'helper', 'tutor', 'contractor', 'driver', 'event'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CONTACTS = [{ name: 'Nurul Izzati', phone: '012-708 4418' }, { name: 'Mum and Dad', phone: '012-300 7713' }, { name: 'Sri Rahayu', phone: '011-398 2208' }];

const toInputDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function ResidentInvite() {
  useDocumentTitle('Invite a visitor');
  const resident = useStore((s) => s.resident);
  const createVisit = useStore((s) => s.createVisit);
  const navigate = useNavigate();
  const now = new Date();
  const [type, setType] = useState<VisitType>('guest');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState(toInputDate(now));
  const [from, setFrom] = useState(`${String(Math.min(now.getHours() + 1, 22)).padStart(2, '0')}:00`);
  const [to, setTo] = useState('23:30');
  const [driving, setDriving] = useState(false);
  const [plate, setPlate] = useState('');
  const [people, setPeople] = useState(1);
  const [recurring, setRecurring] = useState(false);
  const [days, setDays] = useState([true, true, true, true, true, false, false]);
  const [note, setNote] = useState('');
  const [selfie, setSelfie] = useState(true);
  const [loading, setLoading] = useState(false);

  const canRecur = type === 'helper' || type === 'tutor' || type === 'driver';

  const pickContact = () => {
    const c = CONTACTS[Math.floor(Math.random() * CONTACTS.length)];
    setName(c.name); setPhone(c.phone);
    toast.info('Contact added', c.name);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter your visitor's name");
    if (phone.replace(/\D/g, '').length < 9) return toast.error('Enter a valid mobile number', 'The pass is sent there by WhatsApp.');
    if (driving && !plate.trim()) return toast.error('Enter the car plate', 'So the barrier opens automatically.');
    const vf = new Date(`${date}T${from}`);
    const vt = new Date(`${date}T${to}`);
    if (vt <= vf) vt.setDate(vt.getDate() + 1);
    if (vt < new Date()) return toast.error('That time has already passed');
    setLoading(true);
    const id = createVisit({
      name: name.trim(), phone, type, unit: resident.unit, host: resident.name, plate: driving ? plate.toUpperCase().trim() : undefined, status: 'expected',
      validFrom: vf.toISOString(), validTo: vt.toISOString(), selfie: false, faceVariant: 1 + Math.floor(Math.random() * 8), people, createdBy: 'resident',
      recurringDays: canRecur && recurring ? days : undefined, note: note || undefined,
    });
    window.setTimeout(() => {
      toast.success('Pass created', `Sent to ${name.split(' ')[0]} on WhatsApp${selfie ? ' with a selfie link' : ''}.`);
      navigate(`/app/pass/${id}`, { replace: true });
    }, 350);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-thin">
        {TYPES.map((t) => (
          <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={cn('h-9 shrink-0 rounded-full border px-4 text-[13px] font-semibold', type === t ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-muted-dark')}>{visitTypeLabel[t]}</button>
        ))}
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-end gap-2">
          <Field label="Visitor's name" className="flex-1">{(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'event' ? 'Event name, e.g. Birthday party' : 'Full name'} autoComplete="off" />}</Field>
          <Button aria-label="Pick from contacts" icon={<Contact className="h-4 w-4" />} onClick={pickContact} />
        </div>
        <Field label="Mobile number" hint="The pass is sent here by WhatsApp and SMS.">{(id) => <Input id={id} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="012-345 6789" />}</Field>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <Field label="Date">{(id) => <Input id={id} type="date" min={toInputDate(now)} value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From">{(id) => <Input id={id} type="time" value={from} onChange={(e) => setFrom(e.target.value)} />}</Field>
          <Field label="Until">{(id) => <Input id={id} type="time" value={to} onChange={(e) => setTo(e.target.value)} />}</Field>
        </div>
        {canRecur && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between"><span className="text-[13px] font-semibold">Repeats every week</span><Switch checked={recurring} onChange={setRecurring} label="Repeats every week" /></div>
            {recurring && <div className="grid grid-cols-7 gap-1">{DAYS.map((d, i) => <button key={d} type="button" aria-pressed={days[i]} onClick={() => setDays(days.map((x, j) => (j === i ? !x : x)))} className={cn('h-9 rounded-lg text-xs font-bold', days[i] ? 'bg-brand text-white' : 'bg-ice text-muted-dark')}>{d}</button>)}</div>}
          </div>
        )}
        {type === 'event' && (
          <div className="flex items-center justify-between"><span className="text-[13px] font-semibold">Number of guests</span>
            <div className="flex items-center gap-2"><Button size="sm" aria-label="Fewer guests" icon={<Minus className="h-4 w-4" />} onClick={() => setPeople(Math.max(1, people - 1))} /><span className="w-8 text-center font-bold">{people}</span><Button size="sm" aria-label="More guests" icon={<Plus className="h-4 w-4" />} onClick={() => setPeople(Math.min(60, people + 1))} /></div>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-[13px] font-semibold"><Car className="h-4 w-4 text-muted" />Coming by car</span><Switch checked={driving} onChange={setDriving} label="Coming by car" /></div>
        {driving && <Field label="Car plate" hint="The barrier opens automatically for this plate. Visitor parking is at B1.">{(id) => <Input id={id} value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="WA 1234 B" className="font-mono uppercase" />}</Field>}
        {type !== 'event' && (
          <Field label="People">{(id) => <Select id={id} value={people} onChange={(e) => setPeople(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</Select>}</Field>
        )}
        <Field label="Note for the guard (optional)">{(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Elderly, please help with the lift" className="min-h-[72px]" />}</Field>
        <Checkbox checked={selfie} onChange={setSelfie} label="Ask for a selfie" sub="Lets the lobby camera recognise them, so they can walk straight in. Deleted 24 hours after the pass ends." />
      </Card>

      <Button type="submit" variant="primary" size="lg" block loading={loading} icon={<Send className="h-4 w-4" />}>Create pass and send</Button>
    </form>
  );
}
