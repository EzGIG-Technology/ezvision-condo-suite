import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Car, Clock, Download, EyeOff, Megaphone, Moon, Package, Sparkles, Users, UserX, Volume2, WifiOff, MapPin, ShieldAlert } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, Chip, Modal, Progress, Segmented, Stat, Switch, Checkbox } from '@/components/ui';
import { Button, LinkButton } from '@/components/ui/Button';
import { CamFeed } from '@/components/vision';
import { BarChart } from '@/components/charts';
import { alertStatusText, sevBar, sevCam, sevLabel, sevTone, statusTone } from '@/lib/labels';
import { downloadFile, hhmm, toCsv, todayStamp } from '@/lib/utils';
import { toast } from '@/store/toast';

const TODAY = [3, 1, 0, 0, 1, 4, 12, 18, 14, 9, 8, 11, 15, 13, 10, 9, 12, 16, 21, 19, 14, 9, 5, 0];
const AVG = [2, 1, 0, 0, 1, 5, 11, 16, 13, 10, 9, 10, 13, 12, 10, 10, 13, 17, 19, 17, 12, 8, 4, 2];

type Filter = 'all' | 'critical' | 'unregistered' | 'perimeter' | 'carpark';

export default function Dashboard() {
  const alerts = useStore((s) => s.alerts);
  const visits = useStore((s) => s.visits);
  const faces = useStore((s) => s.unknownFaces);
  const parcels = useStore((s) => s.parcels);
  const guards = useStore((s) => s.guards);
  const nightMode = useStore((s) => s.nightMode);
  const setNightMode = useStore((s) => s.setNightMode);
  const talkDown = useStore((s) => s.talkDown);
  const createTicket = useStore((s) => s.createTicket);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [report, setReport] = useState(false);
  const [incl, setIncl] = useState({ visitors: true, alerts: true, parcels: false });

  const open = alerts.filter((a) => a.status !== 'closed');
  const feed = useMemo(() => {
    const list = [...alerts].sort((a, b) => +new Date(b.at) - +new Date(a.at));
    if (filter === 'critical') return list.filter((a) => a.severity === 'critical' || a.severity === 'high');
    if (filter === 'unregistered') return list.filter((a) => a.category === 'unregistered');
    if (filter === 'perimeter') return list.filter((a) => a.category === 'perimeter');
    if (filter === 'carpark') return list.filter((a) => a.category === 'carpark' || a.category === 'vehicle');
    return list;
  }, [alerts, filter]);
  const top = open.find((a) => a.severity === 'critical') ?? open[0];
  const onSite = visits.filter((v) => v.status === 'on_site').length;
  const unresolved = faces.filter((f) => f.status === 'unresolved').length;
  const waiting = parcels.filter((p) => p.status === 'waiting');
  const onDuty = guards.filter((g) => g.state !== 'Off duty');
  const overstays = visits.filter((v) => v.status === 'on_site' && new Date(v.validTo) < new Date()).length + 3;

  const exportReport = () => {
    const rows: (string | number | undefined)[][] = [['Section', 'Time', 'Title', 'Where / unit', 'Status']];
    if (incl.alerts) alerts.forEach((a) => rows.push(['Alert', hhmm(a.at), a.title, a.where, alertStatusText(a)]));
    if (incl.visitors) visits.forEach((v) => rows.push(['Visit', hhmm(v.checkIn ?? v.validFrom), v.name, v.unit, v.status]));
    if (incl.parcels) parcels.forEach((p) => rows.push(['Parcel', hhmm(p.loggedAt), `${p.courier} for ${p.recipient}`, p.unit, p.status]));
    downloadFile(`vista-harmoni-daily-report-${todayStamp()}.csv`, toCsv(rows));
    setReport(false);
    toast.success('Daily report downloaded', `${rows.length - 1} rows exported as CSV`);
  };

  const pins = [
    { a: alerts.find((x) => x.id === 'al-1'), x: 590, y: 30, label: 'Fence climb' },
    { a: alerts.find((x) => x.id === 'al-2'), x: 110, y: 118, label: 'Tailgating' },
    { a: alerts.find((x) => x.id === 'al-4'), x: 150, y: 210, label: 'Loitering B2' },
  ].filter((p) => p.a && p.a.status !== 'closed');

  return (
    <div className="flex flex-col gap-5">
      <section aria-label="Site status" className="flex flex-col gap-4 rounded-2xl bg-navy p-4 text-white sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand"><Moon className="h-5 w-5" /></span>
          <div className="flex flex-col gap-0.5">
            <div className="text-[14.5px] font-bold">{nightMode ? 'Night mode armed since 20:00' : 'Day mode · night rules paused'}</div>
            <div className="text-[12.5px] text-[#B8C4E6]">{nightMode ? 'Perimeter tripwires, restricted zones and after-hours rules are active' : 'Perimeter tripwires run on schedule only'} · {onDuty.length} guards on duty</div>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:ml-2">
            <span className="text-xs font-semibold text-[#B8C4E6]">Night mode</span>
            <Switch checked={nightMode} onChange={(v) => { setNightMode(v); toast.info(v ? 'Night mode armed' : 'Night mode paused', v ? 'Perimeter and after-hours rules are active.' : 'Rules follow their normal schedules.'); }} label="Night mode" dark />
          </div>
        </div>
        <div className="flex gap-2">
          <LinkButton to="/portal/community?compose=1" variant="night" className="flex-1 sm:flex-none" icon={<Megaphone className="h-4 w-4" />}>Broadcast</LinkButton>
          <Button variant="primary" className="flex-1 sm:flex-none" icon={<Download className="h-4 w-4" />} onClick={() => setReport(true)}>Daily report</Button>
        </div>
      </section>

      <section aria-label="Key figures" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Visitors today" value={visits.filter((v) => v.checkIn).length + 172} note={`${onSite} on site now`} icon={<Users className="h-4 w-4" />} iconTone="blue" onClick={() => navigate('/portal/visitors')} />
        <Stat label="Unregistered" value={unresolved} note={unresolved ? `${unresolved} not yet resolved` : 'All resolved'} noteTone={unresolved ? 'red' : 'teal'} icon={<UserX className="h-4 w-4" />} iconTone="red" onClick={() => navigate('/portal/unregistered')} />
        <Stat label="Open alerts" value={open.length} note={`${open.filter((a) => a.severity === 'critical').length} critical`} noteTone="red" icon={<AlertTriangle className="h-4 w-4" />} iconTone="amber" onClick={() => navigate('/portal/incidents')} />
        <Stat label="Avg. response" value="0:41" note="38% faster than August" noteTone="teal" icon={<Clock className="h-4 w-4" />} iconTone="teal" onClick={() => navigate('/portal/guards')} />
        <Stat label="Overstays" value={overstays} note="Vehicles past pass time" noteTone="amber" icon={<Car className="h-4 w-4" />} iconTone="amber" onClick={() => navigate('/portal/vehicles')} />
        <Stat label="Parcels waiting" value={waiting.length + 56} note="11 older than 3 days" icon={<Package className="h-4 w-4" />} iconTone="grey" onClick={() => navigate('/portal/community')} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_372px]">
        <Card className="flex flex-col overflow-hidden">
          <div className="flex flex-col gap-3 px-5 pb-3.5 pt-4 md:flex-row md:items-center md:justify-between">
            <div><h2 className="h2">Live alert feed</h2><p className="sub">Every alert must be closed by a guard with an outcome</p></div>
            <Segmented label="Filter alerts" value={filter} onChange={setFilter} options={[
              { value: 'all', label: `All · ${alerts.length}` }, { value: 'critical', label: 'Critical' }, { value: 'unregistered', label: 'Unregistered' }, { value: 'perimeter', label: 'Perimeter' }, { value: 'carpark', label: 'Carpark' },
            ]} />
          </div>
          <ul className="flex flex-col">
            {feed.slice(0, 7).map((a) => (
              <li key={a.id}>
                <Link to={`/portal/incidents/${a.id}`} className="flex items-center gap-3.5 border-t border-line-soft px-5 py-3 transition-colors hover:bg-[#F7F9FD]">
                  <span className="h-14 w-1 shrink-0 rounded" style={{ background: sevBar[a.severity] }} />
                  <CamFeed scene={a.scene} tone={sevCam[a.severity]} plate={a.plate} live={false} size="xs" className="hidden w-[124px] shrink-0 rounded-lg sm:block" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-[14px] font-bold">{a.title}</span><Chip tone={sevTone[a.severity]}>{sevLabel[a.severity]}</Chip></div>
                    <div className="flex items-center gap-1.5 text-[12.5px] text-muted"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{a.where}</span><span aria-hidden>·</span><span className="whitespace-nowrap font-mono">{hhmm(a.at)}</span></div>
                  </div>
                  <div className="hidden w-40 flex-col items-end gap-1 md:flex">
                    <Chip tone={statusTone[a.status]}>{alertStatusText(a)}</Chip>
                    <span className="text-[11.5px] text-muted">{a.owner ?? 'Unassigned'}</span>
                  </div>
                </Link>
              </li>
            ))}
            {feed.length === 0 && <li className="border-t border-line-soft px-5 py-10 text-center text-sm text-muted">No alerts in this filter.</li>}
          </ul>
          <Link to="/portal/incidents" className="border-t border-line-soft px-5 py-3 text-center text-[13px] font-bold text-brand hover:bg-[#F7F9FD]">View all alerts and incidents</Link>
        </Card>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3.5 rounded-2xl bg-navy p-4 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-teal"><Sparkles className="h-4 w-4" /></span>
              <div className="flex flex-1 flex-col"><span className="text-[14.5px] font-extrabold">EzVision Agent</span><span className="text-[11.5px] text-muted-light">Most important event right now</span></div>
              <span className="text-[11px] font-bold text-teal-bright">LIVE</span>
            </div>
            {top ? (
              <>
                <CamFeed scene={top.scene} tone={sevCam[top.severity]} tag={top.title} cam={top.camera} time={hhmm(top.at)} plate={top.plate} size="sm" />
                <p className="text-[13px] leading-relaxed text-[#D6DEF5]">{top.summary}</p>
                <div className="flex gap-2">
                  <Button variant="night" className="flex-1" icon={<Volume2 className="h-4 w-4" />} onClick={() => { talkDown(top.id); toast.success('Talk-down played', `Nearest speaker to ${top.camera}`); }}>Talk-down</Button>
                  <LinkButton to={`/portal/incidents/${top.id}`} variant="danger" className="flex-1" icon={<ShieldAlert className="h-4 w-4" />}>Open</LinkButton>
                </div>
              </>
            ) : <p className="py-6 text-center text-sm text-muted-light">All quiet. No open alerts.</p>}
          </div>
          <Card className="flex flex-col gap-3 p-4">
            <CardHeader title="Guards on duty" action={<Link to="/portal/guards" className="text-[12.5px] font-bold text-brand">View all</Link>} />
            {onDuty.map((g) => (
              <div key={g.id} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold text-white" style={{ background: g.color }}>{g.initials}</span>
                <div className="flex min-w-0 flex-1 flex-col"><span className="text-[13px] font-bold">{g.name}</span><span className="truncate text-[11.5px] text-muted">{g.where}</span></div>
                <Chip tone={g.state === 'Responding' ? 'red' : g.state === 'At post' ? 'teal' : 'blue'}>{g.state}</Chip>
              </div>
            ))}
          </Card>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_372px]">
        <Card className="flex flex-col gap-2.5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="h2">Visitor entries by hour</h2><p className="sub">Today vs 4-week average for this weekday</p></div>
            <div className="flex gap-4 text-xs font-semibold text-muted-dark">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand" />Today · {TODAY.reduce((a, b) => a + b, 0)}</span>
              <span className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-navy" />4-week avg · {AVG.reduce((a, b) => a + b, 0)}</span>
            </div>
          </div>
          <BarChart values={TODAY} compare={AVG} labels={TODAY.map((_, i) => `${String(i).padStart(2, '0')}:00`)} labelEvery={3} max={25} highlightLast
            ariaLabel="Bar chart of visitor entries per hour today with the 4-week average as a dashed line" tipLabel={(i) => `${String(i).padStart(2, '0')}:00 · ${TODAY[i]} entries (avg ${AVG[i]})`} />
        </Card>
        <Card className="flex flex-col gap-3.5 p-5">
          <CardHeader title="Entries by access point" sub="All people and vehicles today" />
          {[['Main gate · vehicles', 96, ''], ['Tower A lobby', 41, ''], ['Tower B lobby', 28, ''], ['Tower C lobby', 22, ''], ['Side gate · pedestrian', 11, `${faces.filter((f) => f.where.includes('Side') && f.status === 'unresolved').length + 3} unregistered`], ['Carpark lift lobbies', 9, '']].map(([name, v, note]) => (
            <div key={name as string} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[12.5px]"><span className="font-semibold">{name}</span><span className="font-bold">{v} {note && <span className="font-semibold text-warn-ink">{note}</span>}</span></div>
              <Progress value={((v as number) / 96) * 100} color={note ? '#F59E0B' : '#1D4FE0'} label={name as string} />
            </div>
          ))}
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_372px]">
        <Card className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="h2">Site map</h2><p className="sub">Open alerts and camera coverage · tap a pin to open it</p></div>
            <div className="flex gap-3.5 text-xs font-semibold text-muted-dark">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-danger-dot" />Critical</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warn" />Warning</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal" />Camera</span>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 688 300" className="h-auto w-full min-w-[520px]" role="img" aria-label="Site plan with open alert pins">
              <rect x="8" y="8" width="672" height="284" rx="18" fill="#F7F9FD" stroke="#C9D5EC" strokeWidth="2" strokeDasharray="8 6" />
              {[[60, 48, 'Tower A'], [268, 40, 'Tower B'], [476, 48, 'Tower C']].map(([x, y, t]) => (
                <g key={t as string}><rect x={x as number} y={y as number} width="150" height="96" rx="10" fill="#E8EEFF" stroke="#B9C9F5" /><text x={(x as number) + 75} y={(y as number) + 53} fontSize="14" fontWeight="800" textAnchor="middle" fill="#1D3FB0">{t}</text></g>
              ))}
              <rect x="250" y="168" width="190" height="64" rx="32" fill="#DDF3F0" stroke="#9ED8CF" /><text x="345" y="205" fontSize="12.5" fontWeight="700" textAnchor="middle" fill="#0B6B5F">Pool &amp; facilities deck</text>
              <rect x="72" y="176" width="120" height="48" rx="8" fill="#EEF1F7" stroke="#CDD5E6" /><text x="132" y="205" fontSize="12" fontWeight="700" textAnchor="middle" fill="#3A4468">Carpark ramp B1–B3</text>
              <rect x="520" y="182" width="100" height="40" rx="8" fill="#EEF1F7" stroke="#CDD5E6" /><text x="570" y="207" fontSize="12" fontWeight="700" textAnchor="middle" fill="#3A4468">Bin centre</text>
              <rect x="300" y="276" width="90" height="22" rx="6" fill="#0B1640" /><text x="345" y="291" fontSize="11" fontWeight="700" textAnchor="middle" fill="#fff">MAIN GATE</text>
              <rect x="664" y="120" width="22" height="60" rx="6" fill="#0B1640" /><text x="675" y="150" fontSize="10" fontWeight="700" textAnchor="middle" fill="#fff" transform="rotate(90 675 150)">SIDE GATE</text>
              {[[60, 40], [210, 40], [268, 32], [418, 32], [476, 40], [626, 40], [245, 170], [445, 170], [300, 262], [390, 262], [650, 110], [650, 190], [72, 234], [520, 176], [620, 176], [30, 150]].map(([x, y]) => (
                <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="#14A38F" stroke="#fff" strokeWidth="1.5" />
              ))}
              {pins.map((p) => {
                const color = p.a!.severity === 'warning' ? '#F59E0B' : '#E5484D';
                const label = `${p.label} · ${hhmm(p.a!.at)}`;
                const lw = label.length * 6.2 + 16;
                const lx = p.x > 400 ? p.x - lw - 14 : p.x + 14;
                return (
                  <a key={p.a!.id} href={`/portal/incidents/${p.a!.id}`} onClick={(e) => { e.preventDefault(); navigate(`/portal/incidents/${p.a!.id}`); }} aria-label={`Open ${p.a!.title}`}>
                    <circle cx={p.x} cy={p.y} r="15" fill={color} opacity="0.18" />
                    <circle cx={p.x} cy={p.y} r="8" fill={color} stroke="#fff" strokeWidth="2" />
                    <rect x={lx} y={p.y - 11} width={lw} height="22" rx="6" fill="#0B1640" />
                    <text x={lx + 8} y={p.y + 4} fontSize="11" fontWeight="700" fill="#fff">{label}</text>
                  </a>
                );
              })}
            </svg>
          </div>
        </Card>
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3 p-5">
            <CardHeader title="Carpark occupancy" action={<Link to="/portal/vehicles" className="text-[12.5px] font-bold text-brand">Details</Link>} />
            {[['B1 · Visitor', 83, '25 / 30', '#F59E0B'], ['B1 · Resident', 71, '142 / 200', '#1D4FE0'], ['B2 · Resident', 88, '211 / 240', '#1D4FE0'], ['B3 · Resident', 64, '154 / 240', '#1D4FE0']].map(([n, p, l, c]) => (
              <div key={n as string} className="flex items-center gap-2.5">
                <span className="w-24 text-[12.5px] font-semibold">{n}</span>
                <div className="flex-1"><Progress value={p as number} color={c as string} h={10} label={n as string} /></div>
                <span className="w-16 text-right text-[12.5px] font-bold">{l}</span>
              </div>
            ))}
          </Card>
          <Card className="flex flex-col gap-3 p-5">
            <CardHeader title="Camera health" action={<Chip tone="amber">2 need attention</Chip>} />
            {[
              { icon: <WifiOff className="h-4 w-4" />, tone: 'bg-danger-soft text-danger-ink', title: 'CAM 31 · Tower C stair L12', body: 'Offline for 2h 04m' },
              { icon: <EyeOff className="h-4 w-4" />, tone: 'bg-warn-soft text-warn-ink', title: 'CAM 44 · Bin centre', body: 'View partly blocked since 19:40' },
            ].map((c) => (
              <div key={c.title} className="flex items-center gap-2.5">
                <span className={`flex h-9 w-9 items-center justify-center rounded-[9px] ${c.tone}`}>{c.icon}</span>
                <div className="flex flex-1 flex-col"><span className="text-[13px] font-bold">{c.title}</span><span className="text-[11.5px] text-muted">{c.body}</span></div>
                <Button size="sm" onClick={() => { createTicket({ title: `${c.title}: ${c.body.toLowerCase()}`, meta: 'Raised from camera health · vendor notified', evidence: true, state: 'New' }); toast.success('Ticket raised', 'The camera vendor has been notified.'); }}>Ticket</Button>
              </div>
            ))}
          </Card>
        </div>
      </section>

      <Modal open={report} onClose={() => setReport(false)} title="Daily report" description={`Vista Harmoni Residences · ${new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}`}
        footer={<><Button onClick={() => setReport(false)}>Cancel</Button><Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={exportReport}>Download CSV</Button></>}>
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-muted-dark">Choose what to include. The file opens in Excel or Google Sheets.</p>
          <Checkbox checked={incl.alerts} onChange={(v) => setIncl({ ...incl, alerts: v })} label={`Alerts and incidents (${alerts.length})`} />
          <Checkbox checked={incl.visitors} onChange={(v) => setIncl({ ...incl, visitors: v })} label={`Visitor log (${visits.length})`} />
          <Checkbox checked={incl.parcels} onChange={(v) => setIncl({ ...incl, parcels: v })} label={`Parcels (${parcels.length})`} />
        </div>
      </Modal>
    </div>
  );
}
