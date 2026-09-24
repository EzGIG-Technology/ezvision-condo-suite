import { useState, type FormEvent } from 'react';
import { Bike, CheckCircle2, Clock, LogOut } from 'lucide-react';
import { useCurrentGuard, useStore } from '@/store/useStore';
import { Chip, Empty, Input, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, hhmm, relative } from '@/lib/utils';
import { useDocumentTitle, useNow } from '@/lib/hooks';
import { toast } from '@/store/toast';

const PLATFORMS = ['GrabFood', 'Foodpanda', 'ShopeeFood', 'Lalamove', 'Grab (e-hailing)', 'Shopee Express', 'J&T Express', 'Other courier'];
const DROP_OFF_MIN = 20;

export default function GuardRiders() {
  useDocumentTitle('Riders');
  const visits = useStore((s) => s.visits);
  const approvals = useStore((s) => s.approvals);
  const units = useStore((s) => s.units);
  const guard = useCurrentGuard();
  const { logRider, checkOutVisit, checkInVisit } = useStore.getState();
  const now = useNow(30_000);
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [plate, setPlate] = useState('');
  const [unit, setUnit] = useState('');
  const [zone, setZone] = useState<'dropoff' | 'unit'>('dropoff');

  const onSite = visits.filter((v) => v.type === 'rider' && v.status === 'on_site');
  const asking = approvals.filter((a) => / delivery to your door$/.test(a.purpose) && (a.status === 'waiting' || (a.status === 'approved' && visits.find((v) => v.id === a.visitId)?.status === 'expected') || (a.status === 'declined' && +now - +new Date(a.respondedAt ?? a.createdAt) < 30 * 60_000)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const u = unit.toUpperCase().trim();
    if (!units.some((x) => x.unit === u) && !/^[A-C]-\d{2}-\d{2}$/.test(u)) return toast.error('Check the unit number', 'Format: A-15-07');
    if (!plate.trim() && platform !== 'Other courier') return toast.error('Enter the motorbike plate', 'Riders are logged by plate so the side gate camera can match them.');
    const r = logRider({ platform, name: name.trim(), phone, plate: plate.toUpperCase().trim(), unit: u, zone, by: guard.name });
    if (r.approvalId) toast.info(`Asking ${u}`, `The resident decides if the ${platform} rider can go up.`);
    else toast.success(`${platform} rider logged`, `Drop-off zone only. ${u} was notified.`);
    setName(''); setPhone(''); setPlate(''); setUnit('');
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Delivery riders</h1>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-night-line bg-night-panel p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Platform<Select dark value={platform} onChange={(e) => setPlatform(e.target.value)}>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</Select></label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Unit
              <Input dark list="rider-units" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="A-15-07" className="font-mono uppercase" />
              <datalist id="rider-units">{units.map((u) => <option key={u.unit} value={u.unit} />)}</datalist>
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Motorbike plate<Input dark value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="WTK 5520" className="font-mono uppercase" /></label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Rider phone (optional)<Input dark type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="014-880 8810" /></label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light sm:col-span-2">Rider name (optional)<Input dark value={name} onChange={(e) => setName(e.target.value)} placeholder="As shown in the app" /></label>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-xs font-bold text-muted-light">Where can the rider go?</legend>
            {([['dropoff', 'Lobby drop-off zone only', `Default rule. The rider waits at the drop-off point. Flagged after ${DROP_OFF_MIN} minutes or if seen on residential floors.`], ['unit', 'Up to the unit', 'The resident is asked in the app first. Use for heavy or fragile items.']] as const).map(([k, l, sub]) => (
              <label key={k} className={cn('flex cursor-pointer items-start gap-3 rounded-xl border p-3', zone === k ? 'border-brand bg-brand/15' : 'border-navy-500 bg-night-field')}>
                <input type="radio" name="zone" checked={zone === k} onChange={() => setZone(k)} className="mt-1 accent-brand" />
                <span><span className="block text-[14px] font-bold">{l}</span><span className="text-xs text-muted-light">{sub}</span></span>
              </label>
            ))}
          </fieldset>
          <Button type="submit" size="xl" variant="nightPrimary" icon={<Bike className="h-5 w-5" />}>{zone === 'unit' ? 'Ask the resident' : 'Log rider'}</Button>
        </form>

        <aside className="flex flex-col gap-4">
          {asking.length > 0 && (
            <section className="flex flex-col gap-2 rounded-2xl border border-night-line bg-night-panel p-4" aria-label="Waiting for residents">
              <h2 className="text-base font-extrabold">Asked residents</h2>
              {asking.map((a) => {
                const v = visits.find((x) => x.id === a.visitId);
                return (
                  <div key={a.id} className="flex flex-col gap-2 rounded-xl bg-night-field p-3">
                    <div className="flex items-center justify-between gap-2"><span className="text-[13.5px] font-semibold">{a.visitorName} · {a.unit}</span>
                      <Chip dark tone={a.status === 'approved' ? 'teal' : a.status === 'declined' ? 'red' : 'amber'}>{a.status === 'approved' ? 'Resident said yes' : a.status === 'declined' ? 'Resident said no' : 'Waiting'}</Chip>
                    </div>
                    {a.status === 'approved' && v && <Button variant="nightPrimary" onClick={() => { checkInVisit(v.id, 'Rider log · allowed to unit'); toast.success('Rider let up', `${a.unit} · pass for 30 minutes.`); }}>Let rider up</Button>}
                    {a.status === 'declined' && <p className="text-xs text-muted-light">Tell the rider to wait at the drop-off point.</p>}
                  </div>
                );
              })}
            </section>
          )}
          <section className="flex flex-col gap-2 rounded-2xl border border-night-line bg-night-panel p-4" aria-label="Riders on site">
            <h2 className="text-base font-extrabold">On site now · {onSite.length}</h2>
            {onSite.map((v) => {
              const mins = Math.round((+now - +new Date(v.checkIn ?? v.validFrom)) / 60_000);
              const over = v.zone !== 'unit' && mins > DROP_OFF_MIN;
              return (
                <div key={v.id} className={cn('flex items-center gap-3 rounded-xl p-3', over ? 'bg-danger/20' : 'bg-night-field')}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold">{v.platform ?? v.name} · {v.unit}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-light"><Clock className="h-3.5 w-3.5" />In at {hhmm(v.checkIn)} · {relative(v.checkIn)}{v.plate ? ` · ${v.plate}` : ''}</span>
                    <span className="mt-1 flex gap-1.5"><Chip dark tone={v.zone === 'unit' ? 'teal' : 'blue'}>{v.zone === 'unit' ? 'Allowed to unit' : 'Drop-off only'}</Chip>{over && <Chip dark tone="red">Over {DROP_OFF_MIN} min</Chip>}</span>
                  </span>
                  <Button variant="night" icon={<LogOut className="h-4 w-4" />} onClick={() => { checkOutVisit(v.id); toast.success('Rider left', `${v.platform ?? v.name} · ${v.unit}`); }}>Left</Button>
                </div>
              );
            })}
            {!onSite.length && <Empty dark icon={<CheckCircle2 className="h-5 w-5" />} title="No riders on site" />}
          </section>
        </aside>
      </div>
    </div>
  );
}
