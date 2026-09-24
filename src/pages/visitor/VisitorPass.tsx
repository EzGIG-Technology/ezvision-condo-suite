import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Camera, Car, CheckCircle2, Clock, MapPin, Navigation, ShieldCheck, XCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Logo, QRCode } from '@/components/vision';
import { Chip, Modal, Plate } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { SITE } from '@/data/seed';
import { dateLong, hhmm, passCode } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#E9EEF7] sm:py-6">
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-ice sm:min-h-[calc(100vh-48px)] sm:rounded-[32px] sm:shadow-pop">
        <header className="flex items-center justify-between border-b border-line bg-white px-5 py-3 sm:rounded-t-[32px]"><Logo size={26} /><span className="text-[11px] font-bold uppercase tracking-wider text-muted">{SITE.short}</span></header>
        <main className="flex flex-1 flex-col gap-4 p-4">{children}</main>
        <footer className="px-5 pb-5 text-center text-[11px] text-muted">Vista Harmoni Residences, Jalan Harmoni 3, 47810 Petaling Jaya · Guardhouse 03-7800 1200</footer>
      </div>
    </div>
  );
}

export default function VisitorPass() {
  useDocumentTitle('Your visitor pass');
  const { id = '' } = useParams();
  const visits = useStore((s) => s.visits);
  const [privacy, setPrivacy] = useState(false);
  const v = visits.find((x) => x.id === id);

  if (!v) {
    return (
      <PublicShell>
        <div className="card flex flex-col items-center gap-3 p-8 text-center"><XCircle className="h-12 w-12 text-danger" /><h1 className="text-xl font-extrabold">Pass not found</h1><p className="text-sm text-muted-dark">The link may be wrong, or the pass was removed. Ask your host to send it again.</p></div>
      </PublicShell>
    );
  }

  const expired = v.status === 'expected' && Date.now() > +new Date(v.validTo);
  const blocked = v.status === 'cancelled' || v.status === 'denied' || expired;
  const first = v.name.split(' ')[0];

  return (
    <PublicShell>
      <div className="card flex flex-col items-center gap-4 p-5 text-center">
        <p className="text-sm text-muted-dark">Hi {first}, you're visiting</p>
        <p className="-mt-3 text-xl font-extrabold">Unit {v.unit} · {v.host}</p>
        {v.status === 'on_site' && <Chip tone="teal"><CheckCircle2 className="h-3.5 w-3.5" />Checked in at {hhmm(v.checkIn)}</Chip>}
        {v.status === 'left' && <Chip tone="grey">Visit ended {hhmm(v.checkOut)}</Chip>}
        {blocked ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl bg-danger-soft p-5 text-danger-ink"><XCircle className="h-10 w-10" /><p className="font-bold">{v.status === 'cancelled' ? 'This pass was cancelled by your host' : expired ? 'This pass has expired' : 'Entry not allowed'}</p><p className="text-xs">Please contact {v.host} for a new pass.</p></div>
        ) : (
          <>
            <QRCode value={v.id} size={220} />
            <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Or tell the guard this PIN</p><p className="font-mono text-4xl font-extrabold tracking-[0.25em]">{passCode(v.id)}</p></div>
          </>
        )}
        <div className="flex items-center gap-2 text-[13px] text-muted-dark"><Clock className="h-4 w-4" />{dateLong(v.validFrom)}, {hhmm(v.validFrom)} to {hhmm(v.validTo)}{new Date(v.validTo).toDateString() !== new Date(v.validFrom).toDateString() ? ` (${dateLong(v.validTo)})` : ''}</div>
      </div>

      {!blocked && v.status === 'expected' && (
        <div className="card flex flex-col gap-3 p-4">
          <h2 className="h2">When you arrive</h2>
          {v.plate ? (
            <p className="flex items-start gap-2 text-[13.5px]"><Car className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span>Drive to <b>lane 1</b> at the main gate. The barrier opens by itself for <Plate>{v.plate}</Plate>. Park in the visitor bays at <b>basement B1</b>.</span></p>
          ) : (
            <p className="flex items-start gap-2 text-[13.5px]"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" /><span>Walk in through the pedestrian gate next to the guardhouse and show this QR.</span></p>
          )}
          {v.selfie ? (
            <p className="flex items-start gap-2 text-[13.5px]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" /><span>Your selfie is on file. The Tower {v.unit[0]} lobby door will open when you walk up.</span></p>
          ) : (
            <Link to={`/v/${v.id}/selfie`} className="flex items-center gap-3 rounded-xl bg-brand-soft p-3 text-brand-ink">
              <Camera className="h-5 w-5" /><span className="flex-1 text-[13.5px]"><b>Skip the lobby queue.</b> Add a selfie so the door opens for you.</span>
            </Link>
          )}
          <a href="https://maps.google.com/?q=Vista+Harmoni+Residences" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-white text-[14px] font-semibold hover:bg-ice"><Navigation className="h-4 w-4" />Directions</a>
        </div>
      )}

      <Button variant="ghost" size="sm" className="self-center" onClick={() => setPrivacy(true)}>How we use your data</Button>
      <Modal open={privacy} onClose={() => setPrivacy(false)} title="Your data" size="sm" footer={<Button variant="primary" onClick={() => setPrivacy(false)}>OK</Button>}>
        <div className="flex flex-col gap-2 text-[13.5px] text-muted-dark">
          <p>Your name, number and plate are used only to let you in and are kept in the visitor log for 90 days.</p>
          <p>If you add a selfie, it is used only for lobby doors during this visit and deleted 24 hours after the pass ends.</p>
          <p>Cameras with AI analytics operate on site. Questions: dpo@vistaharmoni.my</p>
        </div>
      </Modal>
    </PublicShell>
  );
}
