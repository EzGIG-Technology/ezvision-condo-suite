import { useState, type FormEvent } from 'react';
import { CheckCircle2, Package, PackageCheck, Printer, Search } from 'lucide-react';
import { useCurrentGuard, useStore } from '@/store/useStore';
import { Chip, Input, Segmented, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, relative } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import type { Parcel } from '@/data/types';

const COURIERS = ['Shopee Express', 'Lazada', 'J&T Express', 'Pos Laju', 'Ninja Van', 'DHL', 'GrabMart', 'Other'];
const SIZES: Parcel['size'][] = ['Small', 'Medium', 'Large', 'Chilled'];

export default function GuardParcels() {
  useDocumentTitle('Parcels');
  const parcels = useStore((s) => s.parcels);
  const units = useStore((s) => s.units);
  const guard = useCurrentGuard();
  const { logParcel, collectParcel } = useStore.getState();
  const [tab, setTab] = useState<'log' | 'handover'>('log');
  const [unit, setUnit] = useState('');
  const [recipient, setRecipient] = useState('');
  const [courier, setCourier] = useState(COURIERS[0]);
  const [size, setSize] = useState<Parcel['size']>('Small');
  const [tracking, setTracking] = useState('');
  const [shelf, setShelf] = useState('A-1');
  const [store, setStore] = useState<'shelf' | 'locker'>('shelf');
  const [last, setLast] = useState<Parcel | null>(null);
  const [code, setCode] = useState('');
  const [q, setQ] = useState('');
  const [match, setMatch] = useState<string | null>(null);

  const waiting = parcels.filter((p) => p.status === 'waiting');
  const LOCKERS = Array.from({ length: 24 }, (_, i) => `L-${String(i + 1).padStart(2, '0')}`);
  const freeLocker = LOCKERS.find((l) => !waiting.some((p) => p.locker === l));
  const matched = parcels.find((p) => p.id === match);
  const filtered = waiting.filter((p) => !q || `${p.unit} ${p.recipient}`.toLowerCase().includes(q.toLowerCase()));

  const onUnit = (v: string) => {
    setUnit(v);
    const u = units.find((x) => x.unit.toLowerCase() === v.trim().toLowerCase());
    if (u?.household[0]) setRecipient(u.household[0].name);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[ABC]-\d{2}-\d{1,2}$/i.test(unit.trim())) return toast.error('Check the unit number', 'Format: A-15-07');
    const inLocker = store === 'locker' && size !== 'Chilled';
    if (inLocker && !freeLocker) return toast.error('All 24 lockers are full', 'Put this parcel on a shelf.');
    const p = logParcel({ unit: unit.toUpperCase().trim(), recipient: recipient || 'Resident', courier, size: size, tracking: tracking || `MANUAL-${Date.now().toString().slice(-6)}`, shelf: size === 'Chilled' ? 'F-1' : inLocker ? `Locker ${freeLocker}` : shelf, locker: inLocker ? freeLocker : undefined, loggedBy: guard.name });
    setLast(p);
    toast.success(`Parcel logged for ${p.unit}`, inLocker ? `In smart locker ${freeLocker}. The resident can collect it any time with code ${p.code}.` : `Pickup code ${p.code}. The resident was notified.`);
    setUnit(''); setRecipient(''); setTracking('');
  };

  const byCode = (e: FormEvent) => {
    e.preventDefault();
    const p = waiting.find((x) => x.code === code.trim());
    if (p) setMatch(p.id); else { setMatch(null); toast.error('No parcel with that code'); }
  };

  const handOver = (p: Parcel) => {
    collectParcel(p.id, p.recipient, 'Pickup code + photo');
    toast.success('Handed over', `${p.courier} parcel to ${p.recipient} (${p.unit}).`);
    setMatch(null); setCode('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Parcels</h1>
        <Segmented dark label="Parcel task" value={tab} onChange={setTab} options={[{ value: 'log', label: 'Log a parcel' }, { value: 'handover', label: `Hand over · ${waiting.length}` }]} />
      </div>

      {tab === 'log' ? (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-night-line bg-night-panel p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Unit
                <Input dark list="parcel-units" value={unit} onChange={(e) => onUnit(e.target.value)} placeholder="A-15-07" className="font-mono uppercase" />
                <datalist id="parcel-units">{units.map((u) => <option key={u.unit} value={u.unit} />)}</datalist>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Recipient<Input dark value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Name on the label" /></label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Courier<Select dark value={courier} onChange={(e) => setCourier(e.target.value)}>{COURIERS.map((c) => <option key={c}>{c}</option>)}</Select></label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Tracking number<Input dark value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Scan the barcode" className="font-mono" /></label>
            </div>
            <div className="flex flex-col gap-1.5"><span className="text-xs font-bold text-muted-light">Size</span>
              <div className="grid grid-cols-4 gap-2">{SIZES.map((s) => <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)} className={cn('h-12 rounded-xl border text-[14px] font-semibold', size === s ? 'border-brand bg-brand/20' : 'border-navy-500 bg-night-field hover:bg-navy-700')}>{s}</button>)}</div>
            </div>
            <div className="flex flex-col gap-1.5"><span className="text-xs font-bold text-muted-light">Store in</span>
              <Segmented dark full label="Store in" value={size === 'Chilled' ? 'shelf' : store} onChange={setStore} options={[{ value: 'shelf', label: 'Parcel room shelf' }, { value: 'locker', label: `Smart locker${freeLocker ? ` · ${freeLocker} free` : ' · full'}` }]} />
            </div>
            {store === 'locker' && size !== 'Chilled' ? <p className="text-xs text-[#A9C4FF]">Goes in locker {freeLocker ?? '—'}. The resident opens it with their pickup code, any time, without the guard.</p> : <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Shelf<Select dark value={size === 'Chilled' ? 'F-1' : shelf} disabled={size === 'Chilled'} onChange={(e) => setShelf(e.target.value)}>{['A', 'B', 'C', 'D', 'E'].flatMap((r) => [1, 2, 3, 4, 5].map((n) => `${r}-${n}`)).concat('F-1').map((s) => <option key={s}>{s}</option>)}</Select></label>}
            {size === 'Chilled' && <p className="text-xs text-[#A9C4FF]">Chilled items go in the parcel fridge (F-1). The resident gets a 2-hour reminder.</p>}
            <Button type="submit" size="xl" variant="nightPrimary" icon={<Package className="h-5 w-5" />}>Log parcel and notify</Button>
          </form>
          <aside className="flex flex-col gap-3 rounded-2xl border border-night-line bg-night-panel p-5">
            {last ? (
              <>
                <p className="flex items-center gap-2 font-bold text-[#5EEAD4]"><CheckCircle2 className="h-5 w-5" />Logged for {last.unit}</p>
                <div className="rounded-xl bg-white p-4 text-center text-navy">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Shelf {last.shelf}</p>
                  <p className="font-mono text-4xl font-extrabold tracking-[0.2em]">{last.code}</p>
                  <p className="text-sm font-semibold">{last.unit} · {last.recipient}</p>
                </div>
                <Button size="lg" variant="night" icon={<Printer className="h-4 w-4" />} onClick={() => toast.success('Label printed')}>Print shelf label</Button>
              </>
            ) : <p className="text-sm text-muted-light">The pickup code and shelf label appear here after you log a parcel.</p>}
          </aside>
        </div>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-2xl border border-night-line bg-night-panel p-5">
            <form onSubmit={byCode} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Pickup code from the resident's app
                <Input dark value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="••••" className="h-16 text-center font-mono text-3xl tracking-[0.4em]" />
              </label>
              <Button type="submit" size="xl" variant="nightPrimary" disabled={code.length !== 4}>Find parcel</Button>
            </form>
            {matched && (
              <div className="flex flex-col gap-3 rounded-xl bg-teal/10 p-4">
                <p className="font-bold">{matched.courier} · {matched.size}</p>
                <p className="text-sm text-[#C9D3EE]">{matched.unit} · {matched.recipient} · {matched.locker ? 'smart' : 'shelf'} <b className="font-mono text-white">{matched.shelf}</b></p>
                <p className="text-xs text-[#A9C4FF]">The tablet photographs the hand-over as proof of collection.</p>
                <Button size="xl" variant="teal" icon={<PackageCheck className="h-5 w-5" />} onClick={() => handOver(matched)}>Hand over</Button>
              </div>
            )}
          </section>
          <section className="flex flex-col gap-3 rounded-2xl border border-night-line bg-night-panel p-5">
            <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-light" /><Input dark aria-label="Search waiting parcels" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Unit or name" className="pl-12" /></div>
            <ul className="flex flex-col gap-2">
              {filtered.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-xl bg-night-field p-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-night-panel font-mono text-xs font-bold">{p.shelf}</span>
                  <div className="min-w-0 flex-1"><p className="font-semibold">{p.unit} · {p.recipient}</p><p className="text-xs text-muted-light">{p.courier} · {relative(p.loggedAt)}</p></div>
                  {p.size === 'Chilled' && <Chip dark tone="blue">Chilled</Chip>}
                  {p.locker ? <Chip dark tone="teal">In locker · self-collect</Chip> : <Button size="sm" variant="night" onClick={() => handOver(p)}>Hand over</Button>}
                </li>
              ))}
              {!filtered.length && <li className="p-6 text-center text-sm text-muted-light">No parcels waiting.</li>}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
