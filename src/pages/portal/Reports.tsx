import { useState } from 'react';
import { CalendarClock, Download, FileBarChart, FileText, Mail, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, Checkbox, Chip, Field, Input, Modal, Select, Switch } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { BarChart } from '@/components/charts';
import { exportReport, type ExportFormat } from '@/lib/export';
import { pilotMetrics, REPORTS } from '@/lib/reports';
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
  const [fmt, setFmt] = useState('PDF');
  const [sName, setSName] = useState('Daily security summary');
  const [sEvery, setSEvery] = useState('Every day at 07:00');
  const [sTo, setSTo] = useState('');
  const [includeClips, setIncludeClips] = useState(false);

  const [busy, setBusy] = useState<string | null>(null);
  const pilot = pilotMetrics(state());

  const download = async (name: string, format: ExportFormat = 'CSV') => {
    const def = REPORTS.find((r) => r.name === name);
    if (!def) return;
    setBusy(`${name}:${format}`);
    try {
      await exportReport({ title: name, ...def.build(state()) }, format);
      state().log({ who: state().session.portal?.name ?? 'Farah Hanim', role: state().session.portal?.role ?? 'Building Manager', action: 'Exported', record: `${name} report (${format})` });
      toast.success(`${name} downloaded`, `${format} file`);
    } catch {
      toast.error('Export failed', 'Try again, or pick another format.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card className="p-4">
          <CardHeader title="Alerts this week vs last week" sub="All severities · solid bars this week, dashed line last week" action={<Button size="sm" icon={<Download className="h-4 w-4" />} loading={busy === 'Weekly JMB pack:PDF'} onClick={() => download('Weekly JMB pack', 'PDF')}>Weekly pack (PDF)</Button>} />
          <div className="mt-3"><BarChart ariaLabel="Alerts per day" values={WEEK} compare={WEEK_PREV} labels={WEEK_L} highlightLast tipLabel={(i) => `${WEEK_L[i]}: ${WEEK[i]} alerts (last week ${WEEK_PREV[i]})`} /></div>
        </Card>
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="h2">Custom report</h2>
          <p className="sub">Pick the data and the period. Exports are logged for PDPA.</p>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCustom(true)}>Build a report</Button>
          <div className="mt-1 grid grid-cols-2 gap-3 text-[13px]">
            <div className="rounded-xl bg-ice p-3"><p className="text-xs text-muted">Unregistered entries</p><p className="text-xl font-extrabold">{pilot[1].value}</p><p className="text-xs text-muted-dark">{pilot[1].detail}</p></div>
            <div className="rounded-xl bg-ice p-3"><p className="text-xs text-muted">False alerts</p><p className="text-xl font-extrabold">{pilot[3].value}</p><p className="text-xs text-muted-dark">Target {pilot[3].target}</p></div>
          </div>
        </Card>
      </div>

      <Card className="flex flex-col gap-3 p-4">
        <CardHeader title="Pilot success metrics" sub="The measures agreed for the pilot review, from live data" action={<Button size="sm" icon={<Download className="h-4 w-4" />} loading={busy === 'Pilot success metrics:PDF'} onClick={() => download('Pilot success metrics', 'PDF')}>Pilot report (PDF)</Button>} />
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {pilot.map((m) => (
            <li key={m.metric} className="flex flex-col gap-1 rounded-xl bg-ice p-3">
              <span className="text-xs font-bold text-muted-dark">{m.metric}</span>
              <span className="text-xl font-extrabold">{m.value}</span>
              <span className="text-[11.5px] text-muted">{m.detail}</span>
              <span className="mt-auto pt-1"><Chip tone={m.ok ? 'teal' : 'amber'}>Target {m.target}{m.ok ? ' · met' : ''}</Chip></span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4"><CardHeader title="Report library" sub="Ready-made reports from live data. Every report exports to PDF, Excel and CSV." /></div>
        <ul className="grid gap-3 px-4 pb-4 md:grid-cols-2">
          {REPORTS.map((r) => (
            <li key={r.name} className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-start">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">{/scorecard|pack|metrics/i.test(r.name) ? <FileBarChart className="h-5 w-5" /> : <FileText className="h-5 w-5" />}</span>
              <div className="min-w-0 flex-1"><p className="font-bold">{r.name}</p><p className="text-[12.5px] text-muted">{r.desc}</p><p className="mt-1 text-[11.5px] text-muted-dark">{r.frequency} · {r.audience}</p></div>
              <div className="flex shrink-0 gap-1.5">
                {(['PDF', 'Excel', 'CSV'] as const).map((f) => <Button key={f} size="sm" loading={busy === `${r.name}:${f}`} onClick={() => download(r.name, f)} aria-label={`Download ${r.name} as ${f}`}>{f}</Button>)}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4"><CardHeader title="Scheduled reports" sub="Sent by email as PDF and Excel" action={<Button size="sm" icon={<CalendarClock className="h-4 w-4" />} onClick={() => setSched(true)}>Add schedule</Button>} /></div>
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
        footer={<><Button onClick={() => setCustom(false)}>Cancel</Button><Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={() => { download(kind, fmt as ExportFormat); setCustom(false); }}>Generate</Button></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Data">{(id) => <Select id={id} value={kind} onChange={(e) => setKind(e.target.value)}>{REPORTS.map((l) => <option key={l.name}>{l.name}</option>)}</Select>}</Field>
          <Field label="Period">{(id) => <Select id={id} value={range} onChange={(e) => setRange(e.target.value)}>{['Today', 'Last 7 days', 'Last 30 days', 'This quarter'].map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
          <Field label="Format">{(id) => <Select id={id} value={fmt} onChange={(e) => setFmt(e.target.value)}>{['PDF', 'Excel', 'CSV'].map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
          <div className="flex items-end pb-2"><Checkbox checked={includeClips} onChange={setIncludeClips} label="Include clip links" sub="Links expire after 7 days" /></div>
        </div>
      </Modal>

      <Modal open={sched} onClose={() => setSched(false)} title="Schedule a report"
        footer={<><Button onClick={() => setSched(false)}>Cancel</Button><Button variant="primary" onClick={() => { if (!sTo.trim()) return toast.error('Add at least one recipient'); setSchedules((xs) => [...xs, { id: `s${Date.now()}`, name: sName, every: sEvery, to: sTo, on: true }]); toast.success('Schedule added'); setSched(false); setSTo(''); }}>Save schedule</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Report">{(id) => <Select id={id} value={sName} onChange={(e) => setSName(e.target.value)}>{REPORTS.map((l) => <option key={l.name}>{l.name}</option>)}</Select>}</Field>
          <Field label="Frequency">{(id) => <Select id={id} value={sEvery} onChange={(e) => setSEvery(e.target.value)}>{['Every day at 07:00', 'Every Monday at 08:00', '1st of the month'].map((l) => <option key={l}>{l}</option>)}</Select>}</Field>
          <Field label="Recipients" hint="Separate emails with commas">{(id) => <Input id={id} value={sTo} onChange={(e) => setSTo(e.target.value)} placeholder="chairman@vistaharmoni.my" />}</Field>
        </div>
      </Modal>
    </div>
  );
}
