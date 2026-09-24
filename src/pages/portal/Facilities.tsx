import { useState } from 'react';
import { CalendarDays, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, Chip, Confirm, Empty, Field, Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { Button, LinkButton } from '@/components/ui/Button';
import { cn, plural, rm } from '@/lib/utils';
import { FACILITY_KINDS, hourLabel, upcomingBookings } from '@/lib/facilities';
import { toast } from '@/store/toast';
import type { Facility, FacilityKind } from '@/data/types';

type Draft = Omit<Facility, 'id'>;

const BLANK: Draft = { name: '', kind: 'room', fee: 0, deposit: 0, maxHours: 2, opens: 8, closes: 22, advanceDays: 14, note: '', active: true };
const HOURS = Array.from({ length: 25 }, (_, i) => i);

export default function Facilities() {
  const facilities = useStore((s) => s.facilities);
  const bookings = useStore((s) => s.bookings);
  const session = useStore((s) => s.session.portal);
  const { addFacility, updateFacility, removeFacility, log } = useStore.getState();
  const who = session?.name ?? 'Farah Hanim';
  const [editing, setEditing] = useState<Facility | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [del, setDel] = useState<Facility | null>(null);

  const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
  const nextWeek = bookings.filter((b) => b.status === 'confirmed' && new Date(b.date) >= new Date(new Date().setHours(0, 0, 0, 0)) && new Date(b.date) < weekEnd);

  const open = (f: Facility | 'new') => {
    setDraft(f === 'new' ? BLANK : { ...f });
    setEditing(f);
  };
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    const name = draft.name.trim();
    if (!name) return toast.error('Enter a facility name');
    if (facilities.some((f) => f.name.toLowerCase() === name.toLowerCase() && (editing === 'new' || f.id !== editing?.id))) return toast.error('That name is taken', 'Each facility needs its own name.');
    if (draft.closes <= draft.opens) return toast.error('Check the opening hours', 'Closing time must be after opening time.');
    if (draft.maxHours < 1 || draft.maxHours > draft.closes - draft.opens) return toast.error('Check the longest booking', `It must be between 1 and ${draft.closes - draft.opens} hours.`);
    if (draft.fee < 0 || draft.deposit < 0) return toast.error('Fee and deposit cannot be negative');
    if (draft.advanceDays < 1) return toast.error('Residents must be able to book at least 1 day ahead');
    const clean = { ...draft, name, note: draft.note.trim() };
    if (editing === 'new') {
      addFacility(clean);
      log({ who, role: 'Building Manager', action: 'Added', record: `Facility "${name}"` });
      toast.success(`${name} added`, clean.active ? 'Residents can book it in the app now.' : 'It stays closed to bookings until you open it.');
    } else if (editing) {
      updateFacility(editing.id, clean);
      log({ who, role: 'Building Manager', action: 'Changed', record: `Facility "${name}"` });
      toast.success('Facility updated');
    }
    setEditing(null);
  };

  const toggle = (f: Facility) => {
    updateFacility(f.id, { active: !f.active });
    log({ who, role: 'Building Manager', action: 'Changed', record: `Facility "${f.name}" ${f.active ? 'closed to' : 'opened for'} bookings` });
    toast.info(f.active ? `${f.name} closed to new bookings` : `${f.name} open for bookings`, f.active ? 'Existing bookings are kept.' : undefined);
  };

  const delCount = del ? upcomingBookings(bookings, del).length : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['Facilities', facilities.length, 'Listed in this portal'],
          ['Open for booking', facilities.filter((f) => f.active).length, 'Residents can book in the app'],
          ['Bookings next 7 days', nextWeek.length, 'Across all facilities'],
          ['Booking fees next 7 days', rm(nextWeek.reduce((n, b) => n + b.fee, 0)), 'Deposits not included'],
        ].map(([l, v, n]) => (
          <Card key={String(l)} className="flex flex-col gap-1.5 p-4"><span className="text-[12.5px] font-bold text-muted-dark">{l}</span><span className="text-[26px] font-extrabold tracking-tight">{v}</span><span className="text-xs text-muted">{n}</span></Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-4">
          <CardHeader title="Bookable facilities" sub="Residents see open facilities in the app under Book. Changes apply straight away."
            action={
              <div className="flex flex-wrap gap-2">
                <LinkButton to="/portal/community?tab=bookings" icon={<CalendarDays className="h-4 w-4" />}>Bookings calendar</LinkButton>
                <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => open('new')}>Add facility</Button>
              </div>
            } />
        </div>
        <ul className="grid gap-3 px-4 pb-4 md:grid-cols-2 2xl:grid-cols-3">
          {facilities.map((f) => {
            const Icon = FACILITY_KINDS[f.kind].icon;
            const upcoming = upcomingBookings(bookings, f).length;
            return (
              <li key={f.id} className={cn('flex flex-col gap-3 rounded-2xl border border-line p-4', !f.active && 'bg-ice')}>
                <div className="flex items-start gap-3">
                  <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', f.active ? 'bg-teal-soft text-teal-dark' : 'bg-[#EEF1F7] text-muted')}><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{f.name}</span>
                      <Chip tone={f.active ? 'teal' : 'grey'} dot>{f.active ? 'Open for booking' : 'Closed'}</Chip>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{FACILITY_KINDS[f.kind].label}</p>
                  </div>
                  <Switch checked={f.active} onChange={() => toggle(f)} label={`${f.name} open for booking`} />
                </div>
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div><dt className="text-muted">Fee</dt><dd className="font-semibold">{f.fee ? rm(f.fee) : 'Free'}</dd></div>
                  <div><dt className="text-muted">Deposit</dt><dd className="font-semibold">{f.deposit ? rm(f.deposit) : 'None'}</dd></div>
                  <div><dt className="text-muted">Hours</dt><dd className="font-semibold">{hourLabel(f.opens)} to {hourLabel(f.closes)}</dd></div>
                  <div><dt className="text-muted">Longest booking</dt><dd className="font-semibold">{plural(f.maxHours, 'hour')}</dd></div>
                  <div><dt className="text-muted">Book ahead</dt><dd className="font-semibold">Up to {plural(f.advanceDays, 'day')}</dd></div>
                  <div><dt className="text-muted">Upcoming</dt><dd className="font-semibold">{plural(upcoming, 'booking')}</dd></div>
                </dl>
                {f.note && <p className="text-[13px] leading-relaxed text-muted-dark">{f.note}</p>}
                <div className="mt-auto flex gap-2">
                  <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => open(f)}>Edit</Button>
                  <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => setDel(f)}>Remove</Button>
                </div>
              </li>
            );
          })}
        </ul>
        {!facilities.length && <Empty icon={<CalendarDays className="h-5 w-5" />} title="No facilities yet" body="Add the facilities residents are allowed to book." action={<Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => open('new')}>Add facility</Button>} />}
      </Card>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add a facility' : `Edit ${editing?.name ?? ''}`}
        description="Residents see the name, fee, deposit, hours and rules when they book."
        footer={<><Button onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={save}>{editing === 'new' ? 'Add facility' : 'Save changes'}</Button></>}>
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">{(id) => <Input id={id} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Karaoke room" />}</Field>
            <Field label="Type">{(id) => <Select id={id} value={draft.kind} onChange={(e) => set('kind', e.target.value as FacilityKind)}>{(Object.keys(FACILITY_KINDS) as FacilityKind[]).map((k) => <option key={k} value={k}>{FACILITY_KINDS[k].label}</option>)}</Select>}</Field>
            <Field label="Fee per booking (RM)" hint="0 for free">{(id) => <Input id={id} type="number" min={0} step="1" inputMode="decimal" value={draft.fee} onChange={(e) => set('fee', Math.max(0, Number(e.target.value)))} />}</Field>
            <Field label="Refundable deposit (RM)" hint="0 for none">{(id) => <Input id={id} type="number" min={0} step="1" inputMode="decimal" value={draft.deposit} onChange={(e) => set('deposit', Math.max(0, Number(e.target.value)))} />}</Field>
            <Field label="Opens">{(id) => <Select id={id} value={draft.opens} onChange={(e) => set('opens', Number(e.target.value))}>{HOURS.slice(0, 24).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Select>}</Field>
            <Field label="Closes">{(id) => <Select id={id} value={draft.closes} onChange={(e) => set('closes', Number(e.target.value))}>{HOURS.slice(1).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Select>}</Field>
            <Field label="Longest booking">{(id) => <Select id={id} value={draft.maxHours} onChange={(e) => set('maxHours', Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => i + 1).map((h) => <option key={h} value={h}>{plural(h, 'hour')}</option>)}</Select>}</Field>
            <Field label="Residents can book up to">{(id) => <Select id={id} value={draft.advanceDays} onChange={(e) => set('advanceDays', Number(e.target.value))}>{[1, 3, 7, 14, 30, 60, 90].map((d) => <option key={d} value={d}>{plural(d, 'day')} ahead</option>)}</Select>}</Field>
          </div>
          <Field label="Rules shown to residents">{(id) => <Textarea id={id} value={draft.note} onChange={(e) => set('note', e.target.value)} placeholder="e.g. Maximum 20 guests. No glass bottles. Clean up by closing time." />}</Field>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-ice p-3">
            <span className="text-[13.5px]"><span className="block font-bold">Open for booking</span><span className="text-xs text-muted">Turn off to stop new bookings, for example during repairs.</span></span>
            <Switch checked={draft.active} onChange={(v) => set('active', v)} label="Open for booking" />
          </div>
        </div>
      </Modal>

      <Confirm open={!!del} onClose={() => setDel(null)} danger confirmLabel="Remove facility" title={`Remove ${del?.name ?? 'facility'}?`}
        body={delCount
          ? `${plural(delCount, 'upcoming booking')} will be cancelled and any deposits refunded. To keep them, close the facility to new bookings instead.`
          : 'Residents will no longer see it in the app. Past bookings stay in the records.'}
        onConfirm={() => {
          if (!del) return;
          removeFacility(del.id);
          log({ who, role: 'Building Manager', action: 'Deleted', record: `Facility "${del.name}"` });
          toast.info(`${del.name} removed`, delCount ? `${plural(delCount, 'booking')} cancelled.` : undefined);
        }} />
    </div>
  );
}
