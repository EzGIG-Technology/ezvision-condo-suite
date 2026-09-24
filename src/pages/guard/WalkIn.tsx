import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, CheckCircle2, CreditCard, ExternalLink, Loader2, Phone, Printer, ShieldCheck, XCircle } from 'lucide-react';
import { useCurrentGuard, useStore } from '@/store/useStore';
import { FaceCrop } from '@/components/vision';
import { Checkbox, Input, Plate, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, relative } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

type Step = 'id' | 'face' | 'details' | 'wait' | 'done';
const STEPS: { key: Step; label: string }[] = [{ key: 'id', label: 'ID' }, { key: 'face', label: 'Face' }, { key: 'details', label: 'Visit' }, { key: 'wait', label: 'Resident' }, { key: 'done', label: 'Pass' }];
const PURPOSES = ['Visiting friend or family', 'Tutor', 'Aircond technician', 'Plumber or electrician', 'Delivery to unit', 'Property viewing', 'Other'];
const SAMPLE_IDS = [
  { name: 'Chew Siew Ling', last4: '4418', variant: 5 },
  { name: 'Muhammad Irfan Zakaria', last4: '0932', variant: 3 },
  { name: 'Kavitha Subramaniam', last4: '7120', variant: 7 },
];

export default function GuardWalkIn() {
  useDocumentTitle('Walk-in visitor');
  const loc = useLocation() as { state?: { alertId?: string; faceVariant?: number } };
  const navigate = useNavigate();
  const guard = useCurrentGuard();
  const units = useStore((s) => s.units);
  const approvals = useStore((s) => s.approvals);
  const visits = useStore((s) => s.visits);
  const watchlist = useStore((s) => s.watchlist);
  const { createApproval, respondApproval, checkInVisit, closeAlert } = useStore.getState();

  const [step, setStep] = useState<Step>('id');
  const [scanning, setScanning] = useState(false);
  const [name, setName] = useState('');
  const [last4, setLast4] = useState('');
  const [variant, setVariant] = useState(loc.state?.faceVariant ?? 5);
  const [faceTaken, setFaceTaken] = useState(false);
  const [checking, setChecking] = useState(false);
  const [unit, setUnit] = useState('A-15-07');
  const [purpose, setPurpose] = useState(PURPOSES[1]);
  const [plate, setPlate] = useState('');
  const [people, setPeople] = useState(1);
  const [sticker, setSticker] = useState(true);
  const [approvalId, setApprovalId] = useState<string | null>(null);

  const approval = approvals.find((a) => a.id === approvalId);
  const visit = visits.find((v) => v.id === approval?.visitId);
  const idx = STEPS.findIndex((s) => s.key === step);

  useEffect(() => {
    if (step === 'wait' && approval && approval.status !== 'waiting') {
      setStep('done');
      if (approval.status === 'approved') toast.success('Resident approved', `${approval.respondedBy ?? 'Resident'} let ${approval.visitorName} in.`);
      else toast.error('Resident declined', 'Politely refuse entry.');
    }
  }, [approval, step]);

  const scan = () => {
    setScanning(true);
    window.setTimeout(() => {
      const s = SAMPLE_IDS[Math.floor(Math.random() * SAMPLE_IDS.length)];
      setName(s.name); setLast4(s.last4); if (!loc.state?.faceVariant) setVariant(s.variant);
      setScanning(false);
      toast.success('IC read', 'Name and number filled from the chip. The IC image is not stored.');
    }, 900);
  };

  const takeFace = () => {
    setChecking(true);
    window.setTimeout(() => { setFaceTaken(true); setChecking(false); }, 1100);
  };

  const unitValid = /^[ABC]-\d{2}-\d{1,2}$/i.test(unit.trim());
  const knownUnit = units.find((u) => u.unit.toLowerCase() === unit.trim().toLowerCase());

  const sendRequest = () => {
    if (!unitValid) return toast.error('Check the unit number', 'Format is Tower-Floor-Unit, e.g. A-15-07.');
    const until = new Date(); until.setHours(23, 30, 0, 0);
    const id = createApproval({ visitorName: name, unit: unit.toUpperCase().trim(), purpose, plate: plate ? plate.toUpperCase() : undefined, faceVariant: variant, until: '23:30 tonight', idLast4: last4 || '0000' });
    setApprovalId(id);
    setStep('wait');
    toast.info(`Request sent to ${unit.toUpperCase()}`, 'App push, then WhatsApp, then a call after 60 seconds.');
  };

  const finish = () => {
    if (!visit) return;
    checkInVisit(visit.id, 'Walk-in · guard', `IC ••••${last4} + face`);
    if (loc.state?.alertId) closeAlert(loc.state.alertId, 'Registered as visitor', undefined, guard.name);
    toast.success(`${name} checked in`, sticker ? 'Visitor sticker printed.' : undefined);
    navigate('/guard');
  };

  const reset = () => { setStep('id'); setName(''); setLast4(''); setFaceTaken(false); setApprovalId(null); setPlate(''); setPeople(1); };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-center justify-between">
        <Link to="/guard" className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-light hover:text-white"><ArrowLeft className="h-4 w-4" />Gate console</Link>
        {step !== 'id' && step !== 'done' && <button type="button" onClick={reset} className="text-[13px] font-semibold text-muted-light hover:text-white">Start over</button>}
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight">Walk-in visitor</h1>
      {loc.state?.alertId && <p className="rounded-xl bg-brand/15 p-3 text-[13px] text-[#A9C4FF]">Registering the person from the alert. The alert closes automatically when they are checked in.</p>}

      <ol className="flex items-center gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold', i < idx ? 'bg-teal text-white' : i === idx ? 'bg-brand text-white' : 'bg-night-panel text-muted-light')} aria-current={i === idx ? 'step' : undefined}>{i < idx ? <Check className="h-4 w-4" /> : i + 1}</span>
            <span className={cn('hidden text-[13px] font-semibold sm:inline', i === idx ? 'text-white' : 'text-muted-light')}>{s.label}</span>
            {i < STEPS.length - 1 && <span className={cn('h-0.5 flex-1 rounded', i < idx ? 'bg-teal' : 'bg-night-line')} />}
          </li>
        ))}
      </ol>

      <section className="flex flex-col gap-5 rounded-2xl border border-night-line bg-night-panel p-5">
        {step === 'id' && (
          <>
            <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-navy-500 bg-night-field p-8 text-center">
              <CreditCard className="h-10 w-10 text-brand-light" />
              <p className="text-[15px] font-bold">Place the IC, passport or driving licence on the reader</p>
              <Button size="lg" variant="nightPrimary" loading={scanning} onClick={scan}>{scanning ? 'Reading…' : 'Scan ID'}</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Full name<Input dark value={name} onChange={(e) => setName(e.target.value)} placeholder="Or type it in" /></label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">ID last 4 digits<Input dark value={last4} maxLength={4} inputMode="numeric" onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} placeholder="0000" className="font-mono" /></label>
            </div>
            <Button size="xl" variant="nightPrimary" disabled={!name.trim() || last4.length !== 4} onClick={() => setStep('face')}>Next: face check</Button>
          </>
        )}

        {step === 'face' && (
          <>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <div className="relative">
                <FaceCrop variant={variant} className={cn('h-44 w-44', !faceTaken && 'opacity-60')} rounded="rounded-2xl" />
                {checking && <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-night/60"><Loader2 className="h-8 w-8 animate-spin" /></span>}
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <p className="text-[15px] font-bold">{name}</p>
                {!faceTaken ? (
                  <>
                    <p className="text-sm text-muted-light">Ask the visitor to look at the tablet camera. The face is checked against the watchlist ({watchlist.filter((w) => w.kind === 'person').length} people) and compared to the IC photo.</p>
                    <Button size="lg" variant="nightPrimary" icon={<Camera className="h-5 w-5" />} loading={checking} onClick={takeFace}>Take photo</Button>
                  </>
                ) : (
                  <ul className="flex flex-col gap-2 text-[14px]">
                    <li className="flex items-center gap-2 text-[#5EEAD4]"><CheckCircle2 className="h-5 w-5" />Matches IC photo · 97%</li>
                    <li className="flex items-center gap-2 text-[#5EEAD4]"><ShieldCheck className="h-5 w-5" />Not on the watchlist</li>
                    <li className="flex items-center gap-2 text-muted-light"><CheckCircle2 className="h-5 w-5" />First visit to Vista Harmoni</li>
                  </ul>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="xl" variant="night" onClick={() => setStep('id')}>Back</Button>
              <Button size="xl" variant="nightPrimary" className="flex-1" disabled={!faceTaken} onClick={() => setStep('details')}>Next: visit details</Button>
            </div>
          </>
        )}

        {step === 'details' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Visiting unit
                <Input dark list="unit-list" value={unit} onChange={(e) => setUnit(e.target.value)} className="font-mono uppercase" />
                <datalist id="unit-list">{units.map((u) => <option key={u.unit} value={u.unit}>{u.name}</option>)}</datalist>
                <span className={cn('font-medium', knownUnit ? 'text-[#5EEAD4]' : unitValid ? 'text-muted-light' : 'text-[#FFA3A6]')}>{knownUnit ? `${knownUnit.name}` : unitValid ? 'Household will be asked on the app' : 'Format: A-15-07'}</span>
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Purpose<Select dark value={purpose} onChange={(e) => setPurpose(e.target.value)}>{PURPOSES.map((p) => <option key={p}>{p}</option>)}</Select></label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Car plate (optional)<Input dark value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Walking in" className="font-mono uppercase" /></label>
              <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">People<Select dark value={people} onChange={(e) => setPeople(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</Select></label>
            </div>
            <p className="rounded-xl bg-night-field p-3 text-[13px] text-muted-light">Tip for the demo: keep unit <b className="text-white">A-15-07</b> and open the resident app in another tab to approve the request there.</p>
            <div className="flex gap-2">
              <Button size="xl" variant="night" onClick={() => setStep('face')}>Back</Button>
              <Button size="xl" variant="nightPrimary" className="flex-1" onClick={sendRequest}>Ask the resident</Button>
            </div>
          </>
        )}

        {step === 'wait' && approval && (
          <>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="relative flex h-20 w-20 items-center justify-center"><span className="absolute inset-0 animate-ping rounded-full bg-brand/30" /><FaceCrop variant={variant} className="relative h-16 w-16" rounded="rounded-full" /></span>
              <p className="text-lg font-extrabold">Waiting for {approval.unit}</p>
              <p className="text-sm text-muted-light">{approval.visitorName} · {approval.purpose}{approval.plate ? ` · ${approval.plate}` : ''} · sent {relative(approval.createdAt)}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button size="lg" variant="night" icon={<Phone className="h-4 w-4" />} onClick={() => toast.info(`Calling ${approval.unit}`, 'Intercom ringing…')}>Call the unit</Button>
              <a href={`/app/approval/${approval.id}`} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-navy-500 bg-navy-700 px-5 text-[15px] font-semibold hover:bg-[#1c2b6b]"><ExternalLink className="h-4 w-4" />Open resident app</a>
            </div>
            <div className="grid gap-2 border-t border-night-line pt-4 sm:grid-cols-2">
              <Button size="lg" variant="teal" onClick={() => respondApproval(approval.id, true, `${guard.name} (by phone)`)}>Resident said yes by phone</Button>
              <Button size="lg" variant="danger" onClick={() => respondApproval(approval.id, false, `${guard.name} (by phone)`)}>Resident said no</Button>
            </div>
          </>
        )}

        {step === 'done' && approval && (
          approval.status === 'approved' && visit ? (
            <>
              <div className="flex items-center gap-4">
                <FaceCrop variant={variant} className="h-20 w-20" />
                <div className="flex flex-col gap-1">
                  <p className="flex items-center gap-2 text-lg font-extrabold text-[#5EEAD4]"><CheckCircle2 className="h-5 w-5" />Approved by {approval.respondedBy}</p>
                  <p className="font-bold">{name}</p>
                  <p className="text-sm text-muted-light">{approval.unit} · valid until 23:30 tonight{visit.plate ? ' · bay V12, B1' : ''}</p>
                  {visit.plate && <Plate light>{visit.plate}</Plate>}
                </div>
              </div>
              <Checkbox dark checked={sticker} onChange={setSticker} label="Print visitor sticker" sub="Shows name, unit, time and a QR for the lobby turnstile." />
              <div className="flex gap-2">
                <Button size="xl" variant="night" icon={<Printer className="h-5 w-5" />} onClick={() => toast.success('Sticker printed')}>Print</Button>
                <Button size="xl" variant="nightPrimary" className="flex-1" onClick={finish}>Check in and open gate</Button>
              </div>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-lg font-extrabold text-[#FFA3A6]"><XCircle className="h-5 w-5" />{approval.unit} declined</p>
              <p className="text-sm text-[#C9D3EE]">Tell the visitor politely that the resident is not expecting them. The visit is logged and the face snapshot is kept for 30 days.</p>
              <div className="flex gap-2"><Button size="xl" variant="night" onClick={reset}>New walk-in</Button><Button size="xl" variant="nightPrimary" className="flex-1" onClick={() => navigate('/guard')}>Back to gate</Button></div>
            </>
          )
        )}
      </section>
    </div>
  );
}
