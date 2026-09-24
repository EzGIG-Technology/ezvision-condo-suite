import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, MessageSquare, Radio, RotateCcw, Star } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Avatar, Card, CardHeader, Chip, Field, Modal, Progress, Segmented, Select, Textarea, type ChipTone } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { LineChart } from '@/components/charts';
import { cn, downloadFile, hhmm, relative, todayStamp, toCsv } from '@/lib/utils';
import { toast } from '@/store/toast';
import type { Guard } from '@/data/types';

const stateTone: Record<Guard['state'], ChipTone> = { 'At post': 'teal', Patrolling: 'blue', Responding: 'red', 'Off duty': 'grey', 'On break': 'amber' };
const ratingTone: Record<Guard['rating'], ChipTone> = { Excellent: 'teal', Good: 'blue', 'Needs coaching': 'amber' };
const cpTone = { done: 'bg-teal', late: 'bg-warn', missed: 'bg-danger-dot', next: 'bg-brand animate-pulse2', todo: 'bg-[#D6DEEE]' } as const;

const RESPONSE = [58, 55, 61, 49, 52, 47, 50, 44, 46, 41, 43, 39, 42, 38];
const DAYS = Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 13 + i); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }); });

// Round history (3 earlier rounds tonight) — each row is a checkpoint, each column a round
const HISTORY: ('done' | 'late' | 'missed')[][] = [
  ['done', 'done', 'done'], ['done', 'done', 'late'], ['done', 'late', 'done'], ['done', 'done', 'done'], ['done', 'done', 'done'], ['late', 'done', 'done'],
  ['done', 'done', 'done'], ['done', 'missed', 'done'], ['done', 'done', 'done'], ['done', 'done', 'late'], ['done', 'done', 'done'], ['done', 'done', 'done'],
];

export default function Guards() {
  const guards = useStore((s) => s.guards);
  const checkpoints = useStore((s) => s.checkpoints);
  const patrolStartedAt = useStore((s) => s.patrolStartedAt);
  const { setGuardState, startNewRound } = useStore.getState();
  const [shift, setShift] = useState<'all' | Guard['shift']>('all');
  const [msg, setMsg] = useState<Guard | null>(null);
  const [text, setText] = useState('');
  const [coach, setCoach] = useState<Guard | null>(null);
  const [topic, setTopic] = useState('Response time');

  const list = guards.filter((g) => shift === 'all' || g.shift === shift);
  const done = checkpoints.filter((c) => c.status === 'done' || c.status === 'late').length;

  const exportCsv = () => {
    downloadFile(`guard-scorecard-${todayStamp()}.csv`, toCsv([['Guard', 'Shift', 'Alerts closed (30d)', 'Avg response', 'Patrol completion', 'Guardhouse unattended', 'Talk-downs', 'Rating'], ...guards.map((g) => [g.name, g.shift, g.alertsClosed, g.avgResponse, `${g.patrolPct}%`, g.unattended, g.talkDowns, g.rating])]));
    toast.success('Scorecard exported');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['Avg response, 30 days', '0:44', 'Target under 1:00', 'text-teal-dark'],
          ['Patrol completion', '95%', '1 checkpoint missed this week', ''],
          ['Guardhouse unattended', '2', 'Both under 7 minutes', 'text-warn-ink'],
          ['On duty now', String(guards.filter((g) => g.state !== 'Off duty').length), 'Night shift · 19:00 to 07:00', ''],
        ].map(([l, v, n, c]) => (
          <Card key={l} className="flex flex-col gap-1.5 p-4"><span className="text-[12.5px] font-bold text-muted-dark">{l}</span><span className={cn('text-[26px] font-extrabold tracking-tight', c)}>{v}</span><span className="text-xs text-muted">{n}</span></Card>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="p-4">
          <CardHeader title="Alert response time" sub="Median seconds from alert to a guard acknowledging it, last 14 days" />
          <div className="mt-3"><LineChart ariaLabel="Response time trend" values={RESPONSE} labels={DAYS} max={80} target={60} format={(v) => `0:${String(Math.round(v)).padStart(2, '0')}`} tipLabel={(i) => `${DAYS[i]} · 0:${RESPONSE[i]}`} labelIdx={[0, 4, 8, 13]} /></div>
          <p className="mt-2 text-xs text-muted"><span className="mr-1 inline-block h-0.5 w-4 bg-danger align-middle" /> Target 1:00 set by the JMB.</p>
        </Card>
        <Card className="p-4">
          <CardHeader title="On duty now" action={<Link to="/portal/live" className="text-[12.5px] font-bold text-brand">Live view</Link>} />
          <ul className="mt-3 flex flex-col gap-2">
            {guards.filter((g) => g.state !== 'Off duty').map((g) => (
              <li key={g.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                <Avatar name={g.name} color={g.color} size={36} />
                <div className="min-w-0 flex-1"><p className="font-semibold">{g.name}</p><p className="truncate text-xs text-muted">{g.where}</p></div>
                <Chip tone={stateTone[g.state]}>{g.state}</Chip>
                <button type="button" aria-label={`Radio ${g.name}`} onClick={() => toast.info(`Calling ${g.name} on radio`, 'Channel 2 · push-to-talk open')} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-ice"><Radio className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div><h2 className="h2">Scorecard</h2><p className="sub">Last 30 days, measured by the cameras, not self-reported</p></div>
          <div className="flex flex-wrap gap-2">
            <Segmented label="Shift" value={shift} onChange={setShift} options={[{ value: 'all', label: 'All' }, { value: 'Night', label: 'Night' }, { value: 'Day', label: 'Day' }, { value: 'Evening', label: 'Evening' }]} />
            <Button size="sm" icon={<Download className="h-4 w-4" />} onClick={exportCsv}>Export</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[900px]">
            <thead><tr><th>Guard</th><th>Status</th><th>Alerts closed</th><th>Avg response</th><th>Patrol</th><th>Unattended</th><th>Talk-downs</th><th>Rating</th><th /></tr></thead>
            <tbody>
              {list.map((g) => (
                <tr key={g.id}>
                  <td><div className="flex items-center gap-2.5 whitespace-nowrap"><Avatar name={g.name} color={g.color} size={30} /><div><p className="font-semibold">{g.name}</p><p className="text-xs text-muted">{g.shift} shift</p></div></div></td>
                  <td>
                    <Select aria-label={`Status for ${g.name}`} value={g.state} onChange={(e) => { setGuardState(g.id, e.target.value as Guard['state']); toast.info(`${g.name} set to ${e.target.value}`); }} className="h-8 w-[132px] text-xs">
                      {(['At post', 'Patrolling', 'Responding', 'On break', 'Off duty'] as const).map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  </td>
                  <td className="font-semibold">{g.alertsClosed}</td>
                  <td className={cn('font-mono font-semibold', g.avgResponse > '1:00' && 'text-warn-ink')}>{g.avgResponse}</td>
                  <td><div className="flex w-28 items-center gap-2"><Progress value={g.patrolPct} h={6} color={g.patrolPct < 90 ? '#F59E0B' : '#14A38F'} label={`${g.name} patrol`} /><span className="text-xs font-semibold">{g.patrolPct}%</span></div></td>
                  <td className={cn(g.unattended !== '0' && 'text-warn-ink')}>{g.unattended}</td>
                  <td>{g.talkDowns}</td>
                  <td><Chip tone={ratingTone[g.rating]}>{g.rating}</Chip></td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" aria-label={`Message ${g.name}`} title="Message" icon={<MessageSquare className="h-4 w-4" />} onClick={() => setMsg(g)} />
                      <Button size="sm" variant="ghost" aria-label={`Coaching note for ${g.name}`} title="Coaching note" icon={<Star className="h-4 w-4" />} onClick={() => setCoach(g)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div><h2 className="h2">Patrol matrix, tonight</h2><p className="sub">Each checkpoint is verified by a camera seeing the guard there. Current round started {relative(patrolStartedAt)} · {done} of {checkpoints.length} done.</p></div>
          <Button size="sm" icon={<RotateCcw className="h-4 w-4" />} onClick={() => { startNewRound(); toast.success('New patrol round started', 'The guard tablet shows checkpoint 1 as next.'); }}>Start new round</Button>
        </div>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead><tr className="text-left text-[11px] font-bold uppercase tracking-[0.08em] text-muted"><th className="py-2">Checkpoint</th><th className="py-2">Camera</th>{['19:00', '21:00', '23:00', 'Current'].map((h) => <th key={h} className="py-2 text-center">{h}</th>)}</tr></thead>
            <tbody>
              {checkpoints.map((c, i) => (
                <tr key={c.id} className="border-t border-line-soft">
                  <td className="py-2 font-semibold">{c.name}</td>
                  <td className="py-2 text-muted">{c.camera}</td>
                  {HISTORY[i].map((s, j) => <td key={j} className="py-2 text-center"><span title={s} className={cn('inline-block h-3.5 w-3.5 rounded-full', cpTone[s])} /></td>)}
                  <td className="py-2 text-center"><span className="inline-flex items-center gap-1.5"><span className={cn('inline-block h-3.5 w-3.5 rounded-full', cpTone[c.status])} /><span className="text-xs text-muted">{c.at ? hhmm(c.at) : c.status === 'next' ? 'Next' : ''}</span></span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
            {(['done', 'late', 'missed', 'next', 'todo'] as const).map((k) => <span key={k} className="flex items-center gap-1.5"><span className={cn('h-3 w-3 rounded-full', cpTone[k])} />{k === 'todo' ? 'Not yet' : k[0].toUpperCase() + k.slice(1)}</span>)}
          </div>
        </div>
      </Card>

      <Modal open={!!msg} onClose={() => setMsg(null)} title={`Message ${msg?.name ?? ''}`} description="Shows as a banner on the guard tablet."
        footer={<><Button onClick={() => setMsg(null)}>Cancel</Button><Button variant="primary" onClick={() => { if (!text.trim()) return toast.error('Write a message'); toast.success(`Sent to ${msg?.name}`); setMsg(null); setText(''); }}>Send</Button></>}>
        <Field label="Message">{(id) => <Textarea id={id} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Please check the B2 ramp on your next round." />}</Field>
      </Modal>

      <Modal open={!!coach} onClose={() => setCoach(null)} title={`Coaching note for ${coach?.name ?? ''}`} description="Saved to the guard's file and shared with the security company supervisor."
        footer={<><Button onClick={() => setCoach(null)}>Cancel</Button><Button variant="primary" onClick={() => { toast.success('Coaching note saved', `${topic} · shared with Securiforce supervisor`); setCoach(null); }}>Save note</Button></>}>
        <div className="flex flex-col gap-3">
          <Field label="Topic">{(id) => <Select id={id} value={topic} onChange={(e) => setTopic(e.target.value)}>{['Response time', 'Patrol completion', 'Guardhouse unattended', 'Visitor verification', 'Commendation'].map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
          <Field label="Note">{(id) => <Textarea id={id} placeholder="What went well, what to improve" />}</Field>
        </div>
      </Modal>
    </div>
  );
}
