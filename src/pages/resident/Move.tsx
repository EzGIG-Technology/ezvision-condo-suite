import { useState } from 'react';
import { CheckCircle2, Circle, Plus, Truck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Checkbox, Chip, Empty, Field, Input, Modal, Segmented, Select, type ChipTone } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, rm } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { MOVE_DEPOSIT, MOVE_SLOTS, slotTaken } from '@/lib/moves';
import { toast } from '@/store/toast';
import type { LiftBooking } from '@/data/types';

const statusLabel: Record<NonNullable<LiftBooking['status']>, [string, ChipTone]> = {
  requested: ['Waiting for approval', 'amber'], approved: ['Approved', 'teal'], rejected: ['Not approved', 'red'], completed: ['Completed', 'grey'],
};
const dayText = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export default function ResidentMove() {
  useDocumentTitle('Move in or out');
  const unit = useStore((s) => s.resident.unit);
  const all = useStore((s) => s.liftBookings);
  const { createLiftBooking, payLiftDeposit } = useStore.getState();
  const lift = `Tower ${unit[0]} service lift`;
  const mine = all.filter((b) => b.unit === unit && (b.kind === 'move_in' || b.kind === 'move_out')).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const [form, setForm] = useState(false);
  const [kind, setKind] = useState<'move_in' | 'move_out'>('move_in');
  // Moves run Monday to Saturday, from 2 days ahead. Default to the first allowed day from 3 days ahead.
  const [day, setDay] = useState(() => { let d = 3; while (new Date(Date.now() + d * 864e5).getDay() === 0) d += 1; return d; });
  const [slot, setSlot] = useState(MOVE_SLOTS[0]);
  const [mover, setMover] = useState('');
  const [plate, setPlate] = useState('');
  const [crew, setCrew] = useState(3);
  const [agree, setAgree] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const date = new Date(); date.setDate(date.getDate() + day); date.setHours(9, 0, 0, 0);
  const days = Array.from({ length: 30 }, (_, i) => i + 2).filter((d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.getDay() !== 0; });
  const taken = slotTaken(all, lift, date, slot);

  const check = () => {
    if (!mover.trim()) return toast.error('Enter the moving company');
    if (!plate.trim()) return toast.error('Enter the lorry plate', 'The guard lets the lorry in by its plate.');
    if (taken) return toast.error('That slot is taken', 'Pick another day or slot.');
    if (!agree) return toast.error('Please accept the moving rules');
    setConfirm(true);
  };
  const submit = () => {
    setPaying(true);
    window.setTimeout(() => {
      const id = createLiftBooking({
        date: date.toISOString(), slot, what: kind === 'move_in' ? 'Move-in' : 'Move-out', unit, lift, kind, status: 'requested', requestedBy: 'resident',
        mover: mover.trim(), lorryPlate: plate.toUpperCase().trim(), crew, deposit: MOVE_DEPOSIT, depositPaid: false, checklist: { pre: false, post: false },
      });
      payLiftDeposit(id);
      setPaying(false); setConfirm(false); setForm(false); setMover(''); setPlate(''); setAgree(false);
      toast.success('Move request sent', `${dayText(date.toISOString())}, ${slot}. Management will confirm.`);
    }, 700);
  };

  if (form) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3 p-4">
          <Segmented label="Move type" full value={kind} onChange={setKind} options={[{ value: 'move_in', label: 'Moving in' }, { value: 'move_out', label: 'Moving out' }]} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Day">{(id) => <Select id={id} value={day} onChange={(e) => setDay(Number(e.target.value))}>{days.map((d) => { const x = new Date(); x.setDate(x.getDate() + d); return <option key={d} value={d}>{dayText(x.toISOString())}</option>; })}</Select>}</Field>
            <Field label="Slot">{(id) => <Select id={id} value={slot} onChange={(e) => setSlot(e.target.value)}>{MOVE_SLOTS.map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
          </div>
          <p className={cn('text-xs', taken ? 'text-danger-ink' : 'text-teal-dark')}>{taken ? `The ${lift.toLowerCase()} is already booked then.` : `The ${lift.toLowerCase()} is free. It will be padded and locked for you.`}</p>
          <Field label="Moving company">{(id) => <Input id={id} value={mover} onChange={(e) => setMover(e.target.value)} placeholder="e.g. Lori Express Movers" />}</Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Lorry plate">{(id) => <Input id={id} value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="BPK 3321" className="font-mono uppercase" />}</Field>
            <Field label="Crew">{(id) => <Select id={id} value={crew} onChange={(e) => setCrew(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'person' : 'people'}</option>)}</Select>}</Field>
          </div>
        </Card>
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between"><span className="text-[13.5px] font-semibold">Refundable damage deposit</span><span className="text-lg font-extrabold">{rm(MOVE_DEPOSIT)}</span></div>
          <p className="text-xs text-muted">The guard inspects the lift and lobby before and after your move. The deposit is refunded after the second inspection if nothing is damaged.</p>
          <Checkbox checked={agree} onChange={setAgree} label="I accept the moving rules" sub="Moves only Monday to Saturday in the booked slot. Movers stay in the loading bay, service lift and my unit." />
        </Card>
        <div className="flex gap-2"><Button size="lg" onClick={() => setForm(false)}>Cancel</Button><Button size="lg" variant="primary" className="flex-1" onClick={check}>Continue</Button></div>
        <Modal open={confirm} onClose={() => setConfirm(false)} title="Pay deposit and send request" size="sm"
          footer={<><Button onClick={() => setConfirm(false)}>Back</Button><Button variant="primary" loading={paying} onClick={submit}>Pay {rm(MOVE_DEPOSIT)}</Button></>}>
          <dl className="flex flex-col gap-2 text-[13.5px]">
            <div className="flex justify-between gap-3"><dt className="text-muted">When</dt><dd className="text-right font-semibold">{dayText(date.toISOString())}, {slot}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Lift</dt><dd className="font-semibold">{lift}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Lorry</dt><dd className="font-mono font-semibold">{plate.toUpperCase()}</dd></div>
          </dl>
          <p className="mt-3 rounded-xl bg-ice p-3 text-xs text-muted-dark">Paid by FPX online banking. Refunded in full if management does not approve.</p>
        </Modal>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="primary" size="lg" block icon={<Plus className="h-4 w-4" />} onClick={() => setForm(true)}>Book a move</Button>
      {mine.map((b) => {
        const [label, tone] = statusLabel[b.status ?? 'approved'];
        return (
          <Card key={b.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-bold">{b.what}</p><p className="text-xs text-muted">{dayText(b.date)} · {b.slot} · {b.lift}</p></div>
              <Chip tone={tone}>{label}</Chip>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <div><dt className="text-muted">Mover</dt><dd className="font-semibold">{b.mover ?? '—'}</dd></div>
              <div><dt className="text-muted">Lorry</dt><dd className="font-mono font-semibold">{b.lorryPlate ?? '—'}</dd></div>
              <div><dt className="text-muted">Deposit</dt><dd className="font-semibold">{b.deposit ? `${rm(b.deposit)} · ${b.depositRefunded ? 'refunded' : b.depositPaid ? 'paid' : 'unpaid'}` : '—'}</dd></div>
            </dl>
            {(b.status === 'approved' || b.status === 'completed') && (
              <ul className="flex flex-col gap-1 text-xs">
                {([['pre', 'Inspection before the move'], ['post', 'Inspection after the move']] as const).map(([k, l]) => (
                  <li key={k} className="flex items-center gap-2">{b.checklist?.[k] ? <CheckCircle2 className="h-4 w-4 text-teal" /> : <Circle className="h-4 w-4 text-muted" />}{l}</li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
      {!mine.length && <Card><Empty icon={<Truck className="h-5 w-5" />} title="No moves booked" body="Book the service lift before moving in or out. Your mover's lorry is let in by its plate." /></Card>}
    </div>
  );
}
