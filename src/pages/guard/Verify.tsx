import { useState, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, Hash, LogIn, LogOut, QrCode, ScanLine, Search, XCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FaceCrop } from '@/components/vision';
import { Chip, Input, Plate, Segmented, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { visitStatusLabel, visitStatusTone, visitTypeLabel } from '@/lib/labels';
import { cn, hhmm, passCode, when } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import type { Visit } from '@/data/types';

type Mode = 'qr' | 'pin' | 'search';

function validity(v: Visit): { ok: boolean; text: string } {
  const now = Date.now();
  if (v.status === 'cancelled') return { ok: false, text: 'Pass was cancelled by the resident' };
  if (v.status === 'denied') return { ok: false, text: 'Entry was denied earlier' };
  if (v.status === 'left') return { ok: false, text: `Already checked out at ${hhmm(v.checkOut)}` };
  if (v.status === 'on_site') return { ok: true, text: `On site since ${hhmm(v.checkIn)}` };
  if (now < +new Date(v.validFrom) - 60 * 60000) return { ok: false, text: `Too early. Valid from ${when(v.validFrom)}` };
  if (now > +new Date(v.validTo)) return { ok: false, text: `Expired at ${when(v.validTo)}` };
  return { ok: true, text: `Valid until ${when(v.validTo)}` };
}

export default function GuardVerify() {
  useDocumentTitle('Verify a pass');
  const visits = useStore((s) => s.visits);
  const { checkInVisit, checkOutVisit } = useStore.getState();
  const [mode, setMode] = useState<Mode>('qr');
  const [scanning, setScanning] = useState(false);
  const [pin, setPin] = useState('');
  const [q, setQ] = useState('');
  const [found, setFound] = useState<string | null>(null);
  const [entry, setEntry] = useState('Main gate · lane 1');
  const v = visits.find((x) => x.id === found);
  const val = v ? validity(v) : null;

  const scan = () => {
    setScanning(true);
    setFound(null);
    window.setTimeout(() => {
      const next = visits.find((x) => x.status === 'expected' && validity(x).ok) ?? visits.find((x) => x.status === 'expected');
      setScanning(false);
      if (next) { setFound(next.id); toast.success('QR read'); } else toast.error('No QR detected', 'Ask the visitor to raise the brightness.');
    }, 1000);
  };

  const byPin = (e: FormEvent) => {
    e.preventDefault();
    const match = visits.find((x) => passCode(x.id) === pin.trim());
    if (match) setFound(match.id); else { setFound(null); toast.error('No pass with that PIN', 'Check the 6 digits on the visitor\'s phone.'); }
  };

  const results = q.trim().length >= 2 ? visits.filter((x) => `${x.name} ${x.plate ?? ''} ${x.unit}`.toLowerCase().replace(/\s/g, '').includes(q.toLowerCase().replace(/\s/g, ''))).slice(0, 8) : [];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Verify a pass</h1>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-2xl border border-night-line bg-night-panel p-5">
          <Segmented dark full label="Verify by" value={mode} onChange={(m) => { setMode(m); setFound(null); }} options={[
            { value: 'qr', label: <span className="flex items-center justify-center gap-1.5"><QrCode className="h-4 w-4" />Scan QR</span> },
            { value: 'pin', label: <span className="flex items-center justify-center gap-1.5"><Hash className="h-4 w-4" />PIN</span> },
            { value: 'search', label: <span className="flex items-center justify-center gap-1.5"><Search className="h-4 w-4" />Search</span> },
          ]} />
          {mode === 'qr' && (
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-2xl bg-black">
                <div className="absolute inset-8 rounded-2xl border-2 border-brand-light/70" />
                <span className={cn('absolute inset-x-8 top-1/2 h-0.5 bg-teal-bright shadow-[0_0_12px_#2DD4BF]', scanning && 'animate-scan')} />
                <ScanLine className="h-10 w-10 text-muted-light" />
              </div>
              <Button size="xl" variant="nightPrimary" block loading={scanning} onClick={scan}>{scanning ? 'Looking for a QR…' : 'Scan visitor QR'}</Button>
              <p className="text-center text-xs text-muted-light">Hold the visitor's phone 15 to 25 cm from the tablet camera.</p>
            </div>
          )}
          {mode === 'pin' && (
            <form onSubmit={byPin} className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">6-digit pass PIN
                <Input dark value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" placeholder="••••••" className="h-16 text-center font-mono text-3xl tracking-[0.4em]" />
              </label>
              <Button type="submit" size="xl" variant="nightPrimary" disabled={pin.length !== 6}>Check PIN</Button>
              <p className="text-xs text-muted-light">Demo: the PIN is shown under the QR on every pass. Farah Aqilah's is {passCode('v-10')}.</p>
            </form>
          )}
          {mode === 'search' && (
            <div className="flex flex-col gap-3">
              <div className="relative"><Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-light" /><Input dark autoFocus aria-label="Search visitors" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, plate or unit" className="pl-12" /></div>
              <ul className="flex flex-col gap-2">
                {results.map((r) => (
                  <li key={r.id}><button type="button" onClick={() => setFound(r.id)} className={cn('flex w-full items-center gap-3 rounded-xl p-3 text-left', found === r.id ? 'bg-brand/20 ring-1 ring-brand' : 'bg-night-field hover:bg-navy-700')}>
                    <FaceCrop variant={r.faceVariant} className="h-10 w-10" />
                    <span className="min-w-0 flex-1"><span className="block font-semibold">{r.name}</span><span className="text-xs text-muted-light">{r.unit} · {visitTypeLabel[r.type]}</span></span>
                    <Chip dark tone={visitStatusTone[r.status]}>{visitStatusLabel[r.status]}</Chip>
                  </button></li>
                ))}
                {q.trim().length >= 2 && !results.length && <li className="p-4 text-center text-sm text-muted-light">No visitor found. Use Walk-in to register them.</li>}
              </ul>
            </div>
          )}
        </section>

        <section className="flex min-h-[320px] flex-col gap-4 rounded-2xl border border-night-line bg-night-panel p-5">
          {!v || !val ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-light"><QrCode className="h-10 w-10" /><p className="font-semibold">The pass details appear here</p></div>
          ) : (
            <>
              <div className={cn('flex items-center gap-2 rounded-xl p-3 text-[15px] font-bold', val.ok ? 'bg-teal/15 text-[#5EEAD4]' : 'bg-danger/15 text-[#FFA3A6]')}>
                {val.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}{val.ok ? (v.status === 'on_site' ? 'Already inside' : 'Pass valid') : 'Do not let in'} · {val.text}
              </div>
              <div className="flex items-start gap-4">
                <FaceCrop variant={v.faceVariant} className="h-24 w-24" />
                <div className="flex flex-col gap-1">
                  <p className="text-xl font-extrabold">{v.name}{v.people > 1 ? ` +${v.people - 1}` : ''}</p>
                  <p className="text-sm text-[#C9D3EE]">{visitTypeLabel[v.type]} · {v.unit} · host {v.host}</p>
                  <div className="flex flex-wrap gap-1.5">{v.plate && <Plate light>{v.plate}</Plate>}<Chip dark tone={v.selfie ? 'teal' : 'grey'}>{v.selfie ? 'Selfie on file' : 'No selfie'}</Chip></div>
                </div>
              </div>
              {v.note && <p className="rounded-xl bg-night-field p-3 text-[13px] text-[#C9D3EE]">Note from host: {v.note}</p>}
              {v.status === 'expected' && val.ok && (
                <>
                  <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Entry point<Select dark value={entry} onChange={(e) => setEntry(e.target.value)}>{['Main gate · lane 1', 'Main gate · lane 2', 'Tower A lobby', 'Tower B lobby', 'Tower C lobby', 'Side gate'].map((g) => <option key={g}>{g}</option>)}</Select></label>
                  <div className="mt-auto flex gap-2">
                    <Button size="xl" variant="danger" icon={<XCircle className="h-5 w-5" />} onClick={() => { toast.warning('Entry refused', 'Logged with the reason "face did not match".'); setFound(null); }}>Refuse</Button>
                    <Button size="xl" variant="nightPrimary" className="flex-1" icon={<LogIn className="h-5 w-5" />} onClick={() => { checkInVisit(v.id, mode === 'qr' ? `QR · ${entry.split(' ·')[0].toLowerCase()}` : mode === 'pin' ? 'PIN · guard' : 'Guard search', 'Guard verified'); toast.success(`${v.name} checked in`, `${v.host} was notified.`); setFound(null); setPin(''); }}>Check in</Button>
                  </div>
                </>
              )}
              {v.status === 'on_site' && <Button size="xl" variant="night" className="mt-auto" icon={<LogOut className="h-5 w-5" />} onClick={() => { checkOutVisit(v.id); toast.success(`${v.name} checked out`); setFound(null); }}>Check out</Button>}
              {!val.ok && v.status !== 'on_site' && <Button size="xl" variant="night" className="mt-auto" onClick={() => toast.info(`Calling ${v.unit}`, 'Ask the resident to extend or reissue the pass.')}>Call the host</Button>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
