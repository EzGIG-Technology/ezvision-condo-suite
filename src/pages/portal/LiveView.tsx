import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Maximize2, Minimize2, Phone, ShieldCheck, Sparkles, Volume2, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Scene, Tone } from '@/data/types';
import { Card, Chip, Confirm, Segmented, Switch } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { CamFeed } from '@/components/vision';
import { cn, hhmm, hhmmss } from '@/lib/utils';
import { sevCam } from '@/lib/labels';
import { toast } from '@/store/toast';
import { useNow } from '@/lib/hooks';

type Group = 'agent' | 'gates' | 'lobbies' | 'perimeter' | 'carpark' | 'facilities';
interface Cam { id: string; name: string; group: Exclude<Group, 'agent'>; scene: Scene; tone: Tone; tag?: string; box: boolean; plate?: string; alertId?: string; boxLabel?: string }

const CAMS: Cam[] = [
  { id: 'CAM 17', name: 'Perimeter North', group: 'perimeter', scene: 'fence', tone: 'red', tag: 'Perimeter breach', box: true, alertId: 'al-1' },
  { id: 'CAM 01', name: 'Main gate lane 1 in', group: 'gates', scene: 'gate', tone: 'teal', tag: 'Resident', box: true, plate: 'VBK 2231', boxLabel: 'VBK 2231 · A-15-07' },
  { id: 'CAM 05', name: 'Side gate', group: 'gates', scene: 'sidegate', tone: 'red', tag: 'Unregistered', box: true, alertId: 'al-3' },
  { id: 'CAM 08', name: 'Tower A lobby', group: 'lobbies', scene: 'lobby', tone: 'red', tag: 'Tailgating', box: true, alertId: 'al-2' },
  { id: 'CAM 22', name: 'Carpark B2', group: 'carpark', scene: 'carpark', tone: 'amber', tag: 'Loitering', box: true, alertId: 'al-4' },
  { id: 'CAM 36', name: 'Tower B L12', group: 'lobbies', scene: 'corridor', tone: 'amber', tag: 'Rider', box: true, alertId: 'al-8' },
  { id: 'CAM 40', name: 'Pool deck', group: 'facilities', scene: 'pool', tone: 'teal', box: false },
  { id: 'CAM 44', name: 'Bin centre', group: 'facilities', scene: 'bin', tone: 'blue', tag: 'Dumping', box: true, alertId: 'al-6' },
  { id: 'CAM 02', name: 'Guardhouse', group: 'gates', scene: 'guardpost', tone: 'teal', tag: 'Guard at post', box: false },
  { id: 'CAM 03', name: 'Main gate lane 3 out', group: 'gates', scene: 'gate', tone: 'teal', box: false, plate: 'BMQ 3321' },
  { id: 'CAM 11', name: 'Tower B lobby', group: 'lobbies', scene: 'lobby', tone: 'teal', box: false },
  { id: 'CAM 14', name: 'Tower C lobby', group: 'lobbies', scene: 'lobby', tone: 'teal', box: false },
  { id: 'CAM 18', name: 'East fence', group: 'perimeter', scene: 'fence', tone: 'teal', box: false },
  { id: 'CAM 19', name: 'West fence', group: 'perimeter', scene: 'fence', tone: 'teal', box: false },
  { id: 'CAM 21', name: 'B1 ramp', group: 'carpark', scene: 'carpark', tone: 'teal', box: false },
  { id: 'CAM 23', name: 'Carpark B1 visitor', group: 'carpark', scene: 'carpark', tone: 'amber', tag: 'Overstay', box: true, alertId: 'al-7', boxLabel: 'BQR 5512 · overstay' },
  { id: 'CAM 41', name: 'Gym and hall', group: 'facilities', scene: 'corridor', tone: 'teal', box: false },
];

type Layout = '2' | 'spot' | '4';

export default function LiveView() {
  const alerts = useStore((s) => s.alerts);
  const talkDown = useStore((s) => s.talkDown);
  const addNote = useStore((s) => s.addAlertNote);
  const navigate = useNavigate();
  const now = useNow(1000);
  const [group, setGroup] = useState<Group>('agent');
  const [layout, setLayout] = useState<Layout>('spot');
  const [overlays, setOverlays] = useState(true);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [police, setPolice] = useState(false);
  const wallRef = useRef<HTMLDivElement>(null);

  const openIds = new Set(alerts.filter((a) => a.status !== 'closed').map((a) => a.id));
  const cams = useMemo(() => {
    const list = CAMS.map((c) => ({ ...c, active: !!c.alertId && openIds.has(c.alertId) }));
    if (group === 'agent') return [...list].sort((a, b) => Number(b.active) - Number(a.active));
    return list.filter((c) => c.group === group);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, alerts]);
  const spot = cams.find((c) => c.id === spotId) ?? cams[0];
  const spotAlert = alerts.find((a) => a.id === spot?.alertId && a.status !== 'closed');
  const rest = cams.filter((c) => c.id !== spot?.id);
  const tileCount = layout === 'spot' ? 8 : layout === '2' ? 4 : 16;
  const time = hhmmss(now.toISOString());

  const [full, setFull] = useState(false);
  const fullscreen = () => {
    setFull(true);
    document.documentElement.requestFullscreen?.().catch(() => { /* wall mode still covers the window */ });
  };
  const exitFull = () => {
    setFull(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  };
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && exitFull();
    const onFs = () => { if (!document.fullscreenElement) setFull(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFs);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('fullscreenchange', onFs); };
  }, [full]);

  const feed = useMemo(() => alerts
    .flatMap((a) => a.timeline.map((t) => ({ ...t, alert: a })))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at))
    .slice(0, 8), [alerts]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Camera group" value={group} onChange={(g) => { setGroup(g); setSpotId(null); }} options={[
          { value: 'agent', label: 'Agent wall' }, { value: 'gates', label: 'Gates' }, { value: 'lobbies', label: 'Lobbies' }, { value: 'perimeter', label: 'Perimeter' }, { value: 'carpark', label: 'Carpark' }, { value: 'facilities', label: 'Facilities' },
        ]} />
        <span className="flex-1" />
        <label className="flex items-center gap-2 text-[13px] font-semibold text-muted-dark"><Switch checked={overlays} onChange={setOverlays} label="AI overlays" />AI overlays</label>
        <Segmented label="Grid layout" value={layout} onChange={setLayout} options={[{ value: '2', label: '2×2' }, { value: 'spot', label: '1+8' }, { value: '4', label: '4×4' }]} />
        <Button icon={<Maximize2 className="h-4 w-4" />} onClick={fullscreen}>Full screen</Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div ref={wallRef} className={cn('flex flex-col gap-3 bg-ice', full && 'fixed inset-0 z-[70] overflow-y-auto bg-night p-4')}>
          {full && (
            <div className="flex items-center justify-between text-white">
              <span className="text-sm font-bold">Video wall · {time}</span>
              <Button size="sm" variant="night" icon={<Minimize2 className="h-4 w-4" />} onClick={exitFull}>Exit full screen</Button>
            </div>
          )}
          {layout === 'spot' && spot && (
            <div className="relative">
              <CamFeed scene={spot.scene} tone={spot.tone} tag={spot.tag ? `${group === 'agent' ? 'Agent spotlight · ' : ''}${spot.tag}` : undefined} cam={`${spot.id} · ${spot.name}`} time={time} showBox={overlays && spot.box} plate={spot.plate} boxLabel={spot.boxLabel} size="lg" className="rounded-2xl" />
              {spotAlert && overlays && (
                <div className="absolute bottom-12 left-3 right-3 hidden gap-2.5 rounded-xl bg-[rgba(8,13,33,.86)] p-3 text-white sm:flex sm:max-w-md">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-bright" />
                  <p className="text-[13px] leading-relaxed">{spotAlert.summary}</p>
                </div>
              )}
            </div>
          )}
          <div className={cn('grid gap-3', layout === '2' ? 'grid-cols-1 sm:grid-cols-2' : layout === '4' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4')}>
            {(layout === 'spot' ? rest : cams).slice(0, tileCount).map((c) => (
              <button key={c.id} type="button" onClick={() => { setSpotId(c.id); setLayout('spot'); }} aria-label={`Spotlight ${c.id} ${c.name}`} className={cn('rounded-xl text-left ring-offset-2 transition hover:ring-2 hover:ring-brand', spot?.id === c.id && layout !== 'spot' && 'ring-2 ring-brand')}>
                <CamFeed scene={c.scene} tone={c.tone} tag={overlays ? c.tag : undefined} cam={`${c.id} · ${c.name}`} time={time.slice(0, 5)} showBox={overlays && c.box} plate={c.plate} boxLabel={c.boxLabel} live={false} size={layout === '4' ? 'xs' : 'sm'} />
              </button>
            ))}
          </div>
          {cams.length === 0 && <Card className="p-8 text-center text-sm text-muted">No cameras in this group.</Card>}
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-2xl bg-navy p-4 text-white">
            <div className="flex items-center justify-between"><span className="text-sm font-extrabold">Respond on {spot?.id}</span>{spotAlert ? <Chip tone="red" dark>{spotAlert.ref}</Chip> : <Chip tone="teal" dark>Quiet</Chip>}</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Volume2, label: 'AI talk-down', on: () => { if (spotAlert) talkDown(spotAlert.id); toast.success('Talk-down played', `Speaker nearest ${spot?.id}`); } },
                { icon: ShieldCheck, label: 'Dispatch guard', on: () => spotAlert ? navigate(`/portal/incidents/${spotAlert.id}`) : toast.info('No alert on this camera', 'Open a camera with an alert to dispatch.') },
                { icon: Zap, label: 'Floodlight + siren', on: () => { if (spotAlert) addNote(spotAlert.id, 'Floodlight and siren triggered for 30 s'); toast.warning('Floodlight and siren on', 'Runs for 30 seconds'); } },
                { icon: Phone, label: 'Call police (999)', on: () => setPolice(true) },
              ].map((b) => (
                <button key={b.label} type="button" onClick={b.on} className="flex h-[74px] flex-col items-center justify-center gap-1.5 rounded-xl border border-[#2C3F80] bg-[#13245C] text-xs font-bold hover:bg-[#1a2f72]">
                  <b.icon className="h-5 w-5" />{b.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1 rounded-xl bg-[#13245C] p-3">
              <span className="text-[11px] font-bold tracking-[0.1em] text-brand-light">TALK-DOWN PREVIEW</span>
              <span className="text-[12.5px] leading-relaxed text-[#E4EAFA]">"You near {spot?.name.toLowerCase()}: this area is monitored and you are being recorded. Security is on the way."</span>
            </div>
          </div>
          <Card className="flex flex-col px-4 pb-2 pt-4">
            <div className="flex items-center justify-between pb-2.5"><h2 className="h2">Agent feed</h2><Chip tone="teal">Live</Chip></div>
            {feed.map((f, i) => (
              <Link key={i} to={`/portal/incidents/${f.alert.id}`} className="flex gap-2.5 border-t border-line-soft py-2.5 hover:bg-[#F7F9FD]">
                <span className="w-10 shrink-0 pt-0.5 font-mono text-[11.5px] font-bold text-muted">{hhmm(f.at)}</span>
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: { red: '#E5484D', amber: '#F59E0B', blue: '#1D4FE0', teal: '#14A38F' }[sevCam[f.alert.severity]] }} />
                <span className="flex flex-col gap-0.5"><span className="text-[13px] font-bold">{f.alert.title}</span><span className="text-xs leading-snug text-muted">{f.text}</span></span>
              </Link>
            ))}
          </Card>
        </div>
      </div>
      <Confirm open={police} onClose={() => setPolice(false)} title="Call the police?" body={<>This logs the call against {spotAlert?.ref ?? 'the site'} and dials 999 from the guardhouse line. Only call for a crime in progress or a threat to safety.</>} confirmLabel="Call 999" danger
        onConfirm={() => { if (spotAlert) addNote(spotAlert.id, 'Police called on 999 from the guardhouse line'); toast.warning('Calling 999', 'The call is logged against the incident.'); }} />
    </div>
  );
}
