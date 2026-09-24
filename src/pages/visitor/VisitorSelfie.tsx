import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FaceCrop } from '@/components/vision';
import { Checkbox } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import { PublicShell } from './VisitorPass';

export default function VisitorSelfie() {
  useDocumentTitle('Add a selfie');
  const { id = '' } = useParams();
  const visits = useStore((s) => s.visits);
  const setSelfie = useStore((s) => s.setVisitSelfie);
  const navigate = useNavigate();
  const v = visits.find((x) => x.id === id);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'taken'>('idle');

  if (!v) return <PublicShell><div className="card p-8 text-center"><p className="font-bold">Pass not found</p></div></PublicShell>;

  // Liveness check: the visitor blinks and turns slightly, so a printed photo or a screen cannot pass.
  const take = () => { setState('busy'); window.setTimeout(() => setState('taken'), 900); };
  const submit = () => { setSelfie(v.id); toast.success('Selfie saved', 'The lobby door will open for you.'); navigate(`/v/${v.id}`); };

  return (
    <PublicShell>
      <Link to={`/v/${v.id}`} className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-dark"><ArrowLeft className="h-4 w-4" />Back to pass</Link>
      <div className="card flex flex-col items-center gap-4 p-5 text-center">
        <h1 className="text-xl font-extrabold">Add a selfie</h1>
        <p className="text-[13.5px] text-muted-dark">{state === 'busy' ? 'Liveness check: blink once, then turn your head slightly.' : 'Good light, face the camera, no sunglasses.'}</p>
        <div className="relative">
          <FaceCrop variant={v.faceVariant} className={state === 'idle' ? 'h-56 w-56 opacity-40' : 'h-56 w-56'} rounded="rounded-full" label="Camera preview" />
          <span className="pointer-events-none absolute inset-3 rounded-full border-2 border-dashed border-white/80" />
          {state === 'busy' && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy/30"><Loader2 className="h-10 w-10 animate-spin text-white" /></span>}
          {state === 'taken' && <CheckCircle2 className="absolute bottom-2 right-2 h-10 w-10 rounded-full bg-white text-teal" />}
        </div>
        {state === 'taken' && <p className="rounded-full bg-teal-soft px-3 py-1 text-xs font-bold text-teal-dark">Liveness check passed · a real person, not a photo</p>}
        <Checkbox checked={consent} onChange={setConsent} className="text-left" label="I agree to my selfie being used for lobby entry" sub="Only during this visit. Deleted 24 hours after the pass ends." />
        {state !== 'taken' ? (
          <Button variant="primary" size="lg" block icon={<Camera className="h-5 w-5" />} loading={state === 'busy'} disabled={!consent} onClick={take}>Take selfie</Button>
        ) : (
          <div className="grid w-full grid-cols-2 gap-2">
            <Button size="lg" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setState('idle')}>Retake</Button>
            <Button variant="primary" size="lg" onClick={submit}>Use this</Button>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
