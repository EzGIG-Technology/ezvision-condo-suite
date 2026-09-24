import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Delete, DoorOpen, Phone, PhoneOff } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Logo } from '@/components/vision';
import { Segmented } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, passCode } from '@/lib/utils';
import { useCallTimeout, useDocumentTitle } from '@/lib/hooks';

/** The video intercom panel at a tower lobby door. A visitor keys in a unit and calls the resident's app. */
export default function LobbyPanel() {
  useDocumentTitle('Lobby intercom');
  const call = useStore((s) => s.call);
  const units = useStore((s) => s.units);
  const { startCall, endCall } = useStore.getState();
  const [tower, setTower] = useState<'A' | 'B' | 'C'>('A');
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'call' | 'pass'>('call');
  const [pin, setPin] = useState('');
  const [welcome, setWelcome] = useState<string | null>(null);
  const visits = useStore((s) => s.visits);
  const from = `Tower ${tower} lobby panel`;
  const mine = call && call.from === from ? call : null;
  const unit = `${tower}-${digits.slice(0, 2)}-${digits.slice(2, 4)}`;
  useCallTimeout(from);

  // Clear the screen a few seconds after a call ends.
  useEffect(() => {
    if (mine?.state !== 'ended') return;
    const t = window.setTimeout(() => { setDigits(''); useStore.setState({ call: null }); }, 6000);
    return () => window.clearTimeout(t);
  }, [mine?.state]);

  const press = (d: string) => { setError(''); if (mode === 'pass') setPin((x) => (x.length < 6 ? x + d : x)); else setDigits((x) => (x.length < 4 ? x + d : x)); };
  const back = () => (mode === 'pass' ? setPin((x) => x.slice(0, -1)) : setDigits((x) => x.slice(0, -1)));
  /** Guest QR or PIN at the intercom: a valid pass for this tower opens the door without the guard. */
  const openWithPass = () => {
    const nowMs = Date.now();
    const v = visits.find((x) => passCode(x.id) === pin);
    if (!v) return setError('That PIN does not match a visitor pass.');
    if (v.status !== 'expected' && v.status !== 'on_site') return setError('This pass is no longer active.');
    if (+new Date(v.validFrom) - 60 * 60_000 > nowMs || +new Date(v.validTo) < nowMs) return setError('This pass is not valid at this time.');
    if (v.unit[0] !== tower) return setError(`This pass is for Tower ${v.unit[0]}. Please use that lobby.`);
    if (v.status === 'expected') useStore.getState().checkInVisit(v.id, `Lobby panel PIN · Tower ${tower}`, 'Pass PIN at intercom');
    setWelcome(v.name.split(' ')[0]);
    setPin('');
    window.setTimeout(() => setWelcome(null), 6000);
  };
  const dial = () => {
    if (digits.length !== 4) return setError('Enter the floor and unit, for example 1507.');
    if (!units.some((u) => u.unit === unit) && unit !== 'A-15-07') return setError(`No resident at ${unit} is registered for the intercom.`);
    startCall(unit, from);
  };

  const screen = !mine ? null : mine.state === 'ringing' ? { tone: 'bg-brand', text: `Calling ${mine.unit}…`, sub: 'The resident sees you on their phone.' }
    : mine.state === 'answered' ? { tone: 'bg-teal', text: `Connected to ${mine.unit}`, sub: 'Please speak now.' }
    : mine.outcome === 'door_opened' ? { tone: 'bg-teal', text: 'Door open', sub: 'Please come in. The door locks again in 5 seconds.' }
    : mine.outcome === 'declined' ? { tone: 'bg-danger', text: 'The resident cannot take your call', sub: 'Please call the guardhouse on the panel, or message your host.' }
    : mine.outcome === 'missed' ? { tone: 'bg-warn text-navy', text: 'No answer', sub: 'Try again, or ask the guard at the main gate.' }
    : { tone: 'bg-night-panel', text: 'Call ended', sub: '' };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-night px-4 py-8 text-white">
      <div className="flex w-full max-w-sm flex-col gap-5">
        <div className="flex items-center justify-between"><Link to="/" aria-label="All apps" className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-light hover:bg-night-panel"><ArrowLeft className="h-5 w-5" /></Link><Logo dark size={26} /><span className="w-10" /></div>
        <Segmented dark full label="Lobby" value={tower} onChange={(t) => { setTower(t); setDigits(''); }} options={(['A', 'B', 'C'] as const).map((t) => ({ value: t, label: `Tower ${t}` }))} />
        {!screen && !welcome && <Segmented dark full label="Panel mode" value={mode} onChange={(m) => { setMode(m); setError(''); }} options={[{ value: 'call', label: 'Call a unit' }, { value: 'pass', label: 'I have a visitor pass' }]} />}
        {welcome ? (
          <div role="status" className="flex flex-col items-center gap-2 rounded-3xl bg-teal p-8 text-center">
            <DoorOpen className="h-10 w-10" />
            <p className="text-2xl font-extrabold">Welcome, {welcome}</p>
            <p className="text-sm opacity-90">Door open. Your host has been told you are here.</p>
          </div>
        ) : screen ? (
          <div role="status" className={cn('flex flex-col items-center gap-2 rounded-3xl p-8 text-center', screen.tone)}>
            {mine?.outcome === 'door_opened' ? <DoorOpen className="h-10 w-10" /> : <Phone className={cn('h-10 w-10', mine?.state === 'ringing' && 'animate-pulse2')} />}
            <p className="text-2xl font-extrabold">{screen.text}</p>
            <p className="text-sm opacity-90">{screen.sub}</p>
            {mine && mine.state !== 'ended' && <Button variant="night" icon={<PhoneOff className="h-4 w-4" />} onClick={() => endCall(mine.state === 'ringing' ? 'missed' : 'talked')} className="mt-3">Hang up</Button>}
          </div>
        ) : (
          <>
            {mode === 'pass' ? (
              <div className="flex flex-col items-center gap-1 rounded-3xl bg-night-panel p-6">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-light">Pass PIN</span>
                <span className="font-mono text-4xl font-extrabold tracking-[0.3em]" aria-live="polite">{pin.padEnd(6, '_')}</span>
                {error ? <span className="text-center text-sm text-[#FCA5A5]">{error}</span> : <span className="text-center text-sm text-muted-light">Hold your QR to the scanner, or type the 6-digit PIN under it. Guests with a selfie are let in by face.</span>}
              </div>
            ) : (
            <div className="flex flex-col items-center gap-1 rounded-3xl bg-night-panel p-6">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-light">Unit to call</span>
              <span className="font-mono text-4xl font-extrabold tracking-wider" aria-live="polite" aria-label={`Unit ${digits ? unit : 'not entered'}`}>{tower}-{digits.slice(0, 2).padEnd(2, '_')}-{digits.slice(2, 4).padEnd(2, '_')}</span>
              {error ? <span className="text-center text-sm text-[#FCA5A5]">{error}</span> : <span className="text-sm text-muted-light">Floor, then unit number</span>}
            </div>
            )}
            <div className="grid grid-cols-3 gap-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => <button key={d} type="button" onClick={() => press(d)} className="h-16 rounded-2xl bg-night-panel text-2xl font-bold hover:bg-navy-600 active:bg-brand">{d}</button>)}
              <button type="button" aria-label="Delete digit" disabled={mode === 'pass' ? !pin : !digits} onClick={back} className="flex h-16 items-center justify-center rounded-2xl text-muted-light hover:bg-night-panel disabled:opacity-40"><Delete className="h-6 w-6" /></button>
              <button type="button" onClick={() => press('0')} className="h-16 rounded-2xl bg-night-panel text-2xl font-bold hover:bg-navy-600 active:bg-brand">0</button>
              {mode === 'pass'
                ? <button type="button" aria-label="Open door with pass" onClick={() => (pin.length === 6 ? openWithPass() : setError('Enter all 6 digits of the PIN.'))} className="flex h-16 items-center justify-center rounded-2xl bg-teal text-white hover:bg-teal-dark"><DoorOpen className="h-6 w-6" /></button>
                : <button type="button" aria-label={`Call ${unit}`} onClick={dial} className="flex h-16 items-center justify-center rounded-2xl bg-teal text-white hover:bg-teal-dark"><Phone className="h-6 w-6" /></button>}
            </div>
          </>
        )}
        <p className="text-center text-xs text-muted-light">Residents answer on their phone and can open this door. Calls are not recorded.</p>
      </div>
    </div>
  );
}
