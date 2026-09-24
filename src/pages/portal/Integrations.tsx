import { useState } from 'react';
import { ArrowUpDown, Cable, Camera as CameraIcon, CreditCard, DoorOpen, KeyRound, MessageSquare, MonitorSmartphone, RefreshCw, Server, TrafficCone } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, Chip, Input, Progress, Segmented, type ChipTone } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { CAMERAS } from '@/data/cameras';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toast';

type Status = 'Connected' | 'Degraded' | 'Partial';
const STATUS_TONE: Record<Status, ChipTone> = { Connected: 'teal', Degraded: 'amber', Partial: 'blue' };

/** The integration gateway links from the proposal: what EzVision talks to on site and in the cloud. */
const SYSTEMS: { name: string; icon: typeof Cable; what: string; detail: string; status: Status; last: string }[] = [
  { name: 'Existing CCTV / NVR', icon: CameraIcon, what: 'RTSP and ONVIF feeds from the current cameras', detail: '2 × Hikvision NVR · 48 streams · 46 live', status: 'Degraded', last: 'CAM 31 offline for 2h 04m' },
  { name: 'Boom barriers', icon: TrafficCone, what: 'Relay trigger on a valid plate, UHF tag or QR', detail: '2 vehicle lanes · ANPR and UHF reader at each', status: 'Connected', last: 'Opened for VBK 2231 · 3 min ago' },
  { name: 'Turnstiles and door controllers', icon: DoorOpen, what: 'Open on face match, QR or card; card taps feed tailgating detection', detail: '6 turnstiles · 3 lobby doors · 2 side gates', status: 'Connected', last: 'Tower A turnstile 2 · 40 s ago' },
  { name: 'Access card system', icon: KeyRound, what: 'Card holders and tap events synced both ways', detail: '1,284 card holders · 38 suspended', status: 'Connected', last: 'Synced 6 min ago' },
  { name: 'Lift access control', icon: ArrowUpDown, what: 'Floor restriction by visitor or contractor pass', detail: 'Towers A and B. Tower C lifts do not support it (vendor upgrade quoted).', status: 'Partial', last: 'Pass RN-0412 limited to level 21' },
  { name: 'Video intercom', icon: MonitorSmartphone, what: 'Lobby panels call the resident app; guard tablet calls units', detail: '3 lobby panels · no hardware needed in units', status: 'Connected', last: 'Tower B panel → B-12-05 · 22 min ago' },
  { name: 'WhatsApp and SMS', icon: MessageSquare, what: 'Visitor QR passes, reminders and notifications', detail: '1,906 messages this month · 99.4% delivered', status: 'Connected', last: 'Pass sent to 012-708 4418 · 1 h ago' },
  { name: 'Payment gateway', icon: CreditCard, what: 'Facility deposits, maintenance fees and move deposits', detail: 'FPX online banking and cards · settles next working day', status: 'Connected', last: 'RM 130.00 · BBQ pit booking · today' },
];

export default function Integrations() {
  const session = useStore((s) => s.session.portal);
  const log = useStore((s) => s.log);
  const [testing, setTesting] = useState<string | null>(null);
  const [zone, setZone] = useState<'all' | 'issues'>('all');
  const [q, setQ] = useState('');
  const cams = CAMERAS.filter((c) => (zone === 'all' || c.status !== 'online') && (!q || `${c.id} ${c.name} ${c.zone}`.toLowerCase().includes(q.toLowerCase())));

  const test = (name: string, status: Status) => {
    setTesting(name);
    window.setTimeout(() => {
      setTesting(null);
      log({ who: session?.name ?? 'Farah Hanim', role: 'Building Manager', action: 'Viewed', record: `Connection test: ${name}` });
      if (status === 'Connected') toast.success(`${name}: connected`, 'Round trip 38 ms through the integration gateway.');
      else toast.warning(`${name}: ${status.toLowerCase()}`, status === 'Degraded' ? 'Reachable, but one or more devices are offline. See Camera health.' : 'Working where the hardware supports it.');
    }, 700);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 md:grid-cols-2">
        {[['Edge server 1', 'Towers A and B, gates', 26, 41], ['Edge server 2', 'Tower C, carpark, perimeter', 22, 35]].map(([name, covers, streams, gpu]) => (
          <Card key={String(name)} className="flex flex-col gap-2.5 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-white"><Server className="h-5 w-5" /></span>
              <div className="flex-1"><p className="font-bold">{name}</p><p className="text-xs text-muted">On site, guardroom · UPS-backed · {covers}</p></div>
              <Chip tone="teal" dot>Running</Chip>
            </div>
            <div className="flex justify-between text-xs"><span className="text-muted">Streams</span><span className="font-bold">{streams} of 32</span></div>
            <Progress value={(Number(streams) / 32) * 100} color="#1D4FE0" h={6} label={`${name} streams`} />
            <div className="flex justify-between text-xs"><span className="text-muted">GPU</span><span className="font-bold">{gpu}%</span></div>
            <Progress value={Number(gpu)} color="#14A38F" h={6} label={`${name} GPU`} />
            <p className="text-[11.5px] text-muted">Raw video stays on site. Only events, snapshots and short clips go to the cloud.</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="p-4"><CardHeader title="Connected systems" sub="Through the EzVision integration gateway. Every connection test is logged." /></div>
        <ul className="divide-y divide-line-soft">
          {SYSTEMS.map((s) => (
            <li key={s.name} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink"><s.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1 basis-60">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted">{s.what}</p>
                <p className="text-xs text-muted-dark">{s.detail}</p>
              </div>
              <div className="flex flex-col items-end gap-1 text-right">
                <Chip tone={STATUS_TONE[s.status]} dot>{s.status}</Chip>
                <span className="text-[11.5px] text-muted">{s.last}</span>
              </div>
              <Button size="sm" icon={<RefreshCw className={cn('h-3.5 w-3.5', testing === s.name && 'animate-spin')} />} disabled={testing === s.name} onClick={() => test(s.name, s.status)} aria-label={`Test ${s.name}`}>Test</Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
          <CardHeader title="Camera streams" sub={`${CAMERAS.length} cameras · ${CAMERAS.filter((c) => c.status === 'online').length} online · face and plate recognition only on the choke-point cameras`} />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Camera filter" value={zone} onChange={setZone} options={[{ value: 'all', label: `All · ${CAMERAS.length}` }, { value: 'issues', label: `Needs attention · ${CAMERAS.filter((c) => c.status !== 'online').length}` }]} />
            <Input aria-label="Search cameras" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Camera, place or zone" className="ml-auto w-full sm:w-64" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[640px]">
            <thead><tr><th>Camera</th><th>Location</th><th>Type</th><th>Audio</th><th>Uptime 7d</th><th>Status</th></tr></thead>
            <tbody>
              {cams.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono font-bold">{c.id}</td><td>{c.name}<span className="block text-xs text-muted">{c.zone}</span></td><td>{c.kind}</td><td>{c.audio ? 'Yes' : '—'}</td><td>{c.uptime}%</td>
                  <td><Chip tone={c.status === 'online' ? 'teal' : c.status === 'offline' ? 'red' : 'amber'}>{c.status === 'online' ? 'Online' : c.note}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
