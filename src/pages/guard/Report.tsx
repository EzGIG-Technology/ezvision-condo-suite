import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, ClipboardCheck, FileWarning } from 'lucide-react';
import { useCurrentGuard, useStore } from '@/store/useStore';
import { Checkbox, Confirm, Input, Segmented, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import type { Alert, Scene } from '@/data/types';

const TYPES: { label: string; scene: Scene; sev: Alert['severity'] }[] = [
  { label: 'Suspicious person', scene: 'lobby', sev: 'high' },
  { label: 'Vehicle problem', scene: 'carpark', sev: 'warning' },
  { label: 'Damage to property', scene: 'corridor', sev: 'warning' },
  { label: 'Noise complaint', scene: 'corridor', sev: 'nuisance' },
  { label: 'Medical emergency', scene: 'pool', sev: 'critical' },
  { label: 'Facility fault', scene: 'guardpost', sev: 'info' },
];
const PLACES = ['Main gate', 'Side gate', 'Tower A lobby', 'Tower B lobby', 'Tower C lobby', 'Carpark B1', 'Carpark B2', 'Carpark B3', 'Pool deck', 'Gym', 'Bin centre', 'Perimeter'];

export default function GuardReport() {
  useDocumentTitle('Report');
  const guard = useCurrentGuard();
  const alerts = useStore((s) => s.alerts);
  const visits = useStore((s) => s.visits);
  const parcels = useStore((s) => s.parcels);
  const cps = useStore((s) => s.checkpoints);
  const { createAlert, logoutGuard, setGuardState, log } = useStore.getState();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'incident' | 'handover'>('incident');
  const [type, setType] = useState(TYPES[0].label);
  const [place, setPlace] = useState(PLACES[0]);
  const [unit, setUnit] = useState('');
  const [desc, setDesc] = useState('');
  const [photos, setPhotos] = useState(0);
  const [notes, setNotes] = useState('');
  const [checks, setChecks] = useState({ keys: false, radio: false, log: false, cctv: false });
  const [signOff, setSignOff] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (desc.trim().length < 10) return toast.error('Add a few more details', 'At least one sentence on what happened.');
    const t = TYPES.find((x) => x.label === type)!;
    const id = createAlert({ category: 'report', title: `${type} · ${place}`, where: place, camera: `Guard report · ${guard.name}`, scene: t.scene, at: new Date().toISOString(), severity: t.sev, summary: desc, owner: guard.name, status: 'acknowledged', unit: unit ? unit.toUpperCase() : undefined, timelineText: `Report filed by ${guard.name}${photos ? ` with ${photos} photo${photos > 1 ? 's' : ''}` : ''}` });
    toast.success('Report filed', `Reference ${useStore.getState().alerts.find((a) => a.id === id)?.ref}. The manager has been notified.`);
    setDesc(''); setUnit(''); setPhotos(0);
  };

  const shiftStart = Date.now() - 12 * 3600_000;
  const myClosed = alerts.filter((a) => a.status === 'closed' && a.timeline.some((t) => t.text.includes(guard.name))).length;
  const stats = [
    ['Alerts handled', alerts.filter((a) => +new Date(a.at) > shiftStart).length],
    ['Closed by you', myClosed],
    ['Still open', alerts.filter((a) => a.status !== 'closed').length],
    ['Visitors in', visits.filter((v) => v.checkIn && +new Date(v.checkIn) > shiftStart).length],
    ['Parcels logged', parcels.filter((p) => +new Date(p.loggedAt) > shiftStart).length],
    ['Checkpoints', `${cps.filter((c) => c.status === 'done' || c.status === 'late').length}/${cps.length}`],
  ];
  const allChecked = Object.values(checks).every(Boolean);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Report</h1>
        <Segmented dark label="Report type" value={tab} onChange={setTab} options={[{ value: 'incident', label: 'Incident report' }, { value: 'handover', label: 'Shift handover' }]} />
      </div>

      {tab === 'incident' ? (
        <form onSubmit={submit} className="flex max-w-3xl flex-col gap-4 rounded-2xl border border-night-line bg-night-panel p-5">
          <div className="flex flex-col gap-1.5"><span className="text-xs font-bold text-muted-light">What happened?</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{TYPES.map((t) => <button key={t.label} type="button" aria-pressed={type === t.label} onClick={() => setType(t.label)} className={cn('h-14 rounded-xl border px-3 text-[13.5px] font-semibold', type === t.label ? 'border-brand bg-brand/20' : 'border-navy-500 bg-night-field hover:bg-navy-700')}>{t.label}</button>)}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Where<Select dark value={place} onChange={(e) => setPlace(e.target.value)}>{PLACES.map((p) => <option key={p}>{p}</option>)}</Select></label>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Unit involved (optional)<Input dark value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="B-07-11" className="font-mono uppercase" /></label>
          </div>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Details<Textarea dark value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Who, what, when, and what you did" /></label>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" variant="night" icon={<Camera className="h-5 w-5" />} onClick={() => { setPhotos((n) => n + 1); toast.success('Photo added'); }}>Add photo</Button>
            {photos > 0 && <span className="text-sm text-muted-light">{photos} photo{photos > 1 ? 's' : ''} attached</span>}
            <span className="text-xs text-muted-light">The nearest camera clip is attached automatically.</span>
          </div>
          <Button type="submit" size="xl" variant="nightPrimary" icon={<FileWarning className="h-5 w-5" />}>File report</Button>
        </form>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          <section className="flex flex-col gap-4 rounded-2xl border border-night-line bg-night-panel p-5">
            <h2 className="text-base font-extrabold">Your shift so far</h2>
            <div className="grid grid-cols-3 gap-2">{stats.map(([l, v]) => <div key={String(l)} className="rounded-xl bg-night-field p-3"><p className="text-2xl font-extrabold">{v}</p><p className="text-xs text-muted-light">{l}</p></div>)}</div>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Notes for the next guard<Textarea dark value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Contractor at C-21-02 still inside, told to leave by 19:00" /></label>
          </section>
          <section className="flex flex-col gap-4 rounded-2xl border border-night-line bg-night-panel p-5">
            <h2 className="text-base font-extrabold">Handover checklist</h2>
            <Checkbox dark checked={checks.keys} onChange={(v) => setChecks({ ...checks, keys: v })} label="Keys and access cards counted" />
            <Checkbox dark checked={checks.radio} onChange={(v) => setChecks({ ...checks, radio: v })} label="Radio and torch handed over, charged" />
            <Checkbox dark checked={checks.log} onChange={(v) => setChecks({ ...checks, log: v })} label="Open alerts explained to the next guard" />
            <Checkbox dark checked={checks.cctv} onChange={(v) => setChecks({ ...checks, cctv: v })} label="Guardhouse screens and barrier checked" />
            <Button size="xl" variant="nightPrimary" icon={<ClipboardCheck className="h-5 w-5" />} disabled={!allChecked} onClick={() => setSignOff(true)}>Sign off shift</Button>
            {!allChecked && <p className="text-xs text-muted-light">Tick every item to sign off.</p>}
            {allChecked && <p className="flex items-center gap-1.5 text-xs text-[#5EEAD4]"><CheckCircle2 className="h-4 w-4" />Ready to hand over</p>}
          </section>
        </div>
      )}

      <Confirm dark open={signOff} onClose={() => setSignOff(false)} title="Sign off and log out?" confirmLabel="Sign off"
        body="Your handover is saved with your name and time. The next guard signs in with their own PIN."
        onConfirm={() => {
          log({ who: guard.name, role: 'Guard', action: 'Closed', record: `Shift handover${notes ? `: ${notes.slice(0, 60)}` : ''}` });
          setGuardState(guard.id, 'Off duty', 'Off duty');
          logoutGuard();
          toast.success('Shift signed off', 'Thank you. Rest well.');
          navigate('/guard/login');
        }} />
    </div>
  );
}
