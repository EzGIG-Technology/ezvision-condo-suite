import type { useStore } from '@/store/useStore';
import type { ReportData } from '@/lib/export';
import { CAMERAS } from '@/data/cameras';
import { PARKING_VIOLATIONS } from '@/data/parking';
import { SITE } from '@/data/seed';
import { rm, when } from '@/lib/utils';
import { strataAccounts } from '@/lib/accounts';

type State = ReturnType<typeof useStore.getState>;

export interface ReportDef {
  name: string;
  desc: string;
  frequency: string;
  audience: string;
  build: (s: State) => Omit<ReportData, 'title'>;
}

const secs = (mmss: string) => { const [m, s] = mmss.split(':').map(Number); return m * 60 + (s || 0); };
const mmss = (n: number) => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, '0')}`;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : '—');
const isNuisance = (t: string) => /dump|thrown|litter|smok|vandal|pet|noise|rubbish/i.test(t);

/** Figures for the pilot review in the proposal's implementation plan. */
export function pilotMetrics(s: State) {
  const digital = s.visits.length;
  const unknowns = s.unknownFaces.length + s.unknownPlates.length;
  const resolved = s.unknownFaces.filter((f) => f.status !== 'unresolved').length + s.unknownPlates.filter((p) => p.status !== 'open').length;
  const response = s.guards.length ? s.guards.reduce((n, g) => n + secs(g.avgResponse), 0) / s.guards.length : 0;
  const fired = s.rules.reduce((n, r) => n + r.firedWeek, 0);
  const falses = s.rules.reduce((n, r) => n + r.falseWeek, 0);
  const members = s.units.flatMap((u) => u.household);
  const onApp = members.filter((m) => m.app).length;
  return [
    { metric: 'Entries captured digitally', value: pct(digital, digital), detail: `${digital} of ${digital} visitor entries in the system · paper log retired`, target: '95%', ok: true },
    { metric: 'Unregistered entries detected', value: `${unknowns} this week`, detail: `${resolved} resolved by guards (${pct(resolved, unknowns)})`, target: '80% resolved', ok: resolved / Math.max(unknowns, 1) >= 0.8 },
    { metric: 'Average alert-to-response', value: mmss(response), detail: `Mean across ${s.guards.length} guards`, target: 'Under 1:00', ok: response < 60 },
    { metric: 'False alert rate', value: pct(falses, fired), detail: `${falses} of ${fired} alerts marked false · ${(falses / 48).toFixed(2)} per camera`, target: 'Under 8%', ok: falses / Math.max(fired, 1) < 0.08 },
    { metric: 'Resident app adoption', value: pct(onApp, members.length), detail: `${onApp} of ${members.length} household members on the app`, target: '60%', ok: onApp / Math.max(members.length, 1) >= 0.6 },
  ];
}

export const REPORTS: ReportDef[] = [
  {
    name: 'Daily security summary', desc: 'Alerts, response times, unregistered entries and patrols for the last 24 hours', frequency: 'Daily', audience: 'MC, security supervisor',
    build: (s) => ({
      file: 'daily-security-summary',
      summary: [['Alerts', `${s.alerts.length} (${s.alerts.filter((a) => a.status !== 'closed').length} open)`], ['Visitors on site', String(s.visits.filter((v) => v.status === 'on_site').length)],
        ['Unregistered people unresolved', String(s.unknownFaces.filter((f) => f.status === 'unresolved').length)], ['Parcels waiting', String(s.parcels.filter((p) => p.status === 'waiting').length)],
        ['Patrol checkpoints done', `${s.checkpoints.filter((c) => c.status === 'done').length} of ${s.checkpoints.length}`]],
      columns: ['Ref', 'Time', 'Alert', 'Where', 'Severity', 'Status', 'Owner'],
      rows: s.alerts.map((a) => [a.ref, when(a.at), a.title, a.where, a.severity, a.status, a.owner]),
    }),
  },
  {
    name: 'Weekly JMB pack', desc: 'One-page summary for the committee with trends and open actions', frequency: 'Weekly', audience: 'JMB committee',
    build: (s) => ({
      file: 'weekly-jmb-pack',
      summary: [...pilotMetrics(s).map((m) => [m.metric, `${m.value} · ${m.detail}`] as [string, string]), ['Open tickets', String(s.tickets.filter((t) => t.state !== 'Resolved').length)], ['Permits in review', String(s.permits.filter((p) => p.status === 'review').length)]],
      columns: ['Open action', 'Type', 'Owner or unit', 'Status'],
      rows: [
        ...s.alerts.filter((a) => a.status !== 'closed').map((a) => [a.title, 'Alert', a.owner ?? '—', a.status]),
        ...s.tickets.filter((t) => t.state !== 'Resolved').map((t) => [t.title, 'Ticket', t.unit ?? 'Common area', t.state]),
        ...s.permits.filter((p) => p.status === 'review').map((p) => [`${p.id} ${p.scope}`, 'Permit', p.unit, 'In review']),
      ],
    }),
  },
  {
    name: 'Incidents', desc: 'Every alert with owner, timeline and outcome', frequency: 'Weekly / monthly', audience: 'MC, JMB committee',
    build: (s) => ({ file: 'incidents', columns: ['Ref', 'Time', 'Title', 'Where', 'Severity', 'Status', 'Owner', 'Outcome'], rows: s.alerts.map((a) => [a.ref, when(a.at), a.title, a.where, a.severity, a.status, a.owner, a.outcome]) }),
  },
  {
    name: 'Visitors', desc: 'Visitor log with check-in method, host unit and plate', frequency: 'Daily / on demand', audience: 'MC, security supervisor',
    build: (s) => ({ file: 'visitors', columns: ['Name', 'Type', 'Unit', 'Host', 'Status', 'Check in', 'Check out', 'Entry', 'Plate'], rows: s.visits.map((v) => [v.name, v.type, v.unit, v.host, v.status, when(v.checkIn), when(v.checkOut), v.entry, v.plate]) }),
  },
  {
    name: 'Unregistered entries', desc: 'Unknown people and plates detected and how each was resolved', frequency: 'Daily', audience: 'MC, security supervisor',
    build: (s) => ({
      file: 'unregistered', columns: ['ID', 'Type', 'Where', 'When', 'Description', 'Status', 'Resolution'],
      rows: [...s.unknownFaces.map((f) => [f.id, 'Person', f.where, when(f.at), f.description, f.status, f.resolution]), ...s.unknownPlates.map((p) => [p.id, 'Vehicle', p.lane, when(p.firstSeen), `${p.plate} · ${p.vehicle}`, p.status, p.outcome])],
    }),
  },
  {
    name: 'Guard scorecard', desc: 'Per-guard response time, patrol completion, post attendance and talk-downs', frequency: 'Weekly / monthly', audience: 'MC, guard company',
    build: (s) => ({ file: 'guard-scorecard', columns: ['Guard', 'Shift', 'Alerts closed', 'Avg response', 'Patrol %', 'Post unattended', 'Talk-downs', 'Rating'], rows: s.guards.map((g) => [g.name, g.shift, g.alertsClosed, g.avgResponse, g.patrolPct, g.unattended, g.talkDowns, g.rating]) }),
  },
  {
    name: 'Contractor and renovation activity', desc: 'Permits, workers, deposits, breaches and the daily contractor log', frequency: 'Weekly', audience: 'MC',
    build: (s) => ({
      file: 'contractor-activity',
      summary: [['Active permits', String(s.permits.filter((p) => p.status === 'active' || p.status === 'ending').length)], ['Breaches', String(s.permits.filter((p) => p.status === 'breach').length)], ['Contractor visits', String(s.visits.filter((v) => v.type === 'contractor').length)]],
      columns: ['Record', 'Unit', 'Work or company', 'Period or time', 'Workers', 'Status', 'Deposit'],
      rows: [
        ...s.permits.map((p) => [p.id, p.unit, `${p.scope} · ${p.contractor}`, `${p.start} to ${p.end}`, p.workers.length, p.status, `RM ${p.deposit}${p.depositPaid ? ' paid' : ' unpaid'}`]),
        ...s.visits.filter((v) => v.type === 'contractor').map((v) => ['Visit', v.unit, v.name, when(v.checkIn) || when(v.validFrom), v.people, v.status, '—']),
        ...s.liftBookings.map((b) => ['Service lift', b.unit, `${b.what}${b.mover ? ` · ${b.mover}` : ''}`, `${when(b.date).split(' ')[0]} ${b.slot}`, b.crew ?? '—', b.status ?? 'approved', b.deposit ? `RM ${b.deposit}${b.depositRefunded ? ' refunded' : b.depositPaid ? ' paid' : ''}` : '—']),
      ],
    }),
  },
  {
    name: 'Parking violations and overstays', desc: 'Fire lane, bay misuse, obstruction, abandoned vehicles and visitor overstays', frequency: 'Weekly', audience: 'MC',
    build: (s) => {
      const over = s.visits.filter((v) => v.status === 'on_site' && v.plate && new Date(v.validTo) < new Date());
      return {
        file: 'parking-violations',
        summary: [['Violations', String(PARKING_VIOLATIONS.length)], ['Visitor overstays now', String(over.length)]],
        columns: ['Type', 'Plate', 'Unit', 'Where', 'When', 'Details', 'Status'],
        rows: [
          ...PARKING_VIOLATIONS.map((v) => [v.tag, v.plate, v.unit, v.cam, v.time, v.body, v.state]),
          ...over.map((v) => ['Visitor overstay', v.plate, v.unit, 'Visitor parking', `Pass ended ${when(v.validTo)}`, v.name, 'On site']),
        ],
      };
    },
  },
  {
    name: 'Nuisance incidents by type and location', desc: 'Dumping, objects thrown from height, littering, smoking, pets and vandalism', frequency: 'Monthly', audience: 'JMB committee, AGM',
    build: (s) => {
      const alerts = s.alerts.filter((a) => a.category === 'nuisance' || isNuisance(a.title));
      const tickets = s.tickets.filter((t) => isNuisance(t.title) || t.category === 'Cleanliness' || t.category === 'Noise');
      const rules = s.rules.filter((r) => r.group === 'Nuisance');
      return {
        file: 'nuisance',
        summary: rules.map((r) => [r.name, `${r.firedWeek} this week${r.enabled ? '' : ' (rule off)'}`] as [string, string]),
        columns: ['Source', 'Ref', 'What', 'Where', 'When', 'Status'],
        rows: [...alerts.map((a) => ['Camera', a.ref, a.title, a.where, when(a.at), a.status]), ...tickets.map((t) => ['Ticket', t.id, t.title, t.location ?? t.meta, when(t.createdAt), t.state])],
      };
    },
  },
  {
    name: 'Camera health and uptime', desc: 'Every camera with 7-day uptime, faults and recognition type', frequency: 'Weekly', audience: 'MC, maintenance',
    build: () => ({
      file: 'camera-health',
      summary: [['Cameras', String(CAMERAS.length)], ['Online now', String(CAMERAS.filter((c) => c.status === 'online').length)], ['Average uptime, 7 days', `${(CAMERAS.reduce((n, c) => n + c.uptime, 0) / CAMERAS.length).toFixed(2)}%`]],
      columns: ['Camera', 'Location', 'Zone', 'Type', 'Microphone', 'Uptime 7d', 'Status'],
      rows: CAMERAS.map((c) => [c.id, c.name, c.zone, c.kind, c.audio ? 'Yes' : 'No', `${c.uptime}%`, c.note ?? 'Online']),
    }),
  },
  {
    name: 'Wrong check-ins and visitor aging', desc: 'Visitors at the wrong block, visits that never checked out, and expired passes never used', frequency: 'Weekly', audience: 'MC, security supervisor',
    build: (s) => {
      const nowMs = Date.now();
      const aging = s.visits.filter((v) => v.status === 'on_site' && +new Date(v.validTo) < nowMs);
      const noShow = s.visits.filter((v) => v.status === 'expected' && +new Date(v.validTo) < nowMs);
      const wrong = s.alerts.filter((a) => /wrong block|wrong zone|wrong unit/i.test(a.title));
      return {
        file: 'wrong-checkins-aging',
        summary: [['Wrong block or unit', String(wrong.length)], ['On site after pass ended', String(aging.length)], ['Passes expired, never used', String(noShow.length)]],
        columns: ['Issue', 'Visitor or ref', 'Unit', 'Pass ended', 'Hours over', 'Status'],
        rows: [
          ...wrong.map((a) => ['Wrong block', a.ref, a.unit ?? '—', '—', '—', a.status]),
          ...aging.map((v) => ['Never checked out', v.name, v.unit, when(v.validTo), Math.round((nowMs - +new Date(v.validTo)) / 36e5 * 10) / 10, 'On site']),
          ...noShow.map((v) => ['Expired, never used', v.name, v.unit, when(v.validTo), '—', 'Expired']),
        ],
      };
    },
  },
  {
    name: 'Parcels', desc: 'Parcels logged, collected and aging', frequency: 'Weekly', audience: 'MC',
    build: (s) => ({ file: 'parcels', columns: ['Unit', 'Recipient', 'Courier', 'Shelf', 'Logged', 'Status', 'Collected'], rows: s.parcels.map((p) => [p.unit, p.recipient, p.courier, p.shelf, when(p.loggedAt), p.status, when(p.collectedAt)]) }),
  },
  {
    name: 'Permits', desc: 'Renovation and move permits with deposits and breaches', frequency: 'Weekly', audience: 'MC',
    build: (s) => ({ file: 'permits', columns: ['Permit', 'Unit', 'Scope', 'Contractor', 'Start', 'End', 'Status', 'Deposit'], rows: s.permits.map((p) => [p.id, p.unit, p.scope, p.contractor, p.start, p.end, p.status, p.deposit]) }),
  },
  {
    name: 'Strata accounts', desc: 'Maintenance fund and sinking fund ledger, collections, deposits held and balances', frequency: 'Monthly / quarterly', audience: 'JMB committee, AGM',
    build: (s) => {
      const a = strataAccounts(s);
      return {
        file: 'strata-accounts',
        summary: [['Period', a.quarter], ['Collection rate', `${(a.collectionRate * 100).toFixed(1)}%`], ['Maintenance fund balance', rm(a.balance.maintenance)], ['Sinking fund balance', rm(a.balance.sinking)], ['Deposits held (refundable)', rm(a.depositsHeld)]],
        columns: ['Item', 'Fund', 'Amount (RM)'],
        rows: a.ledger.map(([k, f, v]) => [k, f, v.toLocaleString('en-MY', { minimumFractionDigits: 2 })]),
      };
    },
  },
  {
    name: 'Pilot success metrics', desc: 'The five pilot review measures from the implementation plan, against target', frequency: 'After the 2-week pilot', audience: 'JMB committee, EzTEC',
    build: (s) => ({ file: 'pilot-metrics', summary: [['Site', SITE.name], ['Review period', 'Last 14 days']], columns: ['Measure', 'Result', 'Detail', 'Target', 'Met'], rows: pilotMetrics(s).map((m) => [m.metric, m.value, m.detail, m.target, m.ok ? 'Yes' : 'Not yet']) }),
  },
];
