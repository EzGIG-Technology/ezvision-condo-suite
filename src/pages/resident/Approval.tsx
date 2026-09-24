import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { Check, CheckCircle2, Clock, Phone, ShieldCheck, X, XCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FaceCrop } from '@/components/vision';
import { Checkbox, Plate } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { relative } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

export default function ResidentApproval() {
  useDocumentTitle('Visitor at the gate');
  const { id = '' } = useParams();
  const session = useStore((s) => s.session.resident);
  const approvals = useStore((s) => s.approvals);
  const respond = useStore((s) => s.respondApproval);
  const navigate = useNavigate();
  const [regular, setRegular] = useState(false);
  const a = approvals.find((x) => x.id === id);
  const rider = !!a && / delivery to your door$/.test(a.purpose);

  if (!session) return <Navigate to="/app/login" replace />;

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#E9EEF7] sm:py-6">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-navy text-white sm:min-h-[calc(100vh-48px)] sm:rounded-[32px] sm:shadow-pop">
        <div className="flex items-center justify-between px-4 py-3"><span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-light">Main gate · guardhouse</span><Link to="/app" aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10"><X className="h-5 w-5" /></Link></div>
        {children}
      </div>
    </div>
  );

  if (!a) return shell(<div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center"><p className="text-lg font-bold">This request has expired</p><Link to="/app" className="font-bold text-brand-light">Back to home</Link></div>);

  if (a.status !== 'waiting') {
    const ok = a.status === 'approved';
    return shell(
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        {ok ? <CheckCircle2 className="h-16 w-16 text-teal-bright" /> : <XCircle className="h-16 w-16 text-[#FF8A8E]" />}
        <p className="text-2xl font-extrabold">{ok ? `${a.visitorName} can come up` : 'Entry declined'}</p>
        <p className="text-sm text-[#C9D3EE]">{ok ? 'The guard has been told. We will let you know when they arrive at the lobby.' : 'The guard will let them know politely.'} {a.respondedBy && a.respondedBy !== session.name ? `Answered by ${a.respondedBy}.` : ''}</p>
        <Button variant="white" size="lg" onClick={() => navigate('/app')}>Done</Button>
      </div>,
    );
  }

  const decide = (approve: boolean) => {
    respond(a.id, approve, session.name, approve && regular);
    if (approve) toast.success(`${a.visitorName} approved`, regular ? 'Saved as a regular visitor. Tue and Thu, weekly.' : 'Valid until 23:30 tonight.');
    else toast.info('Declined', 'The guard will not let them in.');
  };

  return shell(
    <div className="flex flex-1 flex-col gap-5 px-6 pb-8">
      <div className="flex flex-col items-center gap-3 pt-2 text-center">
        <span className="flex items-center gap-1.5 rounded-full bg-warn/20 px-3 py-1 text-xs font-bold text-[#FCC56B]"><Clock className="h-3.5 w-3.5" />Waiting · {relative(a.createdAt)}</span>
        <FaceCrop variant={a.faceVariant} className="h-40 w-40" rounded="rounded-3xl" label={`Photo of ${a.visitorName} at the gate`} />
        <h1 className="text-2xl font-extrabold">{a.visitorName}</h1>
        <p className="text-[15px] text-[#C9D3EE]">says they are here for <b className="text-white">{a.purpose.toLowerCase()}</b></p>
      </div>
      <div className="flex flex-col gap-2 rounded-2xl bg-white/5 p-4 text-[13.5px]">
        {rider
          ? <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-bright" />Logged by the guard · phone ending {a.idLast4}</p>
          : <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-bright" />IC checked by the guard · ending {a.idLast4}</p>}
        <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-bright" />Not on the building watchlist</p>
        {a.plate && <p className="flex items-center gap-2">Car <Plate light>{a.plate}</Plate></p>}
        <p className="text-xs text-muted-light">{rider ? `Riders normally stay at the lobby drop-off. If you let them up, their pass lasts ${a.until}.` : `If approved, the pass lasts until ${a.until}.`}</p>
      </div>
      {!rider && <Checkbox dark checked={regular} onChange={setRegular} label="Save as a regular visitor" sub="Next time they are let in without asking you (Tue and Thu)." />}
      <div className="mt-auto grid grid-cols-2 gap-3">
        <Button size="xl" variant="danger" icon={<X className="h-5 w-5" />} onClick={() => decide(false)}>Decline</Button>
        <Button size="xl" variant="teal" icon={<Check className="h-5 w-5" />} onClick={() => decide(true)}>Let in</Button>
      </div>
      <Button variant="ghost" className="text-white hover:bg-white/10" icon={<Phone className="h-4 w-4" />} onClick={() => toast.info('Calling the guardhouse', '03-7800 1200')}>Call the guard</Button>
    </div>,
  );
}
