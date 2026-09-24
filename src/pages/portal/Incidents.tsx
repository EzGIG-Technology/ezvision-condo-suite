import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Link2, Pause, Play, RotateCcw, Send, ShieldCheck, Sparkles, UserCheck, Volume2, Search, Copy } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Alert } from '@/data/types';
import { Card, Checkbox, Chip, Empty, Field, Input, Modal, Segmented, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { CamFeed } from '@/components/vision';
import { alertStatusText, sevCam, sevLabel, sevTone, statusTone } from '@/lib/labels';
import { cn, dateLong, hhmm, hhmmss, relative, when } from '@/lib/utils';
import { toast } from '@/store/toast';
import { exportReport } from '@/lib/export';

type Tab = 'open' | 'mine' | 'closed';

const STEPS: { key: Alert['status']; label: string }[] = [
  { key: 'open', label: 'Detected' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'dispatched', label: 'Guard dispatched' },
  { key: 'on_scene', label: 'On scene' },
  { key: 'closed', label: 'Closed' },
];

function Queue({ selected }: { selected?: string }) {
  const alerts = useStore((s) => s.alerts);
  const [tab, setTab] = useState<Tab>('open');
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    let l = [...alerts].sort((a, b) => +new Date(b.at) - +new Date(a.at));
    if (tab === 'open') l = l.filter((a) => a.status !== 'closed');
    if (tab === 'mine') l = l.filter((a) => a.status !== 'closed' && (a.owner === 'Farah Hanim' || a.owner === 'Management'));
    if (tab === 'closed') l = l.filter((a) => a.status === 'closed');
    if (q) l = l.filter((a) => `${a.title} ${a.where} ${a.ref} ${a.plate ?? ''}`.toLowerCase().includes(q.toLowerCase()));
    return l;
  }, [alerts, tab, q]);
  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between"><h2 className="h2">Queue</h2><Chip tone="red">{alerts.filter((a) => a.status !== 'closed').length} open</Chip></div>
        <Segmented label="Queue filter" full value={tab} onChange={setTab} options={[{ value: 'open', label: 'Open' }, { value: 'mine', label: 'Mine' }, { value: 'closed', label: 'Closed' }]} />
        <label className="flex h-10 items-center gap-2 rounded-[10px] border border-line-strong px-3 text-muted">
          <Search className="h-4 w-4" /><span className="sr-only">Search alerts</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search title, place, plate" className="min-w-0 flex-1 bg-transparent text-[13px] text-navy outline-none" />
        </label>
      </div>
      <ul className="flex max-h-[calc(100vh-280px)] flex-col overflow-y-auto">
        {list.map((a) => (
          <li key={a.id}>
            <Link to={`/portal/incidents/${a.id}`} className={cn('flex flex-col gap-1.5 border-t border-line-soft px-4 py-3 transition-colors', selected === a.id ? 'bg-[#EEF3FF] shadow-[inset_3px_0_0_#1D4FE0]' : 'hover:bg-[#F7F9FD]')}>
              <div className="flex items-center justify-between gap-2"><Chip tone={sevTone[a.severity]}>{sevLabel[a.severity]}</Chip><span className="font-mono text-[11.5px] text-muted">{hhmm(a.at)}</span></div>
              <span className="text-[13.5px] font-bold leading-snug">{a.title}</span>
              <span className="text-xs text-muted">{a.where} · {alertStatusText(a)}</span>
            </Link>
          </li>
        ))}
        {list.length === 0 && <li><Empty title="Nothing here" body={tab === 'mine' ? 'No open alerts are assigned to you.' : 'No alerts match.'} /></li>}
      </ul>
    </Card>
  );
}

function Detail({ a }: { a: Alert }) {
  const guards = useStore((s) => s.guards);
  const faces = useStore((s) => s.unknownFaces);
  const { ackAlert, talkDown, dispatchAlert, onScene, closeAlert, reopenAlert, addAlertNote, watchFace } = useStore.getState();
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(34);
  const [editing, setEditing] = useState(false);
  const [summary, setSummary] = useState(a.summary);
  const [dispatch, setDispatch] = useState(false);
  const [guard, setGuard] = useState(guards.find((g) => g.state !== 'Off duty')?.name ?? 'Kumar Selvam');
  const [share, setShare] = useState(false);
  const [note, setNote] = useState('');
  const [outcome, setOutcome] = useState('Intruder left · no loss');
  const [police, setPolice] = useState('');
  const [addWatch, setAddWatch] = useState(!!a.unknownId);
  const face = faces.find((f) => f.id === a.unknownId);
  const navigate = useNavigate();

  useEffect(() => { setSummary(a.summary); setEditing(false); setPos(34); setPlaying(false); setAddWatch(!!a.unknownId); }, [a.id, a.summary, a.unknownId]);
  useEffect(() => {
    if (!playing) return;
    const t = window.setInterval(() => setPos((p) => (p >= 100 ? (setPlaying(false), 100) : p + 1.2)), 120);
    return () => window.clearInterval(t);
  }, [playing]);

  const stepIdx = STEPS.findIndex((s) => s.key === a.status);
  const clips = face?.sightings ?? [{ scene: a.scene, camera: a.camera, at: a.at }];
  const shareUrl = `${window.location.origin}/portal/incidents/${a.id}?share=7d`;

  const exportPack = async () => {
    await exportReport({
      title: `Evidence pack · ${a.ref}`, file: `${a.ref}-evidence-pack`,
      summary: [['Incident', a.title], ['Severity', sevLabel[a.severity]], ['Location', a.where], ['Camera', a.camera], ['Detected', `${dateLong(a.at)} ${hhmmss(a.at)}`], ['Status', alertStatusText(a)], ...(a.policeRef ? [['Police report', a.policeRef] as [string, string]] : [])],
      columns: ['Clip', 'Camera', 'Recorded', 'Link (expires in 7 days)'],
      rows: clips.map((c, i) => [`Clip ${i + 1}`, c.camera, when(c.at), `${window.location.origin}/portal/incidents/${a.id}?clip=${i + 1}`]),
      sections: [{ heading: 'Summary', lines: [summary] }, { heading: 'Timeline', lines: a.timeline.map((t) => `${hhmmss(t.at)}   ${t.text}`) }],
    }, 'PDF');
    useStore.getState().log({ who: useStore.getState().session.portal?.name ?? 'Farah Hanim', role: useStore.getState().session.portal?.role ?? 'Building Manager', action: 'Exported', record: `Evidence pack ${a.ref}` });
    toast.success('Evidence pack downloaded', `${a.ref} · PDF with ${clips.length} clip${clips.length > 1 ? 's' : ''} and the timeline`);
  };

  const doClose = () => {
    closeAlert(a.id, outcome, police || undefined);
    if (addWatch && face && face.status !== 'watchlisted') watchFace(face.id);
    toast.success(`${a.ref} closed`, addWatch && face ? 'Face added to the watchlist. Guards will be alerted on the next sighting.' : outcome);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <button type="button" onClick={() => navigate('/portal/incidents')} className="flex items-center gap-1.5 self-start text-[13px] font-bold text-muted-dark hover:text-navy xl:hidden"><ArrowLeft className="h-4 w-4" /> All alerts</button>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2"><Chip tone={sevTone[a.severity]}>{sevLabel[a.severity]}</Chip><Chip tone={statusTone[a.status]}>{alertStatusText(a)}</Chip><span className="font-mono text-xs text-muted">{a.ref}</span></div>
            <h2 className="text-[22px] font-extrabold tracking-tight">{a.title}</h2>
            <p className="sub">{a.where} · opened {hhmmss(a.at)} ({relative(a.at)}) · owner {a.owner ?? 'unassigned'}</p>
          </div>
          <div className="flex gap-2">
            <Button icon={<Link2 className="h-4 w-4" />} onClick={() => setShare(true)}>Share</Button>
            <Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={exportPack}>Evidence pack</Button>
          </div>
        </div>
        <ol aria-label="Response progress" className="grid grid-cols-5 gap-2">
          {STEPS.map((s, i) => (
            <li key={s.key} className="flex flex-col gap-1.5">
              <span className={cn('h-1.5 rounded-full', i <= stepIdx ? 'bg-brand' : 'bg-line')} />
              <span className={cn('text-[11.5px] font-bold sm:text-[12.5px]', i <= stepIdx ? 'text-navy' : 'text-muted')}>{s.label}</span>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card className="flex flex-col gap-3 p-4">
          <CamFeed scene={a.scene} tone={sevCam[a.severity]} tag={a.title} cam={a.camera} time={hhmmss(a.at)} plate={a.plate} live={a.status !== 'closed'} size="md" />
          <div className="flex items-center gap-3">
            <button type="button" aria-label={playing ? 'Pause clip' : 'Play clip'} onClick={() => { if (pos >= 100) setPos(0); setPlaying(!playing); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </button>
            <input type="range" min={0} max={100} value={Math.round(pos)} onChange={(e) => setPos(+e.target.value)} aria-label="Clip position" className="flex-1 accent-brand" />
            <span className="font-mono text-xs text-muted">{Math.floor((pos / 100) * 124 / 60)}:{String(Math.floor(((pos / 100) * 124) % 60)).padStart(2, '0')} / 2:04</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {clips.slice(0, 4).map((c, i) => (
              <button key={i} type="button" onClick={() => { setPos(0); setPlaying(true); toast.info('Playing clip', `${c.camera} · ${when(c.at)}`); }} className="flex flex-col gap-1 rounded-lg text-left hover:opacity-90">
                <CamFeed scene={c.scene} tone="red" live={false} size="xs" showBox={i === 0} />
                <span className="text-[11.5px] font-bold">{c.camera.split(' · ')[0]}</span>
                <span className="font-mono text-[11px] text-muted">{when(c.at)}</span>
              </button>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col gap-1 p-4">
          <h3 className="h2 pb-2">Response timeline</h3>
          {a.timeline.map((t, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="flex w-3 flex-col items-center"><span className={cn('mt-1 h-2.5 w-2.5 rounded-full', { detect: 'bg-danger-dot', system: 'bg-brand', action: 'bg-warn', guard: 'bg-brand', close: 'bg-teal' }[t.kind])} />{i < a.timeline.length - 1 && <span className="min-h-[24px] w-0.5 flex-1 bg-line" />}</div>
              <div className="flex flex-col pb-2.5"><span className="font-mono text-[11.5px] font-bold text-muted">{hhmmss(t.at)}</span><span className="text-[12.5px] font-semibold leading-snug">{t.text}</span></div>
            </div>
          ))}
          <form onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; addAlertNote(a.id, note.trim()); setNote(''); toast.success('Note added'); }} className="mt-2 flex gap-2">
            <label className="sr-only" htmlFor="note">Add a note</label>
            <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" className="h-9" />
            <Button type="submit" size="sm" variant="primary" aria-label="Add note" className="h-9"><Send className="h-4 w-4" /></Button>
          </form>
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-soft text-teal-dark"><Sparkles className="h-4 w-4" /></span><h3 className="h2">Incident summary</h3><Chip>AI draft · edit before export</Chip></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</Button>
            <Button size="sm" icon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => { setSummary(a.summary); toast.info('Summary regenerated'); }}>Regenerate</Button>
          </div>
        </div>
        {editing ? <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} aria-label="Incident summary" className="min-h-[140px]" /> : <p className="text-[14px] leading-relaxed text-[#1F2A4F]">{summary}</p>}
      </Card>

      {a.status !== 'closed' ? (
        <Card className="flex flex-col gap-4 p-5">
          <h3 className="h2">Respond</h3>
          <div className="flex flex-wrap gap-2">
            {a.status === 'open' && <Button variant="primary" icon={<UserCheck className="h-4 w-4" />} onClick={() => { ackAlert(a.id, 'Farah Hanim'); toast.success('Acknowledged'); }}>Acknowledge</Button>}
            <Button icon={<Volume2 className="h-4 w-4" />} onClick={() => { talkDown(a.id); toast.success('Talk-down played', 'Nearest speaker to ' + a.camera); }}>AI talk-down</Button>
            {(a.status === 'open' || a.status === 'acknowledged') && <Button icon={<ShieldCheck className="h-4 w-4" />} onClick={() => setDispatch(true)}>Dispatch guard</Button>}
            {a.status === 'dispatched' && <Button icon={<ShieldCheck className="h-4 w-4" />} onClick={() => { onScene(a.id, a.owner ?? guard); toast.success('Marked on scene'); }}>Mark guard on scene</Button>}
          </div>
          <div className="grid gap-3 border-t border-line pt-4 md:grid-cols-3">
            <Field label="Outcome">{(id) => (
              <Select id={id} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
                {['Intruder left · no loss', 'Detained, handed to police', 'Registered as visitor', 'Resident confirmed guest', 'Vehicle turned away', 'Notice issued to unit', 'False alert'].map((o) => <option key={o}>{o}</option>)}
              </Select>
            )}</Field>
            <Field label="Police report no. (optional)">{(id) => <Input id={id} value={police} onChange={(e) => setPolice(e.target.value)} placeholder="e.g. PUTRAJAYA/012345/26" />}</Field>
            <div className="flex items-end"><Button variant="primary" block onClick={doClose}>Close incident</Button></div>
          </div>
          {face && <Checkbox checked={addWatch} onChange={setAddWatch} label="Add this face to the watchlist and alert all guards on the next sighting" />}
        </Card>
      ) : (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div><p className="text-sm font-bold">Closed · {a.outcome}</p>{a.policeRef && <p className="sub">Police report {a.policeRef}</p>}</div>
          <Button icon={<RotateCcw className="h-4 w-4" />} onClick={() => { reopenAlert(a.id); toast.info(`${a.ref} reopened`); }}>Reopen</Button>
        </Card>
      )}

      <Modal open={dispatch} onClose={() => setDispatch(false)} title="Dispatch a guard" description={a.where}
        footer={<><Button onClick={() => setDispatch(false)}>Cancel</Button><Button variant="primary" onClick={() => { dispatchAlert(a.id, guard); setDispatch(false); toast.success(`${guard} dispatched`, 'Their tablet and phone are ringing now.'); }}>Dispatch</Button></>}>
        <div className="flex flex-col gap-2">
          {guards.filter((g) => g.state !== 'Off duty').map((g) => (
            <label key={g.id} className={cn('flex cursor-pointer items-center gap-3 rounded-xl border p-3', guard === g.name ? 'border-brand bg-brand-soft' : 'border-line hover:bg-ice')}>
              <input type="radio" name="guard" checked={guard === g.name} onChange={() => setGuard(g.name)} className="accent-brand" />
              <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold text-white" style={{ background: g.color }}>{g.initials}</span>
              <span className="flex flex-1 flex-col"><span className="text-[13.5px] font-bold">{g.name}</span><span className="text-xs text-muted">{g.where}</span></span>
              <Chip tone={g.state === 'Responding' ? 'red' : 'teal'}>{g.state}</Chip>
            </label>
          ))}
        </div>
      </Modal>
      <Modal open={share} onClose={() => setShare(false)} title="Share evidence" description="Anyone with the link can view this incident for 7 days. Every view is logged."
        footer={<Button onClick={() => setShare(false)}>Done</Button>}>
        <div className="flex gap-2">
          <Input readOnly value={shareUrl} aria-label="Share link" className="font-mono text-xs" />
          <Button variant="primary" icon={<Copy className="h-4 w-4" />} onClick={() => { navigator.clipboard?.writeText(shareUrl).catch(() => undefined); toast.success('Link copied', 'Expires in 7 days'); }}>Copy</Button>
        </div>
      </Modal>
    </div>
  );
}

export default function Incidents() {
  const { id } = useParams();
  const alerts = useStore((s) => s.alerts);
  const selected = alerts.find((a) => a.id === id) ?? (id ? undefined : [...alerts].sort((a, b) => +new Date(b.at) - +new Date(a.at)).find((a) => a.status !== 'closed'));
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
      <div className={cn(id ? 'hidden xl:block' : 'block')}><Queue selected={selected?.id} /></div>
      <div className={cn(!id && 'hidden xl:block')}>
        {selected ? <Detail a={selected} /> : <Card><Empty title="Alert not found" body="It may have been removed when the demo data was reset." action={<Link to="/portal/incidents" className="text-sm font-bold text-brand">Back to queue</Link>} /></Card>}
      </div>
    </div>
  );
}
