import { useState } from 'react';
import { CheckCircle2, Download, FileText, Lock, Search, ShieldCheck } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, CardHeader, Chip, Input, Segmented, Select, type ChipTone } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { downloadFile, todayStamp, toCsv, when } from '@/lib/utils';
import { toast } from '@/store/toast';
import type { AuditEntry, DataRequest } from '@/data/types';

const reqTone: Record<DataRequest['state'], ChipTone> = { New: 'blue', 'In progress': 'amber', Done: 'teal' };
const actTone: Record<AuditEntry['action'], ChipTone> = { Viewed: 'grey', Exported: 'amber', Added: 'blue', Deleted: 'red', Changed: 'purple', Approved: 'teal', Closed: 'teal', Sent: 'blue' };

const SIGNAGE = `CCTV AND AI VIDEO ANALYTICS IN OPERATION

Vista Harmoni Residences uses cameras with AI analytics for the safety and security of residents and visitors.

What we collect: video, face snapshots of people not registered on site, vehicle plates at the gates.
Why: access control, security incidents, parking enforcement.
How long: unknown-face snapshots 30 days, plate reads 90 days, incidents until closed + 1 year.
Who sees it: the management office and the appointed security company.

Your rights under the Personal Data Protection Act 2010: you may ask for access to or correction of your data.
Data Protection Officer: dpo@vistaharmoni.my · 03-7800 1234 · Management office, Block A, Ground floor.`;

export default function Privacy() {
  const retention = useStore((s) => s.retention);
  const requests = useStore((s) => s.dataRequests);
  const audit = useStore((s) => s.audit);
  const { setRetention, advanceRequest, log } = useStore.getState();
  const [act, setAct] = useState<'all' | AuditEntry['action']>('all');
  const [q, setQ] = useState('');

  const list = audit.filter((a) => act === 'all' || a.action === act).filter((a) => !q || `${a.who} ${a.record}`.toLowerCase().includes(q.toLowerCase()));

  const changeRetention = (id: string, data: string, from: string, to: string) => {
    setRetention(id, to);
    log({ who: useStore.getState().session.portal?.name ?? 'Farah Hanim', role: 'Building Manager', action: 'Changed', record: `Retention for ${data.toLowerCase()}, ${from} to ${to}` });
    toast.success('Retention updated', `${data}: ${to}. Older data is deleted tonight at 02:00.`);
  };

  const exportAudit = () => {
    downloadFile(`audit-log-${todayStamp()}.csv`, toCsv([['Time', 'Who', 'Role', 'Action', 'Record'], ...audit.map((a) => [when(a.at), a.who, a.role, a.action, a.record])]));
    log({ who: useStore.getState().session.portal?.name ?? 'Farah Hanim', role: 'Building Manager', action: 'Exported', record: 'PDPA audit log' });
    toast.success('Audit log exported');
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[['Face access consent', '742 of 1,284', 'Opt-in only, withdraw anytime'], ['Open data requests', String(requests.filter((r) => r.state !== 'Done').length), 'Due within 21 days by law'], ['Records deleted by retention', '2,418', 'Last 30 days'], ['Staff with footage access', '9', 'Role-based, every view logged']].map(([l, v, n]) => (
          <Card key={l} className="flex flex-col gap-1.5 p-4"><span className="text-[12.5px] font-bold text-muted-dark">{l}</span><span className="text-[26px] font-extrabold tracking-tight">{v}</span><span className="text-xs text-muted">{n}</span></Card>
        ))}
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden">
          <div className="p-4"><CardHeader title="Retention" sub="Data is deleted automatically when it reaches its limit" /></div>
          <div className="overflow-x-auto">
            <table className="tbl min-w-[640px]">
              <thead><tr><th>Data</th><th>Keep for</th><th>Why we keep it</th></tr></thead>
              <tbody>
                {retention.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.data}</td>
                    <td><Select aria-label={`Retention for ${r.data}`} value={r.keep} onChange={(e) => changeRetention(r.id, r.data, r.keep, e.target.value)} className="h-9 w-52 text-[12.5px]">{r.options.map((o) => <option key={o}>{o}</option>)}</Select></td>
                    <td className="text-[12.5px] text-muted-dark">{r.why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <div className="flex flex-col gap-5">
          <Card className="flex flex-col gap-3 p-4">
            <CardHeader title="Data requests" sub="Access, correction and deletion under PDPA" />
            {requests.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2"><p className="text-[13px] font-bold">{r.title}</p><Chip tone={reqTone[r.state]}>{r.state}</Chip></div>
                <p className="text-xs text-muted">{r.meta}</p>
                {r.state !== 'Done' && (
                  <Button size="sm" variant={r.state === 'New' ? 'secondary' : 'teal'} icon={r.state === 'New' ? undefined : <CheckCircle2 className="h-3.5 w-3.5" />} className="self-start"
                    onClick={() => { advanceRequest(r.id); toast.success(r.state === 'New' ? 'Request started' : 'Request completed', r.state === 'New' ? 'Assigned to you. Due in 21 days.' : 'The requester has been emailed.'); }}>
                    {r.state === 'New' ? 'Start' : 'Mark done'}
                  </Button>
                )}
              </div>
            ))}
          </Card>
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal" /><h2 className="h2">Notice and signage</h2></div>
            <p className="sub">Printed at every entrance and shown in the app and on the visitor pass.</p>
            <Button icon={<FileText className="h-4 w-4" />} onClick={() => { downloadFile('cctv-signage-notice.txt', SIGNAGE, 'text/plain;charset=utf-8'); toast.success('Signage text downloaded'); }}>Download signage text</Button>
            <div className="rounded-xl bg-ice p-3 text-xs text-muted-dark"><Lock className="mr-1 inline h-3.5 w-3.5" />Face data never leaves the on-site edge server. Only alert snapshots go to the cloud, encrypted.</div>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-4">
          <CardHeader title="Audit log" sub="Every view, export and change to personal data" action={<Button size="sm" icon={<Download className="h-4 w-4" />} onClick={exportAudit}>Export</Button>} />
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Action" value={act} onChange={setAct} options={[{ value: 'all', label: 'All' }, ...(['Viewed', 'Exported', 'Changed', 'Deleted', 'Added'] as const).map((a) => ({ value: a, label: a }))]} />
            <div className="relative ml-auto w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input aria-label="Search audit log" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Person or record" className="pl-9" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl min-w-[680px]">
            <thead><tr><th>Time</th><th>Who</th><th>Action</th><th>Record</th></tr></thead>
            <tbody>
              {list.map((a) => (
                <tr key={a.id}><td className="whitespace-nowrap text-muted-dark">{when(a.at)}</td><td><p className="font-semibold">{a.who}</p><p className="text-xs text-muted">{a.role}</p></td><td><Chip tone={actTone[a.action]}>{a.action}</Chip></td><td className="text-[13px]">{a.record}</td></tr>
              ))}
            </tbody>
          </table>
          {!list.length && <p className="p-6 text-center text-sm text-muted">No entries match.</p>}
        </div>
      </Card>
    </div>
  );
}
