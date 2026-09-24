import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Flame, HeartPulse, Phone, ShieldAlert, UserX, HelpCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/Button';
import { cn, hhmm } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

const KINDS = [
  { key: 'Medical', icon: HeartPulse },
  { key: 'Intruder', icon: UserX },
  { key: 'Fire or smoke', icon: Flame },
  { key: 'Other', icon: HelpCircle },
];
const HOLD_MS = 2000;

export default function ResidentSOS() {
  useDocumentTitle('Emergency SOS');
  const session = useStore((s) => s.session.resident);
  const alerts = useStore((s) => s.alerts);
  const { createAlert, closeAlert } = useStore.getState();
  const [kind, setKind] = useState('Medical');
  const [progress, setProgress] = useState(0);
  const [alertId, setAlertId] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const started = useRef(0);
  const a = alerts.find((x) => x.id === alertId);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  if (!session) return <Navigate to="/app/login" replace />;

  const send = () => {
    const id = createAlert({
      category: 'sos', title: `SOS · ${kind} · ${session.unit}`, where: `Unit ${session.unit}, Tower A level 15`, camera: 'CAM 30 · Tower A L15 lift lobby', scene: 'corridor',
      at: new Date().toISOString(), severity: 'critical', unit: session.unit, summary: `${session.name} pressed SOS in the resident app (${kind.toLowerCase()}). Phone location matches Tower A. Nearest camera is the L15 lift lobby.`,
      timelineText: `SOS from ${session.name} (${kind})`,
    });
    setAlertId(id);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  const start = () => {
    started.current = Date.now();
    timer.current = window.setInterval(() => {
      const p = Math.min(1, (Date.now() - started.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) { stop(); send(); }
    }, 30);
  };
  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    setProgress(0);
  };
  const tap = () => { if (!alertId && Date.now() - started.current < 400) toast.info('Keep holding', 'Hold the button for 2 seconds so it is not sent by accident.'); };

  const steps = a ? [
    { label: 'Guardhouse alerted', done: true, at: a.at },
    { label: 'A guard has it', done: a.status !== 'open', at: a.timeline.find((t) => t.kind === 'guard')?.at },
    { label: 'Guard on the way', done: ['dispatched', 'on_scene', 'closed'].includes(a.status) },
    { label: 'Guard with you', done: a.status === 'on_scene' || (a.status === 'closed' && a.outcome !== 'Cancelled by resident') },
  ] : [];

  return (
    <div className="min-h-screen bg-[#E9EEF7] sm:py-6">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-[#2B0A0A] text-white sm:min-h-[calc(100vh-48px)] sm:rounded-[32px] sm:shadow-pop">
        <div className="flex items-center px-3 py-3"><Link to="/app" className="flex items-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-semibold text-white/80 hover:bg-white/10"><ArrowLeft className="h-4 w-4" />Back</Link></div>
        {!a ? (
          <div className="flex flex-1 flex-col items-center gap-6 px-6 pb-10">
            <div className="text-center"><h1 className="text-2xl font-extrabold">Emergency SOS</h1><p className="mt-1 text-sm text-white/75">Alerts the guardhouse and the on-call manager with your unit and location.</p></div>
            <div className="grid w-full grid-cols-2 gap-2">
              {KINDS.map((k) => <button key={k.key} type="button" aria-pressed={kind === k.key} onClick={() => setKind(k.key)} className={cn('flex h-14 items-center justify-center gap-2 rounded-2xl border text-[14px] font-semibold', kind === k.key ? 'border-white bg-white text-[#7A1010]' : 'border-white/20 bg-white/5')}><k.icon className="h-5 w-5" />{k.key}</button>)}
            </div>
            <button type="button" aria-label="Hold for 2 seconds to send SOS"
              onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onClick={tap}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !timer.current) { e.preventDefault(); start(); } }} onKeyUp={stop}
              className="relative mt-4 flex h-56 w-56 select-none items-center justify-center rounded-full bg-danger shadow-[0_0_0_14px_rgba(229,72,77,.25),0_0_0_28px_rgba(229,72,77,.12)] active:scale-[.98]" style={{ touchAction: 'none' }}>
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden><circle cx="50" cy="50" r="47" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray={`${progress * 295} 295`} strokeLinecap="round" /></svg>
              <span className="flex flex-col items-center gap-1"><ShieldAlert className="h-12 w-12" /><span className="text-xl font-extrabold">SOS</span><span className="text-xs text-white/85">{progress > 0 ? 'Keep holding…' : 'Hold 2 seconds'}</span></span>
            </button>
            <a href="tel:999" className="mt-auto flex items-center gap-2 text-sm font-semibold text-white/80"><Phone className="h-4 w-4" />For police, fire or ambulance, call 999</a>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-5 px-6 pb-10">
            <div className="flex flex-col items-center gap-2 text-center">
              {a.status === 'closed' ? <CheckCircle2 className="h-14 w-14 text-teal-bright" /> : <span className="flex h-16 w-16 animate-pulse2 items-center justify-center rounded-full bg-danger"><ShieldAlert className="h-8 w-8" /></span>}
              <h1 className="text-2xl font-extrabold">{a.status === 'closed' ? 'Resolved' : 'Help is coming'}</h1>
              <p className="text-sm text-white/75">{a.ref} · sent {hhmm(a.at)} · {kind}</p>
            </div>
            <ol className="flex flex-col gap-3 rounded-2xl bg-white/5 p-4">
              {steps.map((s) => (
                <li key={s.label} className="flex items-center gap-3"><span className={cn('flex h-6 w-6 items-center justify-center rounded-full', s.done ? 'bg-teal-bright text-[#062A26]' : 'border border-white/30')}>{s.done && <CheckCircle2 className="h-4 w-4" />}</span><span className={cn('flex-1 text-[14px]', !s.done && 'text-white/60')}>{s.label}</span>{s.at && <span className="text-xs text-white/60">{hhmm(s.at)}</span>}</li>
              ))}
            </ol>
            {a.owner && a.status !== 'closed' && <p className="rounded-2xl bg-white/10 p-4 text-[14px]"><b>{a.owner}</b> is handling your alert. Stay where you are if it is safe.</p>}
            <div className="mt-auto flex flex-col gap-2">
              <Button size="xl" variant="white" icon={<Phone className="h-5 w-5" />} onClick={() => toast.info('Calling the guardhouse', '03-7800 1200')}>Call the guardhouse</Button>
              {a.status !== 'closed' && <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => { closeAlert(a.id, 'Cancelled by resident', undefined, session.name); toast.info('SOS cancelled', 'The guardhouse was told it was a false alarm.'); }}>It was a mistake, cancel SOS</Button>}
              {a.status === 'closed' && <Link to="/app" className="text-center text-sm font-bold text-white/85">Back to home</Link>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
