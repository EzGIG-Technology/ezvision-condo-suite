import { useState } from 'react';
import { Building, CheckCircle2, CreditCard, Download, QrCode, Repeat } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Chip, Modal, Select, Switch } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { SITE } from '@/data/seed';
import { cn, rm } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import { exportReport } from '@/lib/export';
import type { Bill } from '@/data/types';

const METHODS = [
  { key: 'FPX', label: 'FPX online banking', icon: Building },
  { key: 'Card', label: 'Debit or credit card', icon: CreditCard },
  { key: 'DuitNow QR', label: 'DuitNow QR', icon: QrCode },
];
const BANKS = ['Maybank2u', 'CIMB Clicks', 'Public Bank', 'RHB Now', 'Hong Leong Connect', 'Bank Islam'];

export default function ResidentBilling() {
  useDocumentTitle('Fees and billing');
  const unit = useStore((s) => s.resident.unit);
  const resident = useStore((s) => s.resident);
  const bills = useStore((s) => s.bills);
  const autoDebit = useStore((s) => s.autoDebit);
  const { payBill, setAutoDebit } = useStore.getState();
  const [pay, setPay] = useState<Bill | null>(null);
  const [method, setMethod] = useState('FPX');
  const [bank, setBank] = useState(BANKS[0]);
  const [busy, setBusy] = useState(false);
  const mine = bills.filter((b) => b.unit === unit);
  const due = mine.filter((b) => b.status === 'due');
  const paid = mine.filter((b) => b.status === 'paid');

  const confirm = () => {
    if (!pay) return;
    setBusy(true);
    window.setTimeout(() => {
      payBill(pay.id, method === 'FPX' ? `FPX · ${bank}` : method);
      setBusy(false); setPay(null);
      toast.success(`${rm(pay.amount)} paid`, 'Receipt sent to your email.');
    }, 1000);
  };

  const receipt = async (b: Bill) => {
    await exportReport({
      title: 'Official receipt', file: `receipt-${b.id}`,
      summary: [['Receipt no', `OR-${b.id.toUpperCase()}`], ['Issued by', `${SITE.name} Joint Management Body`], ['Unit', b.unit], ['Received from', resident.name], ['For', b.label], ['Paid', `${b.paidAt ?? ''} via ${b.method ?? ''}`]],
      columns: ['Item', 'Amount'],
      rows: [...(b.lines.length ? b.lines.map((l) => [l.label, rm(l.amount)]) : [[b.label, rm(b.amount)]]), ['Total', rm(b.amount)]],
    }, 'PDF');
    toast.success('Receipt downloaded');
  };

  return (
    <div className="flex flex-col gap-4">
      {due.map((b) => (
        <Card key={b.id} className="flex flex-col gap-3 p-5">
          <div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-muted">{b.label}</p><p className="text-3xl font-extrabold tracking-tight">{rm(b.amount)}</p><p className="text-xs text-warn-ink">Due {b.due}</p></div><Chip tone="amber">Due</Chip></div>
          <dl className="flex flex-col gap-1.5 rounded-xl bg-ice p-3 text-[13px]">{b.lines.map((l) => <div key={l.label} className="flex justify-between gap-3"><dt className="text-muted-dark">{l.label}</dt><dd className="font-semibold">{rm(l.amount)}</dd></div>)}</dl>
          <Button variant="primary" size="lg" block onClick={() => setPay(b)}>Pay {rm(b.amount)}</Button>
        </Card>
      ))}
      {!due.length && <Card className="flex items-center gap-3 p-5"><CheckCircle2 className="h-8 w-8 text-teal" /><div><p className="font-extrabold">All paid up</p><p className="text-xs text-muted">Next bill: Q1 2027, issued on 15 Dec.</p></div></Card>}

      <Card className="flex items-center gap-3 p-4">
        <Repeat className="h-5 w-5 text-brand" />
        <div className="flex-1"><p className="text-[13.5px] font-bold">Auto-debit</p><p className="text-xs text-muted">{autoDebit ? 'On · Maybank ••4410, charged on the due date' : 'Pay each quarter automatically'}</p></div>
        <Switch checked={autoDebit} label="Auto-debit" onChange={(v) => { setAutoDebit(v); toast.success(v ? 'Auto-debit on' : 'Auto-debit off', v ? 'Mandate registered with Maybank ••4410.' : undefined); }} />
      </Card>

      <Card className="p-4">
        <h2 className="h2 mb-2">Payment history</h2>
        {paid.map((b) => (
          <div key={b.id} className="flex items-center gap-3 border-b border-line-soft py-2.5 last:border-0">
            <div className="flex-1"><p className="text-[13.5px] font-semibold">{b.label}</p><p className="text-xs text-muted">{b.paidAt} · {b.method}</p></div>
            <span className="font-bold">{rm(b.amount)}</span>
            <button type="button" aria-label={`Download receipt for ${b.label}`} onClick={() => receipt(b)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-ice"><Download className="h-4 w-4" /></button>
          </div>
        ))}
      </Card>

      <Modal open={!!pay} onClose={() => setPay(null)} title={`Pay ${pay ? rm(pay.amount) : ''}`} description={pay?.label} size="sm"
        footer={<><Button onClick={() => setPay(null)}>Cancel</Button><Button variant="primary" loading={busy} onClick={confirm}>{busy ? 'Processing…' : 'Pay now'}</Button></>}>
        <div className="flex flex-col gap-2">
          {METHODS.map((m) => (
            <button key={m.key} type="button" aria-pressed={method === m.key} onClick={() => setMethod(m.key)} className={cn('flex items-center gap-3 rounded-xl border p-3 text-left', method === m.key ? 'border-brand bg-brand-soft' : 'border-line hover:bg-ice')}>
              <m.icon className="h-5 w-5 text-muted-dark" /><span className="flex-1 text-[13.5px] font-semibold">{m.label}</span>
              <span className={cn('h-4 w-4 rounded-full border-2', method === m.key ? 'border-brand bg-brand' : 'border-line-strong')} />
            </button>
          ))}
          {method === 'FPX' && <Select aria-label="Bank" value={bank} onChange={(e) => setBank(e.target.value)} className="mt-1">{BANKS.map((b) => <option key={b}>{b}</option>)}</Select>}
          <p className="mt-1 text-xs text-muted">You'll be redirected to your bank to approve. Demo: payment completes automatically.</p>
        </div>
      </Modal>
    </div>
  );
}
