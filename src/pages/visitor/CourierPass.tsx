import { useParams } from 'react-router-dom';
import { Bike, Clock, MapPin, XCircle } from 'lucide-react';
import { QRCode } from '@/components/vision';
import { useDocumentTitle } from '@/lib/hooks';
import { hhmm } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { PublicShell } from './VisitorPass';

/** Code format: unit without dashes + 4 characters, e.g. A15074K2P → unit A-15-07. */
const parse = (code: string) => {
  const m = /^([ABC])(\d{2})(\d{2})([A-Z0-9]{4})$/i.exec(code);
  return m ? `${m[1].toUpperCase()}-${m[2]}-${m[3]}` : null;
};

export default function CourierPass() {
  useDocumentTitle('Courier pass');
  const { code = '' } = useParams();
  const pass = useStore((s) => s.courierPasses.find((p) => p.code === code.toUpperCase()));
  const unit = pass ? parse(code) : null;

  return (
    <PublicShell>
      {!unit ? (
        <div className="card flex flex-col items-center gap-3 p-8 text-center"><XCircle className="h-12 w-12 text-danger" /><h1 className="text-xl font-extrabold">Invalid courier code</h1><p className="text-sm text-muted-dark">Ask the customer to create a new courier pass in their app.</p></div>
      ) : (
        <>
          <div className="card flex flex-col items-center gap-4 p-5 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warn-soft text-warn-ink"><Bike className="h-6 w-6" /></span>
            <h1 className="text-xl font-extrabold">Delivery to unit {unit}</h1>
            <QRCode value={code} size={200} />
            <p className="font-mono text-2xl font-extrabold tracking-[0.15em]">{code.toUpperCase()}</p>
            {pass?.usedAt
              ? <p className="rounded-xl bg-warn-soft px-3 py-2 text-[13px] font-semibold text-warn-ink">Used at {hhmm(pass.usedAt)}. This pass worked once and cannot be used again.</p>
              : <p className="flex items-center gap-1.5 text-[13px] text-muted-dark"><Clock className="h-4 w-4" />One entry · valid until 23:59 today</p>}
          </div>
          <div className="card flex flex-col gap-2 p-4 text-[13.5px]">
            <h2 className="h2">Instructions for the rider</h2>
            <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />Stop at the guardhouse and show this QR. The guard takes a photo of you, which the resident can see.</p>
            <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />Take the Tower {unit[0]} lift to level {Number(unit.split('-')[1])}. Leave within 20 minutes.</p>
            <p className="text-xs text-muted">Cameras track the route. Going to other floors triggers an alert.</p>
          </div>
        </>
      )}
    </PublicShell>
  );
}
