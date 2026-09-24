import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarPlus, Car, Copy, ExternalLink, MessageCircle, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FaceCrop, QRCode } from '@/components/vision';
import { Card, Chip, Confirm, Empty, Plate } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { visitStatusLabel, visitStatusTone, visitTypeLabel } from '@/lib/labels';
import { dateLong, hhmm, passCode } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

export default function ResidentPass() {
  useDocumentTitle('Visitor pass');
  const { id = '' } = useParams();
  const visits = useStore((s) => s.visits);
  const { cancelVisit, extendVisit } = useStore.getState();
  const navigate = useNavigate();
  const [cancel, setCancel] = useState(false);
  const v = visits.find((x) => x.id === id);

  if (!v) return <Empty title="Pass not found" body="It may have been removed." action={<Link to="/app/visitors" className="text-sm font-bold text-brand">Your visitors</Link>} />;

  const link = `${window.location.origin}/v/${v.id}`;
  const text = `Hi ${v.name.split(' ')[0]}, here is your pass for Vista Harmoni Residences, unit ${v.unit}. Show the QR at the gate or use PIN ${passCode(v.id)}: ${link}`;
  const active = v.status === 'expected' || v.status === 'on_site';

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast.success('Link copied'); } catch { toast.info('Copy this link', link); }
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Visitor pass', text, url: link }); } catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-4 p-5 text-center">
        <div className="flex items-center gap-3 self-stretch text-left">
          <FaceCrop variant={v.faceVariant} className="h-12 w-12" rounded="rounded-full" />
          <div className="min-w-0 flex-1"><p className="font-extrabold">{v.name}{v.people > 1 ? ` +${v.people - 1}` : ''}</p><p className="text-xs text-muted">{visitTypeLabel[v.type]} · {v.phone}</p></div>
          <Chip tone={visitStatusTone[v.status]}>{visitStatusLabel[v.status]}</Chip>
        </div>
        <div className={active ? '' : 'opacity-30 grayscale'}><QRCode value={v.id} size={196} /></div>
        <div><p className="text-xs font-bold uppercase tracking-wider text-muted">Gate PIN</p><p className="font-mono text-3xl font-extrabold tracking-[0.25em]">{passCode(v.id)}</p></div>
        <div className="grid w-full grid-cols-2 gap-3 rounded-xl bg-ice p-3 text-left text-[13px]">
          <div><p className="text-xs text-muted">From</p><p className="font-semibold">{dateLong(v.validFrom)}, {hhmm(v.validFrom)}</p></div>
          <div><p className="text-xs text-muted">Until</p><p className="font-semibold">{dateLong(v.validTo)}, {hhmm(v.validTo)}</p></div>
          {v.plate && <div className="col-span-2 flex items-center gap-2"><Car className="h-4 w-4 text-muted" /><Plate>{v.plate}</Plate><span className="text-xs text-muted">Barrier opens automatically</span></div>}
          {v.recurringDays && <div className="col-span-2 text-xs text-muted-dark">Repeats every {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter((_, i) => v.recurringDays![i]).join(', ')}</div>}
          {v.checkIn && <div className="col-span-2 text-xs text-teal-dark">Checked in {hhmm(v.checkIn)} · {v.entry}{v.checkOut ? ` · left ${hhmm(v.checkOut)}` : ''}</div>}
        </div>
        <Chip tone={v.selfie ? 'teal' : 'grey'}>{v.selfie ? 'Selfie added · lobby face entry on' : 'No selfie yet'}</Chip>
      </Card>

      {active && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="primary" size="lg" icon={<MessageCircle className="h-4 w-4" />} onClick={share}>Send pass</Button>
          <Button size="lg" icon={<Copy className="h-4 w-4" />} onClick={copy}>Copy link</Button>
          <Button size="lg" icon={<CalendarPlus className="h-4 w-4" />} onClick={() => { extendVisit(v.id, 2); toast.success('Extended by 2 hours', `New end ${hhmm(new Date(+new Date(v.validTo) + 7200_000).toISOString())}`); }}>Extend 2 h</Button>
          <Button size="lg" icon={<Trash2 className="h-4 w-4" />} onClick={() => setCancel(true)} disabled={v.status === 'on_site'}>Cancel pass</Button>
        </div>
      )}
      <Link to={`/v/${v.id}`} className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-brand"><ExternalLink className="h-4 w-4" />See what your visitor sees</Link>

      <Confirm open={cancel} onClose={() => setCancel(false)} danger confirmLabel="Cancel pass" title="Cancel this pass?" body={`${v.name} will not be able to enter with it. We'll let them know by WhatsApp.`}
        onConfirm={() => { cancelVisit(v.id); toast.info('Pass cancelled'); navigate('/app/visitors'); }} />
    </div>
  );
}
