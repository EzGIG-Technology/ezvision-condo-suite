import { useState } from 'react';
import { CheckCircle2, FileUp, Hammer, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Chip, Empty, Field, Input, Select, Textarea } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { permitLabel, permitTone } from '@/lib/labels';
import { cn, rm } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';

const SCOPES: [string, number][] = [['Minor works (painting, wardrobe, grilles)', 500], ['Wet works (bathroom, kitchen tiling)', 2000], ['Hacking or structural', 5000], ['Aircond installation', 500]];
const DOCS = ['Floor plan with work marked', 'Contractor SSM registration', 'Public liability insurance', 'Worker IC list'];
const fmt = (d: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

export default function ResidentRenovation() {
  useDocumentTitle('Renovation permit');
  const resident = useStore((s) => s.resident);
  const permits = useStore((s) => s.permits);
  const { createPermit, markDepositPaid } = useStore.getState();
  const mine = permits.filter((p) => p.unit === resident.unit);
  const [form, setForm] = useState(false);
  const [scope, setScope] = useState(SCOPES[0][0]);
  const [details, setDetails] = useState('');
  const [contractor, setContractor] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [workers, setWorkers] = useState([{ name: '', ic: '' }]);
  const [docs, setDocs] = useState<boolean[]>([false, false, false, false]);
  const deposit = SCOPES.find((s) => s[0] === scope)?.[1] ?? 500;

  const submit = () => {
    if (!contractor.trim()) return toast.error('Enter the contractor company');
    if (!start || !end || end < start) return toast.error('Check the dates');
    const ws = workers.filter((w) => w.name.trim());
    if (!ws.length) return toast.error('Add at least one worker');
    if (docs.some((d) => !d)) return toast.error('Upload all 4 documents');
    const id = createPermit({
      kind: 'renovation', unit: resident.unit, owner: resident.name, scope: details || scope.split(' (')[0], contractor, start: fmt(start), end: fmt(end), hours: 'Mon to Sat, 09:00 to 17:30',
      zones: `Tower A · L15 · service lift`, deposit, depositPaid: false,
      workers: ws.map((w, i) => ({ name: w.name, id: `IC ••••${(w.ic || '0000').slice(-4)}`, variant: (i % 8) + 1, enrolled: false })),
      docs: DOCS.map((d) => ({ name: d, ok: true, note: 'Uploaded' })),
    });
    toast.success(`Permit ${id} submitted`, 'Management usually replies within 2 working days.');
    setForm(false); setDetails(''); setContractor(''); setStart(''); setEnd(''); setWorkers([{ name: '', ic: '' }]); setDocs([false, false, false, false]);
  };

  if (form) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-3 p-4">
          <Field label="Type of work">{(id) => <Select id={id} value={scope} onChange={(e) => setScope(e.target.value)}>{SCOPES.map(([s]) => <option key={s}>{s}</option>)}</Select>}</Field>
          <Field label="Describe the work">{(id) => <Textarea id={id} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. Replace kitchen cabinets and re-tile backsplash" className="min-h-[72px]" />}</Field>
          <Field label="Contractor company">{(id) => <Input id={id} value={contractor} onChange={(e) => setContractor(e.target.value)} placeholder="As registered with SSM" />}</Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start">{(id) => <Input id={id} type="date" value={start} onChange={(e) => setStart(e.target.value)} />}</Field>
            <Field label="End">{(id) => <Input id={id} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />}</Field>
          </div>
          <p className="text-xs text-muted">Work hours: Monday to Saturday, 09:00 to 17:30. No work on Sundays and public holidays.</p>
        </Card>
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between"><h2 className="h2">Workers</h2><Button size="sm" variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={() => setWorkers([...workers, { name: '', ic: '' }])}>Add</Button></div>
          {workers.map((w, i) => (
            <div key={i} className="flex items-end gap-2">
              <Field label={`Worker ${i + 1}`} className="flex-1">{(id) => <Input id={id} value={w.name} onChange={(e) => setWorkers(workers.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} placeholder="Name" />}</Field>
              <Field label="IC / passport" className="w-28">{(id) => <Input id={id} value={w.ic} onChange={(e) => setWorkers(workers.map((x, j) => (j === i ? { ...x, ic: e.target.value } : x)))} placeholder="Last 4" />}</Field>
              {workers.length > 1 && <Button aria-label={`Remove worker ${i + 1}`} icon={<Trash2 className="h-4 w-4" />} onClick={() => setWorkers(workers.filter((_, j) => j !== i))} />}
            </div>
          ))}
          <p className="text-xs text-muted">Each worker gets a face-verified pass. They enrol at the guardhouse on day one.</p>
        </Card>
        <Card className="flex flex-col gap-2 p-4">
          <h2 className="h2">Documents</h2>
          {DOCS.map((d, i) => (
            <button key={d} type="button" onClick={() => { setDocs(docs.map((x, j) => (j === i ? true : x))); if (!docs[i]) toast.success('Uploaded', d); }} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left text-[13px]', docs[i] ? 'border-teal bg-teal-soft' : 'border-dashed border-line-strong hover:bg-ice')}>
              {docs[i] ? <CheckCircle2 className="h-5 w-5 text-teal" /> : <FileUp className="h-5 w-5 text-muted" />}
              <span className="flex-1 font-semibold">{d}</span>
              <span className="text-xs text-muted">{docs[i] ? 'Uploaded' : 'Tap to upload'}</span>
            </button>
          ))}
        </Card>
        <Card className="flex items-center justify-between p-4"><span className="text-[13.5px] font-semibold">Refundable deposit</span><span className="text-lg font-extrabold">{rm(deposit)}</span></Card>
        <div className="flex gap-2"><Button size="lg" onClick={() => setForm(false)}>Cancel</Button><Button size="lg" variant="primary" className="flex-1" onClick={submit}>Submit application</Button></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {mine.map((p) => (
        <Card key={p.id} className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2"><div><p className="font-mono text-xs text-muted">{p.id}</p><p className="font-bold">{p.scope}</p><p className="text-xs text-muted">{p.contractor} · {p.start} to {p.end}</p></div><Chip tone={permitTone[p.status]}>{permitLabel[p.status]}</Chip></div>
          <ol className="flex items-center gap-1.5 text-[11px] font-semibold">
            {['Submitted', 'Reviewed', 'Deposit', 'Active'].map((s, i) => {
              const lvl = p.status === 'review' || p.status === 'changes_requested' ? 1 : p.status === 'awaiting_deposit' ? 2 : p.status === 'rejected' ? 1 : 4;
              return <li key={s} className="flex flex-1 flex-col gap-1"><span className={cn('h-1.5 rounded-full', i < lvl ? 'bg-teal' : 'bg-line-strong')} /><span className={i < lvl ? 'text-teal-dark' : 'text-muted'}>{s}</span></li>;
            })}
          </ol>
          {p.status === 'changes_requested' && <p className="rounded-xl bg-warn-soft p-3 text-xs text-warn-ink">Management asked for changes. Check the insurance expiry date and resubmit.</p>}
          {!p.depositPaid && (p.status === 'awaiting_deposit' || p.status === 'review') && <Button size="sm" variant="primary" className="self-start" onClick={() => { markDepositPaid(p.id); toast.success(`Deposit ${rm(p.deposit)} paid`, 'By FPX. Receipt in Fees and billing.'); }}>Pay deposit {rm(p.deposit)}</Button>}
          <p className="text-xs text-muted">{p.workers.length} worker{p.workers.length > 1 ? 's' : ''} · {p.hours}</p>
        </Card>
      ))}
      {!mine.length && <Card><Empty icon={<Hammer className="h-5 w-5" />} title="No renovation permits" body="Apply before any work starts. Workers without a permit are stopped at the gate." /></Card>}
      <Button variant="primary" size="lg" block icon={<Plus className="h-4 w-4" />} onClick={() => setForm(true)}>Apply for a permit</Button>
    </div>
  );
}
