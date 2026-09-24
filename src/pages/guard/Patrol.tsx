import { useState } from 'react';
import { AlertTriangle, CheckCircle2, MapPin, RotateCcw, ScanFace } from 'lucide-react';
import { useCurrentGuard, useStore } from '@/store/useStore';
import { CamFeed } from '@/components/vision';
import { Chip, Modal, Progress, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, hhmm, relative } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import type { Scene } from '@/data/types';

const FILL = { done: '#14B8A6', late: '#F59E0B', missed: '#E5484D', next: '#3B82F6', todo: '#2A3A78' } as const;
const sceneFor = (name: string): Scene => (/fence|roof/i.test(name) ? 'fence' : /lobby|gym/i.test(name) ? 'lobby' : /carpark|ramp/i.test(name) ? 'carpark' : /pool/i.test(name) ? 'pool' : /bin/i.test(name) ? 'bin' : /side/i.test(name) ? 'sidegate' : 'guardpost');

export default function GuardPatrol() {
  useDocumentTitle('Patrol');
  const cps = useStore((s) => s.checkpoints);
  const startedAt = useStore((s) => s.patrolStartedAt);
  const guard = useCurrentGuard();
  const { verifyCheckpoint, startNewRound, createAlert, setGuardState } = useStore.getState();
  const [verifying, setVerifying] = useState(false);
  const [problem, setProblem] = useState(false);
  const [kind, setKind] = useState('Door or gate left open');
  const [note, setNote] = useState('');

  const next = cps.find((c) => c.status === 'next');
  const done = cps.filter((c) => c.status === 'done' || c.status === 'late').length;
  const complete = !next && cps.every((c) => c.status !== 'todo');

  const verify = () => {
    if (!next) return;
    setVerifying(true);
    window.setTimeout(() => {
      verifyCheckpoint(next.id);
      setGuardState(guard.id, 'Patrolling', `Patrol · ${done + 1} of ${cps.length}`);
      setVerifying(false);
      toast.success(`${next.name} verified`, `${next.camera} saw you at ${hhmm(new Date().toISOString())}.`);
    }, 1100);
  };

  const report = () => {
    const where = next?.name ?? 'Patrol route';
    createAlert({ category: 'report', title: `${kind} at ${where}`, where, camera: next ? `${next.camera} · ${next.name}` : 'Guard report', scene: sceneFor(where), at: new Date().toISOString(), severity: 'warning', summary: note || `${guard.name} reported: ${kind.toLowerCase()} at ${where}.`, owner: guard.name, status: 'acknowledged', timelineText: `Reported by ${guard.name} on patrol` });
    toast.success('Reported', 'The manager sees it on the Command Center.');
    setProblem(false); setNote('');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">Patrol</h1><p className="text-sm text-muted-light">Round started {relative(startedAt)} · {done} of {cps.length} checkpoints</p></div>
        <div className="w-full sm:w-64"><Progress value={(done / cps.length) * 100} color="#2DD4BF" track="#1E2B5E" label="Patrol progress" /></div>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-night-line bg-night-panel p-4">
          <svg viewBox="0 0 700 530" className="h-auto w-full" role="img" aria-label="Patrol route map">
            <rect x="10" y="10" width="680" height="510" rx="18" fill="#0C1638" stroke="#1E2B5E" strokeWidth="2" />
            {[[190, 150, 'Tower A'], [400, 150, 'Tower C'], [510, 420, 'Tower B']].map(([x, y, l]) => (
              <g key={String(l)}><rect x={Number(x)} y={Number(y)} width="110" height="90" rx="10" fill="#16235A" /><text x={Number(x) + 55} y={Number(y) + 78} textAnchor="middle" fill="#9FB0DB" fontSize="15" fontWeight="700">{l}</text></g>
            ))}
            <rect x="300" y="190" width="100" height="55" rx="10" fill="#123A5C" /><text x="350" y="222" textAnchor="middle" fill="#7FA6FF" fontSize="12">Pool</text>
            <polyline points={cps.map((c) => `${c.x},${c.y}`).join(' ')} fill="none" stroke="#2A3A78" strokeWidth="3" strokeDasharray="6 6" />
            {cps.map((c, i) => (
              <g key={c.id}>
                {c.status === 'next' && <circle cx={c.x} cy={c.y} r="22" fill="#3B82F6" opacity="0.25" className="animate-pulse2" />}
                <circle cx={c.x} cy={c.y} r="13" fill={FILL[c.status]} stroke="#0A1230" strokeWidth="3" />
                <text x={c.x} y={c.y + 4} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="800">{i + 1}</text>
              </g>
            ))}
          </svg>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {cps.map((c, i) => (
              <li key={c.id} className="flex items-center gap-2 text-[13px]">
                <span className="h-3 w-3 rounded-full" style={{ background: FILL[c.status] }} />
                <span className={cn('flex-1', c.status === 'next' ? 'font-bold text-white' : 'text-[#C9D3EE]')}>{i + 1}. {c.name}</span>
                <span className="text-xs text-muted-light">{c.at ? hhmm(c.at) : c.status === 'next' ? 'Next' : ''}{c.status === 'late' ? ' · late' : ''}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex flex-col gap-3">
          {next ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-night-line bg-night-panel p-4">
              <Chip dark tone="blue" dot>Next checkpoint</Chip>
              <p className="flex items-center gap-2 text-xl font-extrabold"><MapPin className="h-5 w-5 text-brand-light" />{next.name}</p>
              <CamFeed scene={sceneFor(next.name)} tone="blue" tag="Looking for guard" cam={next.camera} size="sm" className="rounded-xl" showBox={verifying} boxLabel={verifying ? `${guard.name} · 98%` : undefined} />
              <p className="text-[13px] text-muted-light">Stand in view of {next.camera}. The camera confirms you were there, so no NFC tags are needed.</p>
              <Button size="xl" variant="nightPrimary" icon={<ScanFace className="h-5 w-5" />} loading={verifying} onClick={verify}>{verifying ? 'Checking camera…' : "I'm here"}</Button>
              <Button size="lg" variant="night" icon={<AlertTriangle className="h-4 w-4" />} onClick={() => setProblem(true)}>Report a problem here</Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border border-night-line bg-night-panel p-4">
              <p className="flex items-center gap-2 text-lg font-extrabold text-[#5EEAD4]"><CheckCircle2 className="h-5 w-5" />{complete ? 'Round complete' : 'No round in progress'}</p>
              <p className="text-sm text-muted-light">Next round is due at the top of the hour.</p>
              <Button size="xl" variant="nightPrimary" icon={<RotateCcw className="h-5 w-5" />} onClick={() => { startNewRound(); setGuardState(guard.id, 'Patrolling', `Patrol · 0 of ${cps.length}`); toast.success('New round started'); }}>Start new round</Button>
            </div>
          )}
          <Button size="lg" variant="night" onClick={() => { setGuardState(guard.id, 'At post', 'Guardhouse · Main gate'); toast.info('Back at post'); }}>I'm back at the guardhouse</Button>
        </aside>
      </div>

      <Modal dark open={problem} onClose={() => setProblem(false)} title="Report a problem" description={next ? `At ${next.name}` : undefined}
        footer={<><Button variant="night" onClick={() => setProblem(false)}>Cancel</Button><Button variant="nightPrimary" onClick={report}>Send report</Button></>}>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">What did you find?<Select dark value={kind} onChange={(e) => setKind(e.target.value)}>{['Door or gate left open', 'Light not working', 'Water leak', 'Suspicious person', 'Damage to property', 'Camera blocked or moved', 'Other'].map((k) => <option key={k}>{k}</option>)}</Select></label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Details<Textarea dark value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" /></label>
        </div>
      </Modal>
    </div>
  );
}
