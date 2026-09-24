import { useState } from 'react';
import { CalendarClock, Download, FileBarChart, FileText, Mail, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, Checkbox, Chip, Field, Input, Modal, Select, Switch } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { BarChart } from '@/components/charts';
import { SITE } from '@/data/seed';
import { downloadFile, todayStamp, toCsv, when } from '@/lib/utils';
import { toast } from '@/store/toast';

interface Schedule { id: string; name: string; every: string; to: string; on: boolean }

const WEEK = [14, 11, 16, 9, 12, 18, 15];
const WEEK_PREV = [12, 13, 15, 12, 14, 16, 17];
const WEEK_L = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Reports() {
  const state = useStore.getState;
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: 's1', name: 'Daily security summary', every: 'Every day at 07:00', to: 'Farah Hanim, Securiforce supervisor', on: true },
    { id: 's2', name: 'Weekly JMB pack', every: 'Every Monday at 08:00', to: 'All committee members', on: true },
    { id: 's3', name: 'Monthly guard scorecard', every: '1st of the month', to: 'Securiforce Sdn Bhd', on: false },
  ]);
  const [custom, setCustom] = useState(false);
  const [sched, setSched] = useState(false);
  const [kind, setKind] = useState('Incidents');
  const [range, setRange] = useState('Last 7 days');
  const [fmt, setFmt] = useState('CSV');
  const [sName, setSName] = useState('Daily security summary');
  const [sEvery, setSEvery] = useState('Every day at 07:00');
  const [sTo, setSTo] = useState('');
  const [includeClips, setIncludeClips] = useState(false);

  const build = (name: string): [string, string] => {
    const s = state();
    switch (name) {
      case 'Incidents':
        return ['incidents', toCsv([['Ref', 'Time', 'Title', 'Where', 'Severity', 'Status', 'Owner', 'Outcome'], ...s.alerts.map((a) => [a.ref, when(a.at), a.title, a.where, a.severity, a.status, a.owner, a.outcome])])];
      case 'Visitors':
        return ['visitors', toCsv([['Name', 'Type', 'Unit', 'Host', 'Status', 'Check in', 'Check out', 'Entry', 'Plate'], ...s.visits.map((v) => [v.name, v.type, v.unit, v.host, v.status, when(v.checkIn), when(v.checkOut), v.entry, v.plate])])];
      case 'Unregistered entries':
        return ['unregistered', toCsv([['ID', 'Where', 'When', 'Description', 'Status', 'Resolution'], ...s.unknownFaces.map((f) => [f.id, f.where, when(f.at), f.description, f.status, f.resolution])])];
      case 'Guard scorecard':
        return ['guards', toCsv([['Guard', 'Shift', 'Alerts closed', 'Avg response', 'Patrol %', 'Rating'], ...s.guards.map((g) => [g.name, g.shift, g.alertsClosed, g.avgResponse, g.patrolPct, g.rating])])];
      case 'Parcels':
        return ['parcels', toCsv([['Unit', 'Recipient', 'Courier', 'Shelf', 'Logged', 'Status', 'Collected'], ...s.parcels.map((p) => [p.unit, p.recipient, p.courier, p.shelf, when(p.loggedAt), p.status, when(p.collectedAt)])])];
      case 'Permits':
        return ['permits', toCsv([['Permit', 'Unit', 'Scope', 'Contractor', 'Start', 'End', 'Status', 'Deposit'], ...s.permits.map((p) => [p.id, p.unit, p.scope, p.contractor, p.start, p.end, p.status, p.deposit])])];
      default: {
        const open = s.alerts.filter((a) => a.status !== 'closed').length;
        const txt = [`${SITE.name} — ${name}`, `Generated ${new Date().toLocaleString('en-GB')}`, '', `Alerts today: ${s.alerts.length} (${open} open)`, `Visitors on site: ${s.visits.filter((v) => v.status === 'on_site').length}`,
          `Unregistered people unresolved: ${s.unknownFaces.filter((f) => f.status === 'unresolved').length}`, `Parcels waiting: ${s.parcels.filter((p) => p.status === 'waiting').length}`, `Permits in review: ${s.permits.filter((p) => p.status === 'review').length}`,
          '', 'Incidents:', ...s.alerts.map((a) => `  ${a.ref}  ${when(a.at)}  ${a.title} — ${a.status}`)].join('\n');
        return [name.toLowerCase().replace(/\W+/g, '-'), txt];
      }
    }
  };

  const download = (name: string, format = 'CSV') => {
    const [file, content] = build(name);
    const isText = !content.startsWith('"');
    const ext = isText || format === 'PDF' ? 'txt' : 'csv';
    downloadFile(`${file}-${todayStamp()}.${ext}`, content, ext === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8');
    state().log({ who: 'Farah Hanim', role: 'Building Manager', action: 'Exported', record: `${name} report` });
    toast.success(`${name} downloaded`);
  };

  const library = [
    { name: 'Daily security summary', desc: 'Alerts, response times, unregistered entries and guard patrols for the last 24 hours', icon: FileText },
    { name: 'Weekly JMB pack', desc: 'One-page summary for the committee with trends and open actions', icon: FileBarChart },
    { name: 'Incidents', desc: 'Every alert with owner, timeline and outcome', icon: FileText },
    { name: 'Visitors', desc: 'Visitor log with check-in method, host unit and plate', icon: FileText },
    { name: 'Unregistered entries', desc: 'Unknown people detected and how each was resolved', icon: FileText },
    { name: 'Guard scorecard', desc: 'Per-guard response time, patrol completion and talk-downs', icon: FileBarChart },
    { name: 'Parcels', desc: 'Parcels logged, collected and aging', icon: FileText },
    { name: 'Permits', desc: 'Renovation and move permits with deposits and breaches', icon: FileText },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="p-4">
          <CardHeader title="Alerts this week vs last week" sub="All severities · solid bars this week, dashed line last week" action={<Button size="sm" icon={<Download className="h-4 w-4" />} onClick={() => download('Weekly JMB pack')}>Weekly pack</Button>} />
          <div className="mt-3"><BarChart ariaLabel="Alerts per day" values={WEEK} compare={WEEK_PREV} labels={WEEK_L} highlightLast tipLabel={(i) => `${WEEK_L[i]}: ${WEEK[i]} alerts (last week ${WEEK_PREV[i]})`} /></div>
        </Card>
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="h2">Custom report</h2>
          <p className="sub">Pick the data and the period. Exports are logged for PDPA.</p>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCustom(true)}>Build a report</Button>
          <div className="mt-1 grid grid-cols-2 gap-3 text-[13px]">
            <div className="rounded-xl bg-ice p-3"><p className="text-xs text-muted">Unregistered entries, 30 d</p><p className="text-xl font-extrabold">184</p><p className="text-xs text-teal-dark">−38% since go-live</p></div>
            <div className="rounded-xl bg-ice p-3"><p className="text-xs text-muted">False alerts</p><p className="text-xl font-extrabold">6.1%</p><p className="text-xs text-teal-dark">−4.2 pts after tuning</p></div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4"><CardHeader title="Report library" sub="Ready-made reports from live data" /></div>
        <ul className="grid gap-3 px-4 pb-4 md:grid-cols-2">
          {library.map((r) => (
            <li key={r.name} className="flex items-start gap-3 rounded-2xl border border-line p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink"><r.icon className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="font-bold">{r.name}</p><p className="text-[12.5px] text-muted">{r.desc}</p></div>
              <Button size="sm" icon={<Download className="h-4 w-4" />} onClick={() => download(r.name)} aria-label={`Download ${r.name}`}>Download</Button>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4"><CardHeader title="Scheduled reports" sub="Sent by email as PDF and CSV" action={<Button size="sm" icon={<CalendarClock className="h-4 w-4" />} onClick={() => setSched(true)}>Add schedule</Button>} /></div>
        <ul className="divide-y divide-line-soft">
          {schedules.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Mail className="h-5 w-5 text-muted" />
              <div className="min-w-0 flex-1"><p className="font-semibold">{s.name}</p><p className="text-xs text-muted">{s.every} · to {s.to}</p></div>
              <Chip tone={s.on ? 'teal' : 'grey'}>{s.on ? 'Active' : 'Paused'}</Chip>
              <Switch checked={s.on} label={`Toggle ${s.name}`} onChange={(v) => { setSchedules((xs) => xs.map((x) => (x.id === s.id ? { ...x, on: v } : x))); toast.info(v ? 'Schedule resumed' : 'Schedule paused'); }} />
              <Button size="sm" variant="ghost" onClick={() => toast.success('Test email sent', `${s.name} to ${s.to.split(',')[0]}`)}>Send now</Button>
              <Button size="sm" variant="ghost" aria-label={`Delete ${s.name}`} icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => { setSchedules((xs) => xs.filter((x) => x.id !== s.id)); toast.info('Schedule deleted'); }} />
            </li>
          ))}
          {!schedules.length && <li className="px-4 py-6 text-center text-sm text-muted">No scheduled reports.</li>}
        </ul>
      </Card>

      <Modal open={custom} onClose={() => setCustom(false)} title="Build a report"
        footer={<><Button onClick={() => setCustom(false)}>Cancel</Button><Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={() => { download(kind, fmt); setCustom(false); }}>Generate</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Data">{(id) => <Select id={id} value={kind} onChange={(e) => setKind(e.target.value)}>{library.map((l) => <option key={l.name}>{l.name}</option>)}</Select>}</Field>
          <Field label="Period">{(id) => <Select id={id} value={range} onChange={(e) => setRange(e.target.value)}>{['Today', 'Last 7 days', 'Last 30 days', 'This quarter'].map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
          <Field label="Format">{(id) => <Select id={id} value={fmt} onChange={(e) => setFmt(e.target.value)}>{['CSV', 'PDF'].map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
          <div className="flex items-end pb-2"><Checkbox checked={includeClips} onChange={setIncludeClips} label="Include clip links" sub="Links expire after 7 days" /></div>
        </div>
      </Modal>

      <Modal open={sched} onClose={() => setSched(false)} title="Schedule a report"
        footer={<><Button onClick={() => setSched(false)}>Cancel</Button><Button variant="primary" onClick={() => { if (!sTo.trim()) return toast.error('Add at least one recipient'); setSchedules((xs) => [...xs, { id: `s${Date.now()}`, name: sName, every: sEvery, to: sTo, on: true }]); toast.success('Schedule added'); setSched(false); setSTo(''); }}>Save schedule</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Report">{(id) => <Select id={id} value={sName} onChange={(e) => setSName(e.target.value)}>{library.map((l) => <option key={l.name}>{l.name}</option>)}</Select>}</Field>
          <Field label="Frequency">{(id) => <Select id={id} value={sEvery} onChange={(e) => setSEvery(e.target.value)}>{['Every day at 07:00', 'Every Monday at 08:00', '1st of the month'].map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
          <Field label="Recipients" hint="Separate emails with commas">{(id) => <Input id={id} value={sTo} onChange={(e) => setSTo(e.target.value)} placeholder="chairman@vistaharmoni.my" />}</Field>
        </div>
      </Modal>
    </div>
  );
}
