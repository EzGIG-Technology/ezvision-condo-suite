import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Footprints, MapPin, Phone, ShieldAlert, Siren, UserPlus, Volume2, XCircle } from 'lucide-react';
import { useCurrentGuard, useStore } from '@/store/useStore';
import { CamFeed, FaceCrop } from '@/components/vision';
import { Chip, Empty, Modal, Plate, Segmented, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { sevCam, sevTone, statusLabel, statusTone } from '@/lib/labels';
import { cn, hhmm, hhmmss, relative } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

const OUTCOMES = ['Resolved on scene', 'Person left after talk-down', 'Registered as visitor', 'Resident confirmed guest', 'Escorted out', 'Police called', 'False alert'];

export default function GuardAlerts() {
  const { id } = useParams();
  return id ? <Takeover id={id} /> : <AlertList />;
}

function AlertList() {
  useDocumentTitle('Alerts');
  const alerts = useStore((s) => s.alerts);
  const [f, setF] = useState<'open' | 'closed'>('open');
  const list = alerts.filter((a) => (f === 'open' ? a.status !== 'closed' : a.status === 'closed'));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Alerts</h1>
        <Segmented dark label="Alert filter" value={f} onChange={setF} options={[{ value: 'open', label: `Open · ${alerts.filter((a) => a.status !== 'closed').length}` }, { value: 'closed', label: 'Closed' }]} />
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {list.map((a) => (
          <li key={a.id}>
            <Link to={`/guard/alerts/${a.id}`} className="flex gap-3 rounded-2xl border border-night-line bg-night-panel p-3 hover:border-navy-500">
              <CamFeed scene={a.scene} tone={sevCam[a.severity]} size="xs" className="w-32 shrink-0 rounded-xl" showBox live={false} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap gap-1.5"><Chip dark tone={sevTone[a.severity]}>{a.severity}</Chip><Chip dark tone={statusTone[a.status]}>{a.status === 'closed' ? a.outcome ?? 'Closed' : statusLabel[a.status]}</Chip></div>
                <p className="text-[14px] font-bold leading-snug">{a.title}</p>
                <p className="text-xs text-muted-light">{a.where} · {relative(a.at)}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {!list.length && <Empty dark icon={<CheckCircle2 className="h-5 w-5" />} title={f === 'open' ? 'No open alerts' : 'Nothing closed yet'} body={f === 'open' ? 'You will hear a chime and see a red banner when something needs you.' : undefined} />}
    </div>
  );
}

function Takeover({ id }: { id: string }) {
  const alerts = useStore((s) => s.alerts);
  const guard = useCurrentGuard();
  const navigate = useNavigate();
  const { ackAlert, talkDown, dispatchAlert, onScene, closeAlert, addAlertNote } = useStore.getState();
  const a = alerts.find((x) => x.id === id);
  useDocumentTitle(a?.title ?? 'Alert');
  const [close, setClose] = useState(false);
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [note, setNote] = useState('');
  const [police, setPolice] = useState(false);

  if (!a) return <Empty dark title="Alert not found" body="It may have been closed on another device." action={<Link to="/guard/alerts" className="font-bold text-brand-light">Back to alerts</Link>} />;
  const mine = a.owner === guard.name;
  const closed = a.status === 'closed';

  const doClose = (o: string) => {
    if (note.trim()) addAlertNote(a.id, `${guard.name}: ${note.trim()}`);
    closeAlert(a.id, o, undefined, guard.name);
    toast.success('Alert closed', o);
    setClose(false);
    navigate('/guard/alerts');
  };

  return (
    <div className="flex flex-col gap-4">
      <Link to="/guard/alerts" className="flex items-center gap-1.5 text-[13px] font-semibold text-muted-light hover:text-white"><ArrowLeft className="h-4 w-4" />All alerts</Link>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex flex-col gap-4">
          <CamFeed scene={a.scene} tone={sevCam[a.severity]} tag={a.title} cam={a.camera} time={hhmmss(a.at)} plate={a.plate} size="lg" className="rounded-2xl" live={!closed} />
          <div className="flex flex-wrap items-center gap-2">
            <Chip dark tone={sevTone[a.severity]}>{a.severity}</Chip>
            <Chip dark tone={statusTone[a.status]}>{closed ? a.outcome ?? 'Closed' : statusLabel[a.status]}</Chip>
            <span className="font-mono text-xs text-muted-light">{a.ref}</span>
          </div>
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{a.title}</h1>
          <p className="flex items-center gap-1.5 text-sm text-[#C9D3EE]"><MapPin className="h-4 w-4" />{a.where} · {relative(a.at)}</p>
          <div className="rounded-2xl bg-night-panel p-4 text-[14px] leading-relaxed text-[#C9D3EE]"><span className="mb-1 block text-xs font-bold uppercase tracking-wider text-brand-light">What the camera saw</span>{a.summary}</div>
          {(a.faceVariant || a.plate) && (
            <div className="flex items-center gap-3 rounded-2xl bg-night-panel p-3">
              {a.faceVariant && <FaceCrop variant={a.faceVariant} className="h-16 w-16" />}
              {a.plate && <Plate light>{a.plate}</Plate>}
              <p className="text-[13px] text-muted-light">{a.faceVariant ? 'No match against residents, visitors or contractors.' : 'Plate not registered to any unit.'}</p>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          {!closed && (
            <div className="flex flex-col gap-2.5 rounded-2xl border border-night-line bg-night-panel p-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-light">Respond</h2>
              {a.status === 'open' && <Button size="xl" variant="nightPrimary" block icon={<ShieldAlert className="h-5 w-5" />} onClick={() => { ackAlert(a.id, guard.name); toast.success('Acknowledged', 'The manager can see you have it.'); }}>I've got this</Button>}
              <Button size="xl" variant="night" block icon={<Volume2 className="h-5 w-5" />} onClick={() => { talkDown(a.id); toast.success('Talk-down playing', `"You are in a private area. Security has been alerted."`); }}>{a.talkDown ? 'Play talk-down again' : 'AI talk-down'}</Button>
              {(a.status === 'open' || a.status === 'acknowledged' || (a.status === 'dispatched' && !mine)) && (
                <Button size="xl" variant="amber" block icon={<Footprints className="h-5 w-5" />} onClick={() => { dispatchAlert(a.id, guard.name); toast.info('On your way', 'Guardhouse cover requested from the patrol guard.'); }}>I'm going there</Button>
              )}
              {a.status === 'dispatched' && mine && <Button size="xl" variant="teal" block icon={<MapPin className="h-5 w-5" />} onClick={() => { onScene(a.id, guard.name); toast.success('Marked on scene'); }}>I'm on scene</Button>}
              <div className="grid grid-cols-2 gap-2">
                <Button size="lg" variant="night" icon={<Phone className="h-4 w-4" />} onClick={() => toast.info(a.unit ? `Calling ${a.unit}` : 'Calling the manager', a.unit ? 'Intercom ringing…' : 'Farah Hanim · on-call')}>Call</Button>
                <Button size="lg" variant="night" icon={<UserPlus className="h-4 w-4" />} onClick={() => navigate('/guard/walk-in', { state: { alertId: a.id, faceVariant: a.faceVariant } })}>Register</Button>
              </div>
              <Button size="lg" variant="danger" block icon={<Siren className="h-4 w-4" />} onClick={() => setPolice(true)}>Call police (999)</Button>
              <div className="mt-1 grid grid-cols-2 gap-2 border-t border-night-line pt-3">
                <Button size="lg" variant="night" icon={<XCircle className="h-4 w-4" />} onClick={() => doClose('False alert')}>False alert</Button>
                <Button size="lg" variant="white" icon={<CheckCircle2 className="h-4 w-4" />} onClick={() => setClose(true)}>Close</Button>
              </div>
            </div>
          )}
          {closed && <div className="rounded-2xl bg-teal/15 p-4 text-[14px] text-[#5EEAD4]"><CheckCircle2 className="mr-1.5 inline h-4 w-4" />Closed: {a.outcome}</div>}
          <div className="rounded-2xl border border-night-line bg-night-panel p-4">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-muted-light">Timeline</h2>
            <ol className="flex flex-col gap-3">
              {a.timeline.map((t, i) => (
                <li key={i} className="flex gap-3 text-[13px]"><span className="w-12 shrink-0 font-mono text-xs text-muted-light">{hhmm(t.at)}</span><span className={cn(t.kind === 'close' && 'text-[#5EEAD4]', t.kind === 'guard' && 'text-brand-light')}>{t.text}</span></li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <Modal dark open={close} onClose={() => setClose(false)} title="Close alert" description="Every alert needs an outcome for the report."
        footer={<><Button variant="night" onClick={() => setClose(false)}>Cancel</Button><Button variant="nightPrimary" onClick={() => doClose(outcome)}>Close alert</Button></>}>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Outcome<Select dark value={outcome} onChange={(e) => setOutcome(e.target.value)}>{OUTCOMES.map((o) => <option key={o}>{o}</option>)}</Select></label>
          <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Note (optional)<Textarea dark value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you found" /></label>
        </div>
      </Modal>

      <Modal dark open={police} onClose={() => setPolice(false)} title="Call the police?" description="The manager and the JMB chairman are notified at the same time."
        footer={<><Button variant="night" onClick={() => setPolice(false)}>Cancel</Button><Button variant="danger" icon={<Siren className="h-4 w-4" />} onClick={() => { addAlertNote(a.id, `${guard.name} called police (999)`); toast.warning('Calling 999', 'Evidence pack prepared for the officers.'); setPolice(false); }}>Call 999</Button></>}>
        <p className="text-[14px] text-[#C9D3EE]">Only call if someone is in danger or a crime is in progress. The clip and snapshots are ready to hand over.</p>
      </Modal>
    </div>
  );
}
