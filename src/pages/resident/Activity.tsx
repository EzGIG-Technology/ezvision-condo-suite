import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarDays, Car, CheckCheck, ChevronRight, CreditCard, Hammer, Megaphone, Package, ShieldAlert, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Card, Empty } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { cn, dayLabel, hhmm } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';
import { toast } from '@/store/toast';
import type { ResidentNotice } from '@/data/types';

const ICON: Record<ResidentNotice['kind'], [typeof Bell, string]> = {
  security: [ShieldAlert, 'bg-danger-soft text-danger-ink'], visitor: [Users, 'bg-brand-soft text-brand-ink'], parcel: [Package, 'bg-warn-soft text-warn-ink'],
  vehicle: [Car, 'bg-[#EEF1F7] text-muted-dark'], billing: [CreditCard, 'bg-brand-soft text-brand-ink'], announcement: [Megaphone, 'bg-grape-soft text-grape-ink'],
  booking: [CalendarDays, 'bg-teal-soft text-teal-dark'], permit: [Hammer, 'bg-[#EEF1F7] text-muted-dark'],
};
const FILTERS: { key: 'all' | ResidentNotice['kind']; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'visitor', label: 'Visitors' }, { key: 'parcel', label: 'Parcels' }, { key: 'security', label: 'Security' }, { key: 'announcement', label: 'Announcements' }, { key: 'billing', label: 'Billing' },
];

function Row({ clickable, onClick, className, children }: { clickable: boolean; onClick: () => void; className: string; children: React.ReactNode }) {
  return clickable ? <button type="button" onClick={onClick} className={className}>{children}</button> : <div className={className}>{children}</div>;
}

export default function ResidentActivity() {
  useDocumentTitle('Activity');
  const unit = useStore((s) => s.resident.unit);
  const notices = useStore((s) => s.notices);
  const markRead = useStore((s) => s.markNoticesRead);
  const navigate = useNavigate();
  const [f, setF] = useState<(typeof FILTERS)[number]['key']>('all');
  const mine = notices.filter((n) => n.unit === unit).sort((a, b) => +new Date(b.at) - +new Date(a.at));
  const list = mine.filter((n) => f === 'all' || n.kind === f);
  const unread = mine.filter((n) => !n.read).length;

  const groups = list.reduce<Record<string, ResidentNotice[]>>((acc, n) => { const k = dayLabel(n.at); (acc[k] ??= []).push(n); return acc; }, {});

  const open = (n: ResidentNotice) => {
    useStore.setState((s) => ({ notices: s.notices.map((x) => (x.id === n.id ? { ...x, read: true } : x)) }));
    if (n.link) navigate(n.link);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{unread ? `${unread} unread` : 'All caught up'}</p>
        <Button size="sm" variant="ghost" icon={<CheckCheck className="h-4 w-4" />} disabled={!unread} onClick={() => { markRead(); toast.success('All marked as read'); }}>Mark all read</Button>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-thin">
        {FILTERS.map((x) => <button key={x.key} type="button" aria-pressed={f === x.key} onClick={() => setF(x.key)} className={cn('h-8 shrink-0 rounded-full border px-3.5 text-[12.5px] font-semibold', f === x.key ? 'border-navy bg-navy text-white' : 'border-line-strong bg-white text-muted-dark')}>{x.label}</button>)}
      </div>
      {Object.entries(groups).map(([day, items]) => (
        <section key={day} className="flex flex-col gap-2">
          <h2 className="eyebrow">{day}</h2>
          <Card className="overflow-hidden">
            {items.map((n) => {
              const [Icon, tone] = ICON[n.kind];
              return (
                <Row key={n.id} clickable={!!n.link || !n.read} onClick={() => open(n)} className={cn('flex w-full items-start gap-3 border-b border-line-soft px-4 py-3 text-left last:border-0', (n.link || !n.read) && 'hover:bg-ice', !n.read && 'bg-brand-soft/40')}>
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', tone)}><Icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2"><span className="text-[13.5px] font-bold">{n.title}</span>{!n.read && <span className="h-2 w-2 rounded-full bg-brand" />}</span>
                    <span className="block text-[12.5px] text-muted-dark">{n.body}</span>
                    <span className="text-[11px] text-muted">{hhmm(n.at)}</span>
                  </span>
                  {n.link && <ChevronRight className="mt-2 h-4 w-4 text-muted" />}
                </Row>
              );
            })}
          </Card>
        </section>
      ))}
      {!list.length && <Card><Empty icon={<Bell className="h-5 w-5" />} title="Nothing here yet" /></Card>}
    </div>
  );
}
