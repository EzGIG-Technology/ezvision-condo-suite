import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Delete } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Logo } from '@/components/vision';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

export default function GuardLogin() {
  useDocumentTitle('Guard sign-in');
  const guards = useStore((s) => s.guards);
  const loginGuard = useStore((s) => s.loginGuard);
  const signedIn = useStore((s) => s.session.guardId);
  const navigate = useNavigate();
  const [sel, setSel] = useState('g-2');
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const guard = guards.find((g) => g.id === sel)!;

  useEffect(() => { if (signedIn) navigate('/guard', { replace: true }); }, [signedIn, navigate]);

  useEffect(() => {
    if (pin.length < 4) return;
    if (pin === guard.pin) {
      loginGuard(guard.id);
      if (guard.state === 'Off duty') useStore.getState().setGuardState(guard.id, 'At post', 'Guardhouse · Main gate');
      toast.success(`Welcome, ${guard.name.split(' ')[0]}`, 'Shift started. Handover notes are on the Report tab.');
      navigate('/guard', { replace: true });
    } else {
      setShake(true);
      toast.error('Wrong PIN', 'Try again, or ask the supervisor to reset it.');
      window.setTimeout(() => { setShake(false); setPin(''); }, 450);
    }
  }, [pin, guard, loginGuard, navigate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setPin((p) => (p.length < 4 ? p + e.key : p));
      if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const press = (d: string) => setPin((p) => (p.length < 4 ? p + d : p));

  return (
    <div className="flex min-h-screen flex-col bg-night text-white">
      <header className="flex items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-light hover:text-white"><ArrowLeft className="h-4 w-4" />All apps</Link>
        <Logo dark sub="Guard tablet" />
        <span className="w-16" />
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-5 pb-10 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Who's on duty?</h1>
          <p className="text-muted-light">Tap your name, then enter your 4-digit PIN.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {guards.map((g) => (
              <button key={g.id} type="button" onClick={() => { setSel(g.id); setPin(''); }} aria-pressed={sel === g.id}
                className={cn('flex flex-col items-center gap-2 rounded-2xl border p-4 transition-colors', sel === g.id ? 'border-brand bg-brand/15' : 'border-night-line bg-night-panel hover:border-navy-500')}>
                <Avatar name={g.name} color={g.color} size={48} />
                <span className="text-center text-[13.5px] font-bold leading-tight">{g.name}</span>
                <span className="text-[11px] text-muted-light">{g.shift} shift</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-light">Demo PINs: Kumar 2468 · Aiman 1111 · Taufiq 3333 · Nor Azman 4444 · Bishnu 5555 · Suhaimi 6666</p>
        </section>
        <section className="mx-auto flex w-full max-w-xs flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar name={guard.name} color={guard.color} size={64} />
            <p className="text-lg font-bold">{guard.name}</p>
          </div>
          <div className={cn('flex gap-4', shake && 'animate-shake')} aria-label={`${pin.length} of 4 digits entered`} role="status">
            {[0, 1, 2, 3].map((i) => <span key={i} className={cn('h-4 w-4 rounded-full border-2', i < pin.length ? 'border-brand-light bg-brand-light' : 'border-navy-500')} />)}
          </div>
          <div className="grid w-full grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <button key={d} type="button" onClick={() => press(d)} className="h-16 rounded-2xl bg-night-panel text-2xl font-bold hover:bg-navy-600 active:bg-brand">{d}</button>
            ))}
            <span />
            <button type="button" onClick={() => press('0')} className="h-16 rounded-2xl bg-night-panel text-2xl font-bold hover:bg-navy-600 active:bg-brand">0</button>
            <button type="button" aria-label="Delete digit" disabled={!pin.length} onClick={() => setPin((p) => p.slice(0, -1))} className="flex h-16 items-center justify-center rounded-2xl text-muted-light hover:bg-night-panel disabled:opacity-30"><Delete className="h-6 w-6" /></button>
          </div>
          <button type="button" onClick={() => toast.info('Supervisor notified', 'Mr Ravi (Securiforce) will call the guardhouse to reset your PIN.')} className="text-[13px] font-semibold text-brand-light">Forgot PIN?</button>
        </section>
      </main>
    </div>
  );
}
