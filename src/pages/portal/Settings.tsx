import { useState } from 'react';
import { Car, Save, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, Field, Input } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/toast';
import type { SiteLimits } from '@/data/types';

const FIELDS: { key: keyof SiteLimits; label: string; hint: string; min: number; max: number; group: 'visitors' | 'vehicles' }[] = [
  { key: 'visitorsPerDay', label: 'Visitor passes per unit per day', hint: 'Walk-ins approved by the resident do not count.', min: 1, max: 50, group: 'visitors' },
  { key: 'onSiteAtOnce', label: 'Visitors per unit at the same time', hint: 'Event passes have their own limit below.', min: 1, max: 50, group: 'visitors' },
  { key: 'eventGuestCap', label: 'Guests per event pass', hint: 'For parties and gatherings in a unit or facility.', min: 1, max: 200, group: 'visitors' },
  { key: 'multiDayMax', label: 'Longest multi-day pass (days)', hint: 'The pass expires automatically at the end time on the last day.', min: 1, max: 60, group: 'visitors' },
  { key: 'vehiclesPerUnit', label: 'Resident cars per unit', hint: 'Checked when residents or staff register a car.', min: 1, max: 10, group: 'vehicles' },
];

export default function Settings() {
  const limits = useStore((s) => s.limits);
  const session = useStore((s) => s.session.portal);
  const { setLimits, log } = useStore.getState();
  const [draft, setDraft] = useState<Record<keyof SiteLimits, string>>(() => Object.fromEntries(Object.entries(limits).map(([k, v]) => [k, String(v)])) as Record<keyof SiteLimits, string>);
  const dirty = FIELDS.some((f) => Number(draft[f.key]) !== limits[f.key]);

  const save = () => {
    const next: Partial<SiteLimits> = {};
    for (const f of FIELDS) {
      const n = Number(draft[f.key]);
      if (!Number.isInteger(n) || n < f.min || n > f.max) return toast.error(`Check "${f.label}"`, `Enter a whole number from ${f.min} to ${f.max}.`);
      next[f.key] = n;
    }
    setLimits(next);
    log({ who: session?.name ?? 'Farah Hanim', role: 'Building Manager', action: 'Changed', record: 'Visitor and vehicle limits' });
    toast.success('Limits saved', 'The resident app uses them straight away.');
  };

  const group = (g: 'visitors' | 'vehicles') => FIELDS.filter((f) => f.group === g).map((f) => (
    <Field key={f.key} label={f.label} hint={f.hint}>{(id) => <Input id={id} type="number" inputMode="numeric" min={f.min} max={f.max} value={draft[f.key]} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} className="max-w-[160px]" />}</Field>
  ));

  return (
    <div className="flex max-w-4xl flex-col gap-5">
      <Card className="flex flex-col gap-4 p-5">
        <CardHeader title={<span className="flex items-center gap-2"><Users className="h-5 w-5 text-muted" />Visitor limits</span>} sub="Applied when residents create passes in the app. Guards can still register walk-ins." />
        <div className="grid gap-4 sm:grid-cols-2">{group('visitors')}</div>
      </Card>
      <Card className="flex flex-col gap-4 p-5">
        <CardHeader title={<span className="flex items-center gap-2"><Car className="h-5 w-5 text-muted" />Vehicle limits</span>} sub="Resident plates open the barrier automatically." />
        <div className="grid gap-4 sm:grid-cols-2">{group('vehicles')}</div>
      </Card>
      <div className="flex justify-end gap-2">
        <Button disabled={!dirty} onClick={() => setDraft(Object.fromEntries(Object.entries(limits).map(([k, v]) => [k, String(v)])) as Record<keyof SiteLimits, string>)}>Discard changes</Button>
        <Button variant="primary" icon={<Save className="h-4 w-4" />} disabled={!dirty} onClick={save}>Save limits</Button>
      </div>
    </div>
  );
}
