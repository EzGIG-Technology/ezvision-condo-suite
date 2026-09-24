import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, FlaskConical, Plus, Settings2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Checkbox, Chip, Drawer, Field, Input, Segmented, Select, Switch, type ChipTone } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { CamFeed } from '@/components/vision';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toast';
import type { Rule, RuleGroup, Scene } from '@/data/types';

const GROUPS: RuleGroup[] = ['Access', 'Perimeter', 'Carpark', 'Safety', 'Fire', 'Nuisance', 'Contractors', 'Operations', 'Audio'];
const GROUP_LABEL: Record<RuleGroup, string> = {
  Access: 'Unauthorised entry', Perimeter: 'Perimeter and access', Carpark: 'Carpark and vehicles', Safety: 'Resident and people safety', Fire: 'Fire and hazard',
  Nuisance: 'Nuisance and property', Contractors: 'Contractors and deliveries', Operations: 'Guard accountability and system health', Audio: 'Audio detection',
};
const sceneFor: Record<RuleGroup, Scene> = { Access: 'lobby', Perimeter: 'fence', Carpark: 'carpark', Safety: 'pool', Fire: 'carpark', Nuisance: 'bin', Contractors: 'corridor', Operations: 'guardpost', Audio: 'lobby' };
const TIER_TONE: Record<NonNullable<Rule['tier']>, ChipTone> = { Core: 'grey', Secure: 'blue', Premium: 'purple' };
const SCHEDULES = ['Always', '20:00 to 07:00', '22:00 to 06:00', '23:00 to 07:00', '07:00 to 22:00', 'Weekdays 09:00 to 18:00', 'Outside permit hours'];
const ZONES = ['All cameras', 'Main gate ANPR lanes', 'Gates, lobbies and turnstiles', 'Side and back gates', 'Fence line and boundary walls', 'Basement carpark', 'Pool deck', 'Facility deck', 'Lift lobbies', 'Lift cars', 'Bin centre, loading bay and corridors', 'Parcel room', 'Cameras with microphones'];
/** Extra conditions for compound rules. The rule alerts only when all ticked conditions are true. */
const CONDITIONS = ['After midnight (00:00 to 06:00)', 'Person is not a resident', 'Vehicle is not registered', 'No visitor expected for this unit', 'Facility is closed', 'More than 10 people', 'Resident has not allowed unit delivery'];

const blank = (): Omit<Rule, 'id' | 'firedWeek' | 'falseWeek'> => ({
  group: 'Perimeter', name: '', cameras: 4, schedule: 'Always', enabled: true, sensitivity: 7, dwellMin: 0, zone: ZONES[0], tier: 'Secure', conditions: [], custom: true,
  actions: { talkDown: false, alertGuard: true, dispatch: false, escalate: false },
});

export default function Rules() {
  const rules = useStore((s) => s.rules);
  const session = useStore((s) => s.session.portal);
  const { toggleRule, updateRule, createRule, log } = useStore.getState();
  const who = session?.name ?? 'Farah Hanim';
  const [group, setGroup] = useState<'all' | RuleGroup>('all');
  const [edit, setEdit] = useState<Rule | 'new' | null>(null);
  const [draft, setDraft] = useState<Omit<Rule, 'id' | 'firedWeek' | 'falseWeek'> & Partial<Pick<Rule, 'id' | 'firedWeek' | 'falseWeek'>> | null>(null);

  const openEdit = (r: Rule) => { setEdit(r); setDraft({ ...r, actions: { ...r.actions }, conditions: [...(r.conditions ?? [])] }); };
  const openNew = () => { setEdit('new'); setDraft(blank()); };
  const save = () => {
    if (!draft) return;
    if (!draft.name.trim()) return toast.error('Name the rule', 'For example: Person on the roof at night.');
    if (edit === 'new') {
      createRule({ ...draft, name: draft.name.trim() });
      log({ who, role: 'Building Manager', action: 'Added', record: `Rule "${draft.name.trim()}"` });
      toast.success('Rule created', 'Pushed to the edge server. Takes effect in a few seconds.');
    } else if (draft.id) {
      updateRule(draft.id, draft);
      log({ who, role: 'Building Manager', action: 'Changed', record: `Rule "${draft.name}" · sensitivity ${draft.sensitivity}, ${draft.schedule}${draft.conditions?.length ? `, only when ${draft.conditions.join(' and ')}` : ''}` });
      toast.success('Rule saved', 'Pushed to the edge server. Takes effect in a few seconds.');
    }
    setEdit(null);
  };
  const toggleCondition = (c: string, on: boolean) => draft && setDraft({ ...draft, conditions: on ? [...(draft.conditions ?? []), c] : (draft.conditions ?? []).filter((x) => x !== c) });

  const enabled = rules.filter((r) => r.enabled).length;
  const fired = rules.reduce((n, r) => n + r.firedWeek, 0);
  const falses = rules.reduce((n, r) => n + r.falseWeek, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[['Rules on', `${enabled} of ${rules.length}`, `${GROUPS.length} categories across 48 cameras`], ['Alerts this week', String(fired), 'From all rules'], ['Marked false', `${falses} · ${((falses / Math.max(fired, 1)) * 100).toFixed(1)}%`, 'Used to retrain thresholds'], ['Edge server', '38% GPU', '11 ms per frame']].map(([l, v, n]) => (
          <Card key={l} className="flex flex-col gap-1.5 p-4"><span className="text-[12.5px] font-bold text-muted-dark">{l}</span><span className="text-[26px] font-extrabold tracking-tight">{v}</span><span className="text-xs text-muted">{n}</span></Card>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Segmented label="Rule group" className="min-w-0 flex-1" value={group} onChange={setGroup} options={[{ value: 'all', label: 'All' }, ...GROUPS.map((g) => ({ value: g, label: g === 'Access' ? 'Entry' : g }))]} />
        <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={openNew}>New rule</Button>
      </div>
      {GROUPS.filter((g) => group === 'all' || g === group).map((g) => (
        <Card key={g} className="overflow-hidden">
          <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3"><h2 className="h2">{GROUP_LABEL[g]}</h2><span className="text-xs text-muted">{rules.filter((r) => r.group === g && r.enabled).length} of {rules.filter((r) => r.group === g).length} on</span></div>
          <ul className="divide-y divide-line-soft">
            {rules.filter((r) => r.group === g).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Switch checked={r.enabled} label={`Turn ${r.name} ${r.enabled ? 'off' : 'on'}`} onChange={() => { toggleRule(r.id); toast.info(`${r.name} ${r.enabled ? 'off' : 'on'}`); }} />
                <button type="button" onClick={() => openEdit(r)} className="flex min-w-0 flex-1 flex-col text-left">
                  <span className={cn('font-semibold', !r.enabled && 'text-muted')}>{r.name}</span>
                  <span className="text-xs text-muted">{r.zone ?? `${r.cameras} cameras`} · {r.schedule}{r.dwellMin ? ` · after ${r.dwellMin} min` : ''} · sensitivity {r.sensitivity}/10</span>
                  {!!r.conditions?.length && <span className="text-xs text-brand-ink">Only when {r.conditions.join(' and ').toLowerCase()}</span>}
                </button>
                <div className="hidden gap-1.5 md:flex">
                  {r.tier && <Chip tone={TIER_TONE[r.tier]}>{r.tier}</Chip>}
                  {!!r.conditions?.length && <Chip tone="blue">Compound</Chip>}
                  {r.custom && <Chip tone="teal">Custom</Chip>}
                  {r.actions.talkDown && <Chip tone="purple">Talk-down</Chip>}
                  {r.actions.escalate && <Chip tone="red">Escalate</Chip>}
                </div>
                <span className="w-28 text-right text-xs text-muted">{r.firedWeek} this week{r.falseWeek ? ` · ${r.falseWeek} false` : ''}</span>
                <Button size="sm" variant="ghost" icon={<Settings2 className="h-3.5 w-3.5" />} onClick={() => openEdit(r)}>Edit</Button>
              </li>
            ))}
            {!rules.some((r) => r.group === g) && <li className="px-4 py-3 text-sm text-muted">No rules in this group.</li>}
          </ul>
        </Card>
      ))}

      <Drawer open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'New rule' : edit?.name ?? ''} width={480}
        footer={<div className="flex gap-2"><Button icon={<FlaskConical className="h-4 w-4" />} onClick={() => toast.info('Test alert sent', 'Only you and the guardhouse tablet will see it.')}>Send test</Button><Button variant="primary" className="ml-auto" onClick={save}>{edit === 'new' ? 'Create rule' : 'Save rule'}</Button></div>}>
        {draft && (
          <div className="flex flex-col gap-4 p-5">
            <CamFeed scene={sceneFor[draft.group]} tone={draft.group === 'Nuisance' ? 'blue' : 'red'} tag={draft.name || 'New rule'} cam={draft.zone ?? `${draft.cameras} cameras`} size="sm" className="rounded-xl" />
            {edit === 'new' && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Rule name" className="col-span-2">{(id) => <Input id={id} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Person on the roof at night" />}</Field>
                <Field label="Category">{(id) => <Select id={id} value={draft.group} onChange={(e) => setDraft({ ...draft, group: e.target.value as RuleGroup })}>{GROUPS.map((g) => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}</Select>}</Field>
                <Field label="Cameras">{(id) => <Input id={id} type="number" min={1} max={48} value={draft.cameras} onChange={(e) => setDraft({ ...draft, cameras: Math.min(48, Math.max(1, Number(e.target.value))) })} />}</Field>
              </div>
            )}
            <div className="flex items-center justify-between"><span className="font-semibold">Rule on</span><Switch checked={draft.enabled} label="Rule on" onChange={(v) => setDraft({ ...draft, enabled: v })} /></div>
            <Field label={`Sensitivity · ${draft.sensitivity} of 10`} hint="Higher catches more but raises more false alerts.">
              {(id) => <input id={id} type="range" min={1} max={10} value={draft.sensitivity} onChange={(e) => setDraft({ ...draft, sensitivity: Number(e.target.value) })} className="w-full accent-brand" />}
            </Field>
            <Field label="Zone">{(id) => <Select id={id} value={draft.zone ?? ZONES[0]} onChange={(e) => setDraft({ ...draft, zone: e.target.value })}>{[...new Set([draft.zone ?? ZONES[0], ...ZONES])].map((z) => <option key={z}>{z}</option>)}</Select>}</Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Schedule">{(id) => <Select id={id} value={draft.schedule} onChange={(e) => setDraft({ ...draft, schedule: e.target.value })}>{[...new Set([draft.schedule, ...SCHEDULES])].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
              <Field label="Wait before alerting (min)">{(id) => <Input id={id} type="number" min={0} max={60} value={draft.dwellMin} onChange={(e) => setDraft({ ...draft, dwellMin: Math.max(0, Number(e.target.value)) })} />}</Field>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="label">Only alert when all of these are also true</span>
              {CONDITIONS.map((c) => <Checkbox key={c} checked={!!draft.conditions?.includes(c)} onChange={(v) => toggleCondition(c, v)} label={c} />)}
              <p className="text-[11.5px] text-muted">Compound rules cut false alerts. Leave all unticked to alert on every detection.</p>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="label">When it fires</span>
              <Checkbox checked={draft.actions.alertGuard} onChange={(v) => setDraft({ ...draft, actions: { ...draft.actions, alertGuard: v } })} label="Alert the guardhouse tablet" />
              <Checkbox checked={draft.actions.talkDown} onChange={(v) => setDraft({ ...draft, actions: { ...draft.actions, talkDown: v } })} label="Play AI talk-down on the nearest speaker" />
              <Checkbox checked={draft.actions.dispatch} onChange={(v) => setDraft({ ...draft, actions: { ...draft.actions, dispatch: v } })} label="Dispatch the nearest patrolling guard" />
              <Checkbox checked={draft.actions.escalate} onChange={(v) => setDraft({ ...draft, actions: { ...draft.actions, escalate: v } })} label="Escalate to the manager if not acknowledged in 2 min" />
            </div>
            {edit !== 'new' && <div className="rounded-xl bg-ice p-3 text-[12.5px] text-muted-dark">Fired {draft.firedWeek} times this week, {draft.falseWeek} marked false by guards. <Link to="/portal/incidents" className="font-bold text-brand">See alerts <ChevronRight className="inline h-3 w-3" /></Link></div>}
          </div>
        )}
      </Drawer>
    </div>
  );
}
