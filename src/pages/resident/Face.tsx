import { useState } from 'react';
import { CheckCircle2, Loader2, ScanFace, ShieldCheck, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FaceCrop } from '@/components/vision';
import { Card, Checkbox, Confirm } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

const ANGLES = ['Look straight ahead', 'Turn slightly left', 'Turn slightly right'];

export default function ResidentFace() {
  useDocumentTitle('Face access');
  const enrolled = useStore((s) => s.faceEnrolled);
  const resident = useStore((s) => s.resident);
  const units = useStore((s) => s.units);
  const { setFaceEnrolled, updateUnit } = useStore.getState();
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(false);

  const setHousehold = (face: boolean) => {
    const u = units.find((x) => x.unit === resident.unit);
    if (u) updateUnit(u.unit, { household: u.household.map((h) => (h.name === resident.name ? { ...h, face } : h)) });
  };

  const capture = () => {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      if (step < ANGLES.length - 1) setStep(step + 1);
      else { setFaceEnrolled(true); setHousehold(true); setStep(-1); toast.success('Face access is on', 'Walk up to any lobby turnstile in Tower A.'); }
    }, 800);
  };

  if (enrolled) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-soft text-teal-dark"><CheckCircle2 className="h-8 w-8" /></span>
          <h1 className="text-xl font-extrabold">Face access is on</h1>
          <p className="text-[13.5px] text-muted-dark">Tower A lobby turnstiles, the B1 lift lobby and the gym open for you without a card.</p>
        </Card>
        <Card className="flex flex-col gap-2 p-4 text-[13px] text-muted-dark">
          <p className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-teal" />Only a numeric template is stored, on the on-site server. No photo leaves the building.</p>
          <p className="flex gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-teal" />Deleted automatically 7 days after your tenancy ends.</p>
        </Card>
        <Button size="lg" icon={<Trash2 className="h-4 w-4" />} onClick={() => setDel(true)}>Turn off and delete my face data</Button>
        <Confirm open={del} onClose={() => setDel(false)} danger confirmLabel="Delete" title="Delete face data?" body="Your template is deleted now. You will need your access card again."
          onConfirm={() => { setFaceEnrolled(false); setHousehold(false); toast.info('Face data deleted', 'Logged in the building\'s PDPA audit log.'); }} />
      </div>
    );
  }

  if (step >= 0) {
    return (
      <div className="flex flex-col items-center gap-5 pt-2">
        <div className="relative">
          <FaceCrop variant={2} className="h-64 w-64" rounded="rounded-full" label="Camera preview" />
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden><circle cx="50" cy="50" r="48" fill="none" stroke="#14A38F" strokeWidth="3" strokeDasharray={`${((step + (busy ? 1 : 0)) / ANGLES.length) * 301} 301`} strokeLinecap="round" /></svg>
          {busy && <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy/30"><Loader2 className="h-10 w-10 animate-spin text-white" /></span>}
        </div>
        <p className="text-lg font-extrabold">{ANGLES[step]}</p>
        <div className="flex gap-2">{ANGLES.map((a, i) => <span key={a} className={cn('h-2 w-8 rounded-full', i < step ? 'bg-teal' : i === step ? 'bg-brand' : 'bg-line-strong')} />)}</div>
        <Button variant="primary" size="lg" block loading={busy} onClick={capture}>Capture</Button>
        <Button variant="ghost" onClick={() => setStep(-1)}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 p-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-grape-soft text-grape-ink"><ScanFace className="h-8 w-8" /></span>
        <h1 className="text-xl font-extrabold">Walk in without your card</h1>
        <p className="text-[13.5px] text-muted-dark">Takes 30 seconds. Optional: your card keeps working either way.</p>
      </Card>
      <Card className="flex flex-col gap-3 p-4 text-[13px] text-muted-dark">
        <p className="font-bold text-navy">What we store and why</p>
        <p>A numeric face template, used only to open Vista Harmoni doors and turnstiles for you. It is kept on the on-site server and deleted 7 days after you move out, or right away if you turn this off.</p>
        <Checkbox checked={consent} onChange={setConsent} label="I agree to Vista Harmoni processing my face template for access" sub="Under the Personal Data Protection Act 2010. You can withdraw at any time." />
      </Card>
      <Button variant="primary" size="lg" block disabled={!consent} onClick={() => setStep(0)}>Start</Button>
    </div>
  );
}
