import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Repeat, UserPlus } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FaceCrop } from '@/components/vision';
import { Card, Chip, Empty, Segmented } from '@/components/ui';
import { LinkButton } from '@/components/ui/Button';
import { visitStatusLabel, visitStatusTone, visitTypeLabel } from '@/lib/labels';
import { hhmm } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';

type Tab = 'upcoming' | 'on_site' | 'past';

export default function ResidentVisitors() {
  useDocumentTitle('Visitors');
  const unit = useStore((s) => s.resident.unit);
  const visits = useStore((s) => s.visits);
  const [tab, setTab] = useState<Tab>('upcoming');
  const mine = visits.filter((v) => v.unit === unit);
  const lists: Record<Tab, typeof mine> = {
    upcoming: mine.filter((v) => v.status === 'expected').sort((a, b) => +new Date(a.validFrom) - +new Date(b.validFrom)),
    on_site: mine.filter((v) => v.status === 'on_site'),
    past: mine.filter((v) => v.status === 'left' || v.status === 'cancelled' || v.status === 'denied'),
  };
  const regular = mine.filter((v) => v.recurringDays);
  const list = lists[tab];

  return (
    <div className="flex flex-col gap-4">
      <Segmented full label="Visitor list" value={tab} onChange={setTab} options={[{ value: 'upcoming', label: `Upcoming · ${lists.upcoming.length}` }, { value: 'on_site', label: `Here now · ${lists.on_site.length}` }, { value: 'past', label: 'Past' }]} />
      <Card className="overflow-hidden">
        <ul>
          {list.map((v) => (
            <li key={v.id}>
              <Link to={`/app/pass/${v.id}`} className="flex items-center gap-3 border-b border-line-soft px-4 py-3 last:border-0 hover:bg-ice">
                <FaceCrop variant={v.faceVariant} className="h-11 w-11" rounded="rounded-full" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{v.name}{v.people > 1 ? ` +${v.people - 1}` : ''}</span>
                  <span className="text-xs text-muted">{visitTypeLabel[v.type]} · {new Date(v.validFrom).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} {tab === 'on_site' ? `· in ${hhmm(v.checkIn)}` : `${hhmm(v.validFrom)}`}</span>
                </span>
                <Chip tone={visitStatusTone[v.status]}>{visitStatusLabel[v.status]}</Chip>
                <ChevronRight className="h-4 w-4 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
        {!list.length && <Empty icon={<UserPlus className="h-5 w-5" />} title={tab === 'on_site' ? 'Nobody here right now' : tab === 'upcoming' ? 'No upcoming visitors' : 'No past visits yet'} action={tab === 'upcoming' ? <LinkButton to="/app/invite" variant="primary" size="sm">Invite someone</LinkButton> : undefined} />}
      </Card>
      {regular.length > 0 && (
        <Card className="p-4">
          <h2 className="h2 mb-2 flex items-center gap-2"><Repeat className="h-4 w-4 text-muted" />Regular visitors</h2>
          {regular.map((v) => (
            <Link key={v.id} to={`/app/pass/${v.id}`} className="flex items-center gap-3 py-2">
              <FaceCrop variant={v.faceVariant} className="h-9 w-9" rounded="rounded-full" />
              <span className="flex-1"><span className="block text-[13.5px] font-semibold">{v.name}</span><span className="text-xs text-muted">{visitTypeLabel[v.type]} · {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter((_, i) => v.recurringDays![i]).join(', ')}</span></span>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Link>
          ))}
        </Card>
      )}
      <LinkButton to="/app/invite" variant="primary" size="lg" block icon={<UserPlus className="h-4 w-4" />}>Invite a visitor</LinkButton>
    </div>
  );
}
