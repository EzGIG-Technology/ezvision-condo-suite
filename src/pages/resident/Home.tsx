import { Link } from 'react-router-dom';
import { CalendarDays, ChevronRight, CreditCard, Hammer, MessageCircle, Package, ScanFace, ShieldAlert, ShieldCheck, Truck, UserPlus, Users, Wrench } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { FaceCrop } from '@/components/vision';
import { Card, Chip } from '@/components/ui';
import { visitStatusLabel, visitStatusTone } from '@/lib/labels';
import { cn, hhmm, relative, rm } from '@/lib/utils';
import { useDocumentTitle } from '@/lib/hooks';

export default function ResidentHome() {
  useDocumentTitle('Home');
  const resident = useStore((s) => s.resident);
  const visits = useStore((s) => s.visits);
  const parcels = useStore((s) => s.parcels);
  const notices = useStore((s) => s.notices);
  const bills = useStore((s) => s.bills);
  const bookings = useStore((s) => s.bookings);
  const faceEnrolled = useStore((s) => s.faceEnrolled);
  const messages = useStore((s) => s.messages);
  const unit = resident.unit;

  const today = new Date().toDateString();
  const mine = visits.filter((v) => v.unit === unit);
  const todays = mine.filter((v) => v.status === 'on_site' || (v.status === 'expected' && new Date(v.validFrom).toDateString() === today) || (v.status === 'left' && v.checkOut && new Date(v.checkOut).toDateString() === today));
  const upcoming = mine.filter((v) => v.status === 'expected' && new Date(v.validFrom) > new Date() && new Date(v.validFrom).toDateString() !== today);
  const waiting = parcels.filter((p) => p.unit === unit && p.status === 'waiting');
  const due = bills.find((b) => b.unit === unit && b.status === 'due');
  const security = notices.find((n) => n.unit === unit && n.kind === 'security');
  const nextBooking = bookings.filter((b) => b.unit === unit && b.status === 'confirmed' && new Date(b.date) > new Date()).sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
  const hour = new Date().getHours();

  const actions = [
    { to: '/app/invite', label: 'Invite', icon: UserPlus, tone: 'bg-brand text-white' },
    { to: '/app/parcels', label: 'Parcels', icon: Package, tone: 'bg-warn-soft text-warn-ink', badge: waiting.length },
    { to: '/app/book', label: 'Book', icon: CalendarDays, tone: 'bg-teal-soft text-teal-dark' },
    { to: '/app/face', label: 'Face access', icon: ScanFace, tone: 'bg-grape-soft text-grape-ink' },
    { to: '/app/renovation', label: 'Renovation', icon: Hammer, tone: 'bg-[#EEF1F7] text-muted-dark' },
    { to: '/app/billing', label: 'Fees', icon: CreditCard, tone: 'bg-brand-soft text-brand-ink', badge: due ? 1 : 0 },
    { to: '/app/guardhouse', label: 'Guardhouse', icon: MessageCircle, tone: 'bg-teal-soft text-teal-dark', badge: messages.filter((m) => m.unit === unit && m.from === 'guard' && !m.read).length },
    { to: '/app/report', label: 'Report issue', icon: Wrench, tone: 'bg-warn-soft text-warn-ink' },
    { to: '/app/move', label: 'Move in/out', icon: Truck, tone: 'bg-[#EEF1F7] text-muted-dark' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-muted">Good {hour < 12 ? 'morning' : hour < 19 ? 'afternoon' : 'evening'}</p>
        <h1 className="text-2xl font-extrabold tracking-tight">{resident.name.split(' ').slice(-2).join(' ')}</h1>
        <p className="text-[13px] text-muted-dark">Unit {unit} · Tower A · Vista Harmoni</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((a) => (
          <Link key={a.to} to={a.to} className="card relative flex flex-col items-center gap-2 p-3 text-center">
            <span className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', a.tone)}><a.icon className="h-5 w-5" /></span>
            <span className="text-[12.5px] font-bold">{a.label}</span>
            {!!a.badge && <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-dot px-1 text-[10.5px] font-bold text-white">{a.badge}</span>}
          </Link>
        ))}
      </div>

      <Link to="/app/sos" className="flex items-center gap-3 rounded-2xl bg-danger p-4 text-white shadow-card">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20"><ShieldAlert className="h-6 w-6" /></span>
        <span className="flex-1"><span className="block font-extrabold">Emergency SOS</span><span className="text-xs text-white/85">Alerts the guardhouse with your unit and location</span></span>
        <ChevronRight className="h-5 w-5" />
      </Link>

      {security && (
        <Card className="flex gap-3 border-l-4 border-l-danger p-4">
          <ShieldCheck className="h-5 w-5 shrink-0 text-danger" />
          <div><p className="text-[13.5px] font-bold">{security.title}</p><p className="text-[12.5px] text-muted-dark">{security.body}</p><p className="mt-1 text-[11px] text-muted">{relative(security.at)}</p></div>
        </Card>
      )}

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between"><h2 className="h2">Visitors today</h2><Link to="/app/visitors" className="text-[12.5px] font-bold text-brand">All</Link></div>
        <ul className="flex flex-col">
          {todays.map((v) => (
            <li key={v.id}>
              <Link to={`/app/pass/${v.id}`} className="flex items-center gap-3 border-b border-line-soft py-2.5 last:border-0">
                <FaceCrop variant={v.faceVariant} className="h-10 w-10" rounded="rounded-full" />
                <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold">{v.name}</span><span className="text-xs text-muted">{v.status === 'on_site' ? `Arrived ${hhmm(v.checkIn)}` : v.status === 'left' ? `Left ${hhmm(v.checkOut)}` : `Expected ${hhmm(v.validFrom)}`}</span></span>
                <Chip tone={visitStatusTone[v.status]}>{visitStatusLabel[v.status]}</Chip>
              </Link>
            </li>
          ))}
          {!todays.length && <li className="py-3 text-sm text-muted">No visitors today. <Link to="/app/invite" className="font-bold text-brand">Invite someone</Link></li>}
        </ul>
        {upcoming.length > 0 && <Link to="/app/visitors" className="mt-2 flex items-center gap-2 rounded-xl bg-ice p-3 text-[12.5px] font-semibold text-muted-dark"><Users className="h-4 w-4" />{upcoming.length} upcoming · {upcoming[0].name} on {new Date(upcoming[0].validFrom).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</Link>}
      </Card>

      <div className="grid grid-cols-2 gap-2.5">
        <Link to="/app/parcels" className="card flex flex-col gap-1 p-4">
          <Package className="h-5 w-5 text-warn-ink" />
          <span className="text-2xl font-extrabold">{waiting.length}</span>
          <span className="text-xs text-muted">{waiting.length ? `Parcel${waiting.length > 1 ? 's' : ''} at the guardhouse` : 'No parcels waiting'}</span>
        </Link>
        <Link to="/app/billing" className="card flex flex-col gap-1 p-4">
          <CreditCard className="h-5 w-5 text-brand" />
          <span className="text-lg font-extrabold">{due ? rm(due.amount) : 'All paid'}</span>
          <span className="text-xs text-muted">{due ? `Due ${due.due}` : 'Thank you'}</span>
        </Link>
      </div>

      {nextBooking && (
        <Link to="/app/book" className="card flex items-center gap-3 p-4">
          <CalendarDays className="h-5 w-5 text-teal" />
          <span className="flex-1"><span className="block text-[13.5px] font-bold">{nextBooking.facility}{nextBooking.label ? ` · ${nextBooking.label}` : ''}</span><span className="text-xs text-muted">{new Date(nextBooking.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {nextBooking.from}:00 to {nextBooking.to}:00</span></span>
          <ChevronRight className="h-4 w-4 text-muted" />
        </Link>
      )}

      {!faceEnrolled && (
        <Link to="/app/face" className="flex items-center gap-3 rounded-2xl bg-grape-soft p-4 text-grape-ink">
          <ScanFace className="h-6 w-6" />
          <span className="flex-1"><span className="block text-[13.5px] font-bold">Walk in without your card</span><span className="text-xs">Set up face access for the lobby turnstiles</span></span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
