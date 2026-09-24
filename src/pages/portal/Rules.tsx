import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FlaskConical, Settings2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Checkbox, Chip, Drawer, Field, Input, Segmented, Select, Switch } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { CamFeed } from '@/components/vision';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toast';
import type { Rule, Scene } from '@/data/types';

const GROUPS: Rule['group'][] = ['Access', 'Perimeter', 'Carpark', 'Safety', 'Nuisance', 'Operations'];
const sceneFor: Record<Rule['group'], Scene> = { Access: 'lobby', Perimeter: 'fence', Carpark: 'carpark', Safety: 'pool', Nuisance: 'bin', Operations: 'guardpost' };

export default function Rules() {
  const rules = useStore((s) => s.rules);
  const { toggleRule, updateRule } = useStore.getState();
  const [group, setGroup] = useState<'all' | Rule['group']>('all');
  const [edit, setEdit] = useState<Rule | null>(null);
  const [draft, setDraft] = useState<Rule | null>(null);

  const openEdit = (r: Rule) => { setEdit(r); setDraft({ ...r, actions: { ...r.actions } }); };
  const save = () => {
    if (!draft) return;
    updateRule(draft.id, draft);
    useStore.getState().log({ who: 'Farah Hanim', role: 'Building Manager', action: 'Changed', record: `Rule "${draft.name}" · sensitivity ${draft.sensitivity}, ${draft.schedule}` });
    toast.success('Rule saved', 'Pushed to the edge server. Takes effect in a few seconds.');
    setEdit(null);
  };

  const enabled = rules.filter((r) => r.enabled).length;
  const fired = rules.reduce((n, r) => n + r.firedWeek, 0);
  const falses = rules.reduce((n, r) => n + r.falseWeek, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[['Rules on', `${enabled} of ${rules.length}`, 'Across 48 cameras'], ['Alerts this week', String(fired), 'From all rules'], ['Marked false', `${falses} · ${((falses / Math.max(fired, 1)) * 100).toFixed(1)}%`, 'Used to retrain thresholds'], ['Edge server', '38% GPU', '11 ms per frame']].map(([l, v, n]) => (
          <Card key={l} className="flex flex-col gap-1.5 p-4"><span className="text-[12.5px] font-bold text-muted-dark">{l}</span><span className="text-[26px] font-extrabold tracking-tight">{v}</span><span className="text-xs text-muted">{n}</span></Card>
        ))}
      </div>
      <Segmented label="Rule group" value={group} onChange={setGroup} options={[{ value: 'all', label: 'All' }, ...GROUPS.map((g) => ({ value: g, label: g }))]} />
      {GROUPS.filter((g) => group === 'all' || g === group).map((g) => (
        <Card key={g} className="overflow-hidden">
          <div className="border-b border-line px-4 py-3"><h2 className="h2">{g}</h2></div>
          <ul className="divide-y divide-line-soft">
            {rules.filter((r) => r.group === g).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Switch checked={r.enabled} label={`Turn ${r.name} ${r.enabled ? 'off' : 'on'}`} onChange={() => { toggleRule(r.id); toast.info(`${r.name} ${r.enabled ? 'off' : 'on'}`); }} />
                <button type="button" onClick={() => openEdit(r)} className="flex min-w-0 flex-1 flex-col text-left">
                  <span className={cn('font-semibold', !r.enabled && 'text-muted')}>{r.name}</span>
                  <span className="text-xs text-muted">{r.cameras} cameras · {r.schedule}{r.dwellMin ? ` · after ${r.dwellMin} min` : ''} · sensitivity {r.sensitivity}/10</span>
                </button>
                <div className="hidden gap-1.5 md:flex">
                  {r.actions.talkDown && <Chip tone="purple">Talk-down</Chip>}
                  {r.actions.dispatch && <Chip tone="blue">Dispatch</Chip>}
                  {r.actions.escalate && <Chip tone="red">Escalate</Chip>}
                </div>
                <span className="w-28 text-right text-xs text-muted">{r.firedWeek} this week{r.falseWeek ? ` · ${r.falseWeek} false` : ''}</span>
                <Button size="sm" variant="ghost" icon={<Settings2 className="h-3.5 w-3.5" />} onClick={() => openEdit(r)}>Edit</Button>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      <Drawer open={!!edit} onClose={() => setEdit(null)} title={edit?.name ?? ''} width={480}
        footer={<div className="flex gap-2"><Button icon={<FlaskConical className="h-4 w-4" />} onClick={() => toast.info('Test alert sent', 'Only you and the guardhouse tablet will see it.')}>Send test</Button><Button variant="primary" className="ml-auto" onClick={save}>Save rule</Button></div>}>
        {draft && (
          <div className="flex flex-col gap-4 p-5">
            <CamFeed scene={sceneFor[draft.group]} tone={draft.group === 'Nuisance' ? 'blue' : 'red'} tag={draft.name} cam={`${draft.cameras} cameras`} size="sm" className="rounded-xl" />
            <div className="flex items-center justify-between"><span className="font-semibold">Rule on</span><Switch checked={draft.enabled} label="Rule on" onChange={(v) => setDraft({ ...draft, enabled: v })} /></div>
            <Field label={`Sensitivity · ${draft.sensitivity} of 10`} hint="Higher catches more but raises more false alerts.">
              {(id) => <input id={id} type="range" min={1} max={10} value={draft.sensitivity} onChange={(e) => setDraft({ ...draft, sensitivity: Number(e.target.value) })} className="w-full accent-brand" />}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Schedule">{(id) => <Select id={id} value={draft.schedule} onChange={(e) => setDraft({ ...draft, schedule: e.target.value })}>{['Always', '20:00 to 07:00', '22:00 to 06:00', '07:00 to 22:00', 'Weekdays 09:00 to 18:00'].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
              <Field label="Wait before alerting (min)">{(id) => <Input id={id} type="number" min={0} max={60} value={draft.dwellMin} onChange={(e) => setDraft({ ...draft, dwellMin: Math.max(0, Number(e.target.value)) })} />}</Field>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="label">When it fires</span>
              <Checkbox checked={draft.actions.alertGuard} onChange={(v) => setDraft({ ...draft, actions: { ...draft.actions, alertGuard: v } })} label="Alert the guardhouse tablet" />
              <Checkbox checked={draft.actions.talkDown} onChange={(v) => setDraft({ ...draft, actions: { ...draft.actions, talkDown: v } })} label="Play AI talk-down on the nearest speaker" />
              <Checkbox checked={draft.actions.dispatch} onChange={(v) => setDraft({ ...draft, actions: { ...draft.actions, dispatch: v } })} label="Dispatch the nearest patrolling guard" />
              <Checkbox checked={draft.actions.escalate} onChange={(v) => setDraft({ ...draft, actions: { ...draft.actions, escalate: v } })} label="Escalate to the manager if not acknowledged in 2 min" />
            </div>
            <div className="rounded-xl bg-ice p-3 text-[12.5px] text-muted-dark">Fired {draft.firedWeek} times this week, {draft.falseWeek} marked false by guards. <Link to="/portal/incidents" className="font-bold text-brand">See alerts <ChevronRight className="inline h-3 w-3" /></Link></div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
