import { useState } from 'react';
import { CalendarDays, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Chip, Confirm, Empty, Modal, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, rm } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { FACILITY_KINDS, hourLabel } from '@/lib/facilities';
import { toast } from '@/store/toast';
import type { Booking } from '@/data/types';

export default function ResidentBook() {
  useDocumentTitle('Book a facility');
  const unit = useStore((s) => s.resident.unit);
  const bookings = useStore((s) => s.bookings);
  const restriction = useStore((s) => s.feeRestriction);
  const units = useStore((s) => s.units);
  const { createBooking, cancelBooking } = useStore.getState();
  const allFacilities = useStore((s) => s.facilities);
  const facilities = allFacilities.filter((f) => f.active);
  const [facId, setFacId] = useState<string | null>(null);
  const [day, setDay] = useState(0);
  const [start, setStart] = useState<number | null>(null);
  const [hours, setHours] = useState(2);
  const [confirm, setConfirm] = useState(false);
  const [paying, setPaying] = useState(false);
  const [cancel, setCancel] = useState<Booking | null>(null);

  const fac = facilities.find((f) => f.id === facId) ?? facilities[0];
  if (!fac) {
    return (
      <Card className="p-4">
        <Empty icon={<CalendarDays className="h-5 w-5" />} title="No facilities to book" body="Management has not opened any facilities for booking yet." />
      </Card>
    );
  }
  const hoursList = Array.from({ length: fac.closes - fac.opens }, (_, i) => fac.opens + i);
  const days = Math.min(fac.advanceDays, 30);

  const date = new Date(); date.setDate(date.getDate() + day); date.setHours(0, 0, 0, 0);
  const onDay = bookings.filter((b) => b.status === 'confirmed' && b.facility === fac.name && new Date(b.date).toDateString() === date.toDateString());
  const taken = (h: number) => onDay.some((b) => h >= b.from && h < b.to);
  const past = (h: number) => day === 0 && h <= new Date().getHours();
  const dur = Math.min(hours, fac.maxHours);
  const fits = start !== null && Array.from({ length: dur }, (_, i) => start + i).every((h) => h < fac.closes && !taken(h));
  const mine = bookings.filter((b) => b.unit === unit && b.status === 'confirmed' && new Date(b.date) >= new Date(new Date().setHours(0, 0, 0, 0))).sort((a, b) => +new Date(a.date) - +new Date(b.date));
  const blocked = restriction && units.find((u) => u.unit === unit)?.feesOk === false;

  const book = () => {
    if (start === null) return;
    setPaying(true);
    window.setTimeout(() => {
      const d = new Date(date); d.setHours(start, 0, 0, 0);
      createBooking({ facility: fac.name, unit, date: d.toISOString(), from: start, to: start + dur, fee: fac.fee, deposit: fac.deposit });
      setPaying(false); setConfirm(false); setStart(null);
      toast.success(`${fac.name} booked`, `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${start}:00 to ${start + dur}:00`);
    }, 700);
  };

  return (
    <div className="flex flex-col gap-4">
      {blocked && <p className="rounded-xl bg-danger-soft p-3 text-[13px] text-danger-ink">Bookings are paused for your unit until outstanding fees are paid.</p>}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-thin">
        {facilities.map((f) => {
          const Icon = FACILITY_KINDS[f.kind].icon;
          return (
            <button key={f.id} type="button" aria-pressed={fac.id === f.id} onClick={() => { setFacId(f.id); setStart(null); setDay((d) => Math.min(d, Math.min(f.advanceDays, 30) - 1)); setHours(Math.min(2, f.maxHours)); }}
              className={cn('flex w-28 shrink-0 flex-col items-start gap-2 rounded-2xl border p-3 text-left', fac.id === f.id ? 'border-brand bg-brand-soft' : 'border-line bg-white')}>
              <Icon className={cn('h-5 w-5', fac.id === f.id ? 'text-brand' : 'text-muted')} />
              <span className="text-[13px] font-bold leading-tight">{f.name}</span>
              <span className="text-[11px] text-muted">{f.fee ? `${rm(f.fee)} / booking` : 'Free'}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted">Open {hourLabel(fac.opens)} to {hourLabel(fac.closes)}.{fac.note ? ` ${fac.note}` : ''}{fac.deposit ? ` Refundable deposit ${rm(fac.deposit)}.` : ''}</p>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-thin">
        {Array.from({ length: days }, (_, i) => i).map((d) => {
          const x = new Date(); x.setDate(x.getDate() + d);
          return (
            <button key={d} type="button" aria-pressed={day === d} onClick={() => { setDay(d); setStart(null); }} className={cn('flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border', day === d ? 'border-brand bg-brand text-white' : 'border-line bg-white')}>
              <span className="text-[11px] font-semibold opacity-80">{d === 0 ? 'Today' : x.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
              <span className="text-lg font-extrabold">{x.getDate()}</span>
            </button>
          );
        })}
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between"><h2 className="h2">Pick a start time</h2>
          <Select aria-label="Duration" value={dur} onChange={(e) => setHours(Number(e.target.value))} className="h-9 w-28 text-xs">{Array.from({ length: fac.maxHours }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>)}</Select>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {hoursList.map((h) => {
            const off = taken(h) || past(h);
            const inSel = start !== null && h >= start && h < start + dur;
            return (
              <button key={h} type="button" disabled={off} aria-pressed={inSel} onClick={() => setStart(h)}
                className={cn('h-11 rounded-xl text-[13px] font-semibold', off ? 'cursor-not-allowed bg-[#EEF1F7] text-[#A7B0C8] line-through' : inSel ? 'bg-brand text-white' : 'border border-line bg-white hover:border-brand')}>
                {hourLabel(h)}
              </button>
            );
          })}
        </div>
        {start !== null && !fits && <p className="mt-2 text-xs text-danger-ink">That clashes with another booking. Pick a shorter time or another slot.</p>}
        <Button variant="primary" size="lg" block className="mt-4" disabled={!fits || !!blocked} onClick={() => setConfirm(true)}>
          {start === null ? 'Select a time' : `Book ${start}:00 to ${start + dur}:00`}
        </Button>
      </Card>

      <Card className="p-4">
        <h2 className="h2 mb-2 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-muted" />My bookings</h2>
        {mine.map((b) => (
          <div key={b.id} className="flex items-center gap-3 border-b border-line-soft py-2.5 last:border-0">
            <div className="flex-1"><p className="text-[13.5px] font-semibold">{b.facility}{b.label ? ` · ${b.label}` : ''}</p><p className="text-xs text-muted">{new Date(b.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {b.from}:00 to {b.to}:00</p></div>
            {b.fee > 0 && <Chip tone="teal">Paid</Chip>}
            <button type="button" aria-label={`Cancel ${b.facility} booking`} onClick={() => setCancel(b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-ice"><X className="h-4 w-4" /></button>
          </div>
        ))}
        {!mine.length && <p className="text-sm text-muted">No upcoming bookings.</p>}
      </Card>

      <Modal open={confirm} onClose={() => setConfirm(false)} title={`Book ${fac.name}`} size="sm"
        footer={<><Button onClick={() => setConfirm(false)}>Back</Button><Button variant="primary" loading={paying} onClick={book}>{fac.fee + fac.deposit ? `Pay ${rm(fac.fee + fac.deposit)}` : 'Confirm'}</Button></>}>
        <dl className="flex flex-col gap-2 text-[13.5px]">
          <div className="flex justify-between"><dt className="text-muted">When</dt><dd className="font-semibold">{date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, {start}:00 to {(start ?? 0) + dur}:00</dd></div>
          <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-semibold">{fac.fee ? rm(fac.fee) : 'Free'}</dd></div>
          {fac.deposit > 0 && <div className="flex justify-between"><dt className="text-muted">Deposit (refunded after inspection)</dt><dd className="font-semibold">{rm(fac.deposit)}</dd></div>}
          {fac.fee + fac.deposit > 0 && <p className="mt-2 rounded-xl bg-ice p-3 text-xs text-muted-dark">Paid by FPX online banking. The receipt appears in Fees and billing.</p>}
        </dl>
      </Modal>

      <Confirm open={!!cancel} onClose={() => setCancel(null)} danger title="Cancel booking?" confirmLabel="Cancel booking"
        body={cancel?.deposit ? `The deposit of ${rm(cancel.deposit)} will be refunded in 3 working days. The fee is refunded if you cancel more than 48 hours ahead.` : 'The slot becomes available to other residents.'}
        onConfirm={() => { if (cancel) { cancelBooking(cancel.id); toast.info('Booking cancelled'); } }} />
    </div>
  );
}
