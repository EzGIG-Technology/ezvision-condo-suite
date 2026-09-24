import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Car, ClipboardPen, Clock, LogIn, LogOut, MessageCircle, Package, Phone, Route, ScanLine, UserPlus } from 'lucide-react';
import { useCurrentGuard, useStore } from '@/store/useStore';
import { CamFeed, FaceCrop } from '@/components/vision';
import { Chip, Modal, Plate, Segmented, Select } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { sevTone, statusLabel, visitTypeLabel } from '@/lib/labels';
import { cn, hhmm, relative } from '@/lib/utils';
import { useDocumentTitle, useNow } from '@/lib/hooks';
import { toast } from '@/store/toast';
import type { Visit } from '@/data/types';

const TILES = [
  { to: '/guard/walk-in', label: 'Walk-in visitor', sub: 'Scan ID, check face, ask resident', icon: UserPlus, tone: 'bg-brand' },
  { to: '/guard/verify', label: 'Verify a pass', sub: 'QR, PIN or name', icon: ScanLine, tone: 'bg-teal' },
  { to: '/guard/parcels', label: 'Parcel', sub: 'Log or hand over', icon: Package, tone: 'bg-[#B45309]' },
  { to: '/guard/messages', label: 'Messages', sub: 'From residents', icon: MessageCircle, tone: 'bg-teal-dark' },
  { to: '/guard/patrol', label: 'Patrol', sub: 'Next checkpoint', icon: Route, tone: 'bg-grape-ink' },
  { to: '/guard/report', label: 'Report', sub: 'Incident or handover', icon: ClipboardPen, tone: 'bg-navy-500' },
];

export default function GuardHome() {
  useDocumentTitle('Gate console');
  const visits = useStore((s) => s.visits);
  const alerts = useStore((s) => s.alerts);
  const approvals = useStore((s) => s.approvals);
  const checkpoints = useStore((s) => s.checkpoints);
  const guard = useCurrentGuard();
  const { checkInVisit, checkOutVisit } = useStore.getState();
  const navigate = useNavigate();
  const now = useNow(30000);
  const [tab, setTab] = useState<'expected' | 'on_site'>('expected');
  const [checkIn, setCheckIn] = useState<Visit | null>(null);
  const [gate, setGate] = useState('Main gate · lane 1');

  const open = alerts.filter((a) => a.status !== 'closed');
  const expected = visits.filter((v) => v.status === 'expected' && new Date(v.validFrom).toDateString() === now.toDateString()).sort((a, b) => +new Date(a.validFrom) - +new Date(b.validFrom));
  const onSite = visits.filter((v) => v.status === 'on_site');
  const waiting = approvals.filter((a) => a.status === 'waiting');
  const next = checkpoints.find((c) => c.status === 'next');
  const list = tab === 'expected' ? expected : onSite;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-light">Good {now.getHours() < 12 ? 'morning' : now.getHours() < 19 ? 'afternoon' : 'evening'}, {guard.name.split(' ')[0]}</p>
          <h1 className="text-2xl font-extrabold tracking-tight">Gate console</h1>
        </div>
        <div className="flex gap-2 text-[13px]">
          <Chip dark tone={open.length ? 'red' : 'teal'} dot>{open.length} open alerts</Chip>
          <Chip dark tone="blue">{onSite.length} visitors on site</Chip>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TILES.map((t) => (
          <Link key={t.to} to={t.to} className="flex flex-col gap-3 rounded-2xl border border-night-line bg-night-panel p-4 transition-colors hover:border-navy-500 hover:bg-navy-700">
            <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl text-white', t.tone)}><t.icon className="h-5 w-5" /></span>
            <span><span className="block text-[15px] font-bold">{t.label}</span><span className="text-xs text-muted-light">{t.label === 'Patrol' && next ? `Next: ${next.name}` : t.sub}</span></span>
          </Link>
        ))}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col gap-4 rounded-2xl border border-night-line bg-night-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-extrabold">Visitors today</h2>
            <Segmented dark label="Visitor list" value={tab} onChange={setTab} options={[{ value: 'expected', label: `Expected · ${expected.length}` }, { value: 'on_site', label: `On site · ${onSite.length}` }]} />
          </div>
          <ul className="flex flex-col gap-2">
            {list.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-night-field p-3">
                <FaceCrop variant={v.faceVariant} className="h-11 w-11 shrink-0" />
                <div className="min-w-[150px] flex-1">
                  <p className="font-semibold">{v.name}{v.people > 1 ? ` +${v.people - 1}` : ''}</p>
                  <p className="text-xs text-muted-light">{visitTypeLabel[v.type]} · {v.unit} · {tab === 'expected' ? `from ${hhmm(v.validFrom)}` : `in since ${hhmm(v.checkIn)}`}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                {v.plate && <Plate light>{v.plate}</Plate>}
                {tab === 'expected'
                  ? <Button size="sm" variant="nightPrimary" icon={<LogIn className="h-4 w-4" />} onClick={() => setCheckIn(v)}>Check in</Button>
                  : <Button size="sm" variant="night" icon={<LogOut className="h-4 w-4" />} onClick={() => { checkOutVisit(v.id); toast.success(`${v.name} checked out`); }}>Check out</Button>}
                </div>
              </li>
            ))}
            {!list.length && <li className="rounded-xl bg-night-field p-6 text-center text-sm text-muted-light">{tab === 'expected' ? 'No more visitors expected today.' : 'No visitors on site.'}</li>}
          </ul>
        </section>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-3 rounded-2xl border border-night-line bg-night-panel p-4">
            <div className="flex items-center justify-between"><h2 className="text-base font-extrabold">Open alerts</h2><Link to="/guard/alerts" className="text-[13px] font-bold text-brand-light">All</Link></div>
            {open.slice(0, 4).map((a) => (
              <button key={a.id} type="button" onClick={() => navigate(`/guard/alerts/${a.id}`)} className="flex items-center gap-3 rounded-xl bg-night-field p-3 text-left hover:bg-navy-700">
                <AlertTriangle className={cn('h-5 w-5 shrink-0', a.severity === 'critical' || a.severity === 'high' ? 'text-[#FF8A8E]' : 'text-[#FCC56B]')} />
                <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px] font-semibold">{a.title}</span><span className="text-xs text-muted-light">{relative(a.at)} · {statusLabel[a.status]}</span></span>
                <Chip dark tone={sevTone[a.severity]}>{a.severity}</Chip>
              </button>
            ))}
            {!open.length && <p className="text-sm text-muted-light">All clear.</p>}
          </section>

          {waiting.length > 0 && (
            <section className="flex flex-col gap-3 rounded-2xl border border-[#F59E0B]/40 bg-[#2a2210] p-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold"><Clock className="h-4 w-4 text-[#FCC56B]" />Waiting for residents</h2>
              {waiting.map((a) => (
                <div key={a.id} className="flex items-center gap-3">
                  <FaceCrop variant={a.faceVariant} className="h-10 w-10" />
                  <div className="min-w-0 flex-1"><p className="text-[13.5px] font-semibold">{a.visitorName}</p><p className="text-xs text-muted-light">{a.unit} · {a.purpose} · {relative(a.createdAt)}</p></div>
                  <Button size="sm" variant="night" icon={<Phone className="h-3.5 w-3.5" />} onClick={() => toast.info(`Calling ${a.unit}`, 'Intercom ringing…')}>Call</Button>
                </div>
              ))}
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-2xl border border-night-line bg-night-panel p-4">
            <div className="flex items-center justify-between"><h2 className="text-base font-extrabold">Main gate</h2><button type="button" onClick={() => toast.success('Barrier opened', 'Lane 1 · logged against your name')} className="flex items-center gap-1.5 rounded-lg bg-night-field px-3 py-1.5 text-[12.5px] font-bold hover:bg-navy-700"><Car className="h-4 w-4" />Open barrier</button></div>
            <CamFeed scene="gate" tone="teal" tag="Plate read · resident" cam="CAM 01 · Lane 1" time={hhmm(now.toISOString())} plate="VBK 2231" size="sm" className="rounded-xl" />
            <Link to="/guard/verify" className="flex items-center justify-between rounded-xl bg-night-field px-3 py-2.5 text-[13px] font-semibold hover:bg-navy-700">Visitor at the gate without a plate match? <ArrowRight className="h-4 w-4" /></Link>
          </section>
        </div>
      </div>

      <Modal dark open={!!checkIn} onClose={() => setCheckIn(null)} title={`Check in ${checkIn?.name ?? ''}`} description={`${checkIn?.unit} · host ${checkIn?.host}`}
        footer={<><Button variant="night" onClick={() => setCheckIn(null)}>Cancel</Button><Button variant="nightPrimary" onClick={() => { if (!checkIn) return; checkInVisit(checkIn.id, gate.includes('lane') ? 'Plate · guard' : 'Guard · lobby', 'Guard checked pass'); toast.success(`${checkIn.name} checked in`, `Host ${checkIn.host} notified.`); setCheckIn(null); }}>Confirm check-in</Button></>}>
        {checkIn && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3"><FaceCrop variant={checkIn.faceVariant} className="h-16 w-16" /><div><p className="font-bold">{checkIn.name}</p><p className="text-sm text-muted-light">{visitTypeLabel[checkIn.type]} · {checkIn.people} {checkIn.people > 1 ? 'people' : 'person'}</p>{checkIn.plate && <Plate light className="mt-1">{checkIn.plate}</Plate>}</div></div>
            <label className="flex flex-col gap-1.5 text-xs font-bold text-muted-light">Entry point
              <Select dark value={gate} onChange={(e) => setGate(e.target.value)}>{['Main gate · lane 1', 'Main gate · lane 2', 'Tower A lobby', 'Tower B lobby', 'Tower C lobby', 'Side gate'].map((g) => <option key={g}>{g}</option>)}</Select>
            </label>
            {checkIn.plate && <p className="rounded-xl bg-night-field p-3 text-[13px] text-[#C9D3EE]">Send to visitor bay V12, basement B1.</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
