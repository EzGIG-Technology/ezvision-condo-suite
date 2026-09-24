import { useState } from 'react';
import { CheckCircle2, Vote } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Chip, Confirm, Empty, Progress } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { dateLong } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import type { Resolution, VoteChoice } from '@/data/types';

const CHOICES: [VoteChoice, string, string][] = [['yes', 'For', '#14A38F'], ['no', 'Against', '#E5484D'], ['abstain', 'Abstain', '#9FB0DB']];

export default function ResidentVote() {
  useDocumentTitle('AGM and e-voting');
  const resident = useStore((s) => s.resident);
  const resolutions = useStore((s) => s.resolutions);
  const units = useStore((s) => s.units);
  const castVote = useStore((s) => s.castVote);
  const [pick, setPick] = useState<{ r: Resolution; choice: VoteChoice } | null>(null);
  const u = units.find((x) => x.unit === resident.unit);
  const tenant = u?.tag === 'Tenant';
  const open = resolutions.filter((r) => r.status === 'open');
  const past = resolutions.filter((r) => r.status !== 'open');

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-xl bg-ice p-3 text-xs text-muted-dark">
        One vote per unit, weighted by share units.{tenant && u ? ` You vote as proxy for the owner, ${u.owner}. The proxy form is on file with the management office.` : ''}
      </p>
      {open.map((r) => {
        const mine = r.voted[resident.unit];
        return (
          <Card key={r.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div><Chip tone="teal" dot>Open until {dateLong(r.closes)}</Chip><h2 className="mt-2 font-extrabold">{r.title}</h2><p className="text-xs text-muted">{r.detail} · {r.meeting}</p></div>
              <Vote className="h-5 w-5 shrink-0 text-muted" />
            </div>
            {mine ? (
              <p className="flex items-center gap-2 rounded-xl bg-teal-soft p-3 text-[13px] font-semibold text-teal-dark"><CheckCircle2 className="h-5 w-5" />You voted {CHOICES.find((c) => c[0] === mine.choice)?.[1].toLowerCase()}. Results are shown when voting closes.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {CHOICES.map(([k, l]) => <Button key={k} size="lg" variant={k === 'yes' ? 'teal' : k === 'no' ? 'danger' : 'secondary'} onClick={() => setPick({ r, choice: k })}>{l}</Button>)}
              </div>
            )}
          </Card>
        );
      })}
      {!open.length && <Card><Empty icon={<Vote className="h-5 w-5" />} title="No open votes" body="You'll get a notice when the committee opens a vote." /></Card>}

      {past.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="eyebrow">Past results</h2>
          {past.map((r) => {
            const total = r.votes.yes + r.votes.no + r.votes.abstain;
            return (
              <Card key={r.id} className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2"><div><p className="font-bold">{r.title}</p><p className="text-xs text-muted">{r.meeting}</p></div><Chip tone={r.status === 'passed' ? 'teal' : 'red'}>{r.status === 'passed' ? 'Passed' : 'Not passed'}</Chip></div>
                {CHOICES.map(([k, l, c]) => (
                  <div key={k} className="flex items-center gap-2 text-xs"><span className="w-14 text-muted">{l}</span><div className="flex-1"><Progress value={total ? (r.votes[k] / total) * 100 : 0} color={c} h={6} label={l} /></div><span className="w-10 text-right font-semibold">{total ? Math.round((r.votes[k] / total) * 100) : 0}%</span></div>
                ))}
              </Card>
            );
          })}
        </section>
      )}

      <Confirm open={!!pick} onClose={() => setPick(null)} title={`Vote ${pick ? CHOICES.find((c) => c[0] === pick.choice)?.[1].toLowerCase() : ''}?`} confirmLabel="Submit vote"
        body={pick ? `${pick.r.title}. You cannot change your vote after submitting.` : ''}
        onConfirm={() => {
          if (!pick) return;
          const ok = castVote(pick.r.id, resident.unit, pick.choice, resident.name, false);
          if (ok) toast.success('Vote recorded', 'Thank you. A receipt was emailed to you.');
          else toast.error('Your unit has already voted');
        }} />
    </div>
  );
}
