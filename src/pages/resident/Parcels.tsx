import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Copy, ExternalLink, Package, PackageCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FaceCrop } from '@/components/vision';
import { Card, Chip, Empty, Field, Modal, Segmented, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { relative, when } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

export default function ResidentParcels() {
  useDocumentTitle('Parcels');
  const unit = useStore((s) => s.resident.unit);
  const parcels = useStore((s) => s.parcels);
  const resident = useStore((s) => s.resident);
  const collectParcel = useStore((s) => s.collectParcel);
  const [tab, setTab] = useState<'waiting' | 'collected'>('waiting');
  const [open, setOpen] = useState(false);
  const [courier, setCourier] = useState('Any courier');
  const [code, setCode] = useState<string | null>(null);
  const mine = parcels.filter((p) => p.unit === unit && p.status === tab);

  const courierPasses = useStore((s) => s.courierPasses);
  const used = courierPasses.filter((p) => p.unit === unit && p.usedAt).slice(0, 3);
  const makeCode = () => {
    const c = useStore.getState().createCourierPass(unit, courier);
    setCode(c);
    toast.success('Courier pass ready', 'Valid today only.');
  };
  const link = code ? `${window.location.origin}/d/${code}` : '';

  return (
    <div className="flex flex-col gap-4">
      <Segmented full label="Parcels" value={tab} onChange={setTab} options={[{ value: 'waiting', label: `At the guardhouse · ${parcels.filter((p) => p.unit === unit && p.status === 'waiting').length}` }, { value: 'collected', label: 'Collected' }]} />
      {mine.map((p) => (
        <Card key={p.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warn-soft text-warn-ink">{tab === 'waiting' ? <Package className="h-5 w-5" /> : <PackageCheck className="h-5 w-5" />}</span>
            <div className="min-w-0 flex-1"><p className="font-bold">{p.courier}</p><p className="text-xs text-muted">{p.size} · {p.tracking}</p></div>
            {p.size === 'Chilled' && <Chip tone="blue">Chilled</Chip>}
          </div>
          {tab === 'waiting' ? (
            <div className="flex items-center justify-between rounded-xl bg-ice p-3">
              <div><p className="text-xs text-muted">Pickup code</p><p className="font-mono text-3xl font-extrabold tracking-[0.2em]">{p.code}</p></div>
              <div className="text-right text-xs text-muted"><p>{p.locker ? 'Smart locker' : 'Shelf'} <b className="font-mono text-navy">{p.locker ?? p.shelf}</b></p><p>Arrived {relative(p.loggedAt)}</p></div>
            </div>
          ) : <p className="text-xs text-muted">Collected by {p.collectedBy} · {when(p.collectedAt)}{p.proof ? ` · ${p.proof}` : ''}</p>}
          {tab === 'waiting' && p.locker && <p className="text-xs text-muted-dark">Collect any time: enter the code on the locker screen in the lobby, or open it from here when you are at the lockers.</p>}
          {tab === 'waiting' && p.locker && <Button size="sm" variant="primary" className="self-start" onClick={() => { collectParcel(p.id, resident.name); toast.success(`Locker ${p.locker} opened`, 'Take your parcel and close the door.'); }}>Open locker {p.locker}</Button>}
          {tab === 'waiting' && !p.locker && <Button size="sm" variant="ghost" className="self-start" onClick={() => toast.success('Guard asked to hold it', 'Kept at the guardhouse for up to 7 days.')}>Hold for me, I'm away</Button>}
        </Card>
      ))}
      {!mine.length && <Card><Empty icon={<Package className="h-5 w-5" />} title={tab === 'waiting' ? 'No parcels waiting' : 'No collected parcels'} body={tab === 'waiting' ? "We'll notify you the moment the guard logs one." : undefined} /></Card>}

      <Card className="flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink"><Bike className="h-5 w-5" /></span>
        <div className="flex-1"><p className="text-[13.5px] font-bold">Expecting a delivery to your door?</p><p className="text-xs text-muted">Give the rider a one-time pass so the guard lets them up.</p></div>
        <Button size="sm" variant="primary" onClick={() => { setOpen(true); setCode(null); }}>Create</Button>
      </Card>

      {used.length > 0 && (
        <Card className="flex flex-col gap-2 p-4">
          <h2 className="h2">Courier passes used</h2>
          {used.map((p) => (
            <div key={p.code} className="flex items-center gap-3 border-b border-line-soft py-2 last:border-0">
              <FaceCrop variant={p.photoVariant} className="h-11 w-11 shrink-0" rounded="rounded-xl" label={`Photo of the ${p.courier} courier`} />
              <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold">{p.courier} · {p.code}</p><p className="text-xs text-muted">Used {when(p.usedAt)} · let in by {p.usedBy} · photo stamped</p></div>
            </div>
          ))}
        </Card>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Courier pass" description="The rider shows this at the gate. Valid for one entry, today only."
        footer={code ? <Button variant="primary" onClick={() => setOpen(false)}>Done</Button> : <><Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="primary" onClick={makeCode}>Create pass</Button></>}>
        {!code ? (
          <Field label="Courier">{(id) => <Select id={id} value={courier} onChange={(e) => setCourier(e.target.value)}>{['Any courier', 'GrabFood', 'foodpanda', 'Lalamove', 'Shopee Express', 'Lazada'].map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
        ) : (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="font-mono text-2xl font-extrabold tracking-[0.15em]">{code}</p>
            <p className="text-xs text-muted">{courier} · unit {unit}</p>
            <div className="grid w-full grid-cols-2 gap-2">
              <Button icon={<Copy className="h-4 w-4" />} onClick={async () => { try { await navigator.clipboard.writeText(link); toast.success('Link copied'); } catch { toast.info('Copy this link', link); } }}>Copy link</Button>
              <Link to={`/d/${code}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-line-strong text-[13px] font-semibold hover:bg-ice"><ExternalLink className="h-4 w-4" />Preview</Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
