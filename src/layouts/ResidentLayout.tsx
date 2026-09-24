import { useEffect, useRef } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CalendarDays, Home, Plus, UserRound, Users } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageOutlet } from '@/components/PageBoundary';
import { Logo, FaceCrop } from '@/components/vision';
import { cn } from '@/lib/utils';
import { toast } from '@/store/toast';

const TITLES: Record<string, string> = {
  invite: 'Invite a visitor', pass: 'Visitor pass', visitors: 'Visitors', parcels: 'Parcels', book: 'Book a facility', activity: 'Activity',
  unit: 'My unit', face: 'Face access', renovation: 'Renovation permit', billing: 'Fees and billing',
  guardhouse: 'Guardhouse', report: 'Report an issue', move: 'Move in or out', vote: 'AGM and e-voting',
};

export default function ResidentLayout() {
  const session = useStore((s) => s.session.resident);
  const notices = useStore((s) => s.notices);
  const approvals = useStore((s) => s.approvals);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const unit = session?.unit ?? '';
  const pending = approvals.filter((a) => a.unit === unit && a.status === 'waiting');
  const unread = notices.filter((n) => n.unit === unit && !n.read).length;
  const seen = useRef<Set<string>>(new Set(approvals.map((a) => a.id)));

  // A walk-in request created at the guard tablet (another tab) arrives here.
  useEffect(() => {
    approvals.forEach((a) => {
      if (!seen.current.has(a.id)) {
        seen.current.add(a.id);
        if (a.unit === unit && a.status === 'waiting') toast.warning('Someone is at the gate', `${a.visitorName} · ${a.purpose}`);
      }
    });
  }, [approvals, unit]);

  if (!session) return <Navigate to="/app/login" replace />;

  const seg = pathname.split('/')[2] ?? '';
  const isHome = seg === '';
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate('/app'));

  return (
    <div className="min-h-screen bg-[#E9EEF7] sm:py-6">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-ice sm:min-h-[calc(100vh-48px)] sm:rounded-[32px] sm:shadow-pop">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-white/95 px-3 backdrop-blur safe-top sm:rounded-t-[32px]">
          {isHome ? (
            <span className="pl-1"><Logo size={26} /></span>
          ) : (
            <>
              <button type="button" onClick={back} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-xl text-navy hover:bg-ice"><ArrowLeft className="h-5 w-5" /></button>
              <h1 className="text-[16px] font-extrabold">{TITLES[seg] ?? ''}</h1>
            </>
          )}
          <Link to="/app/activity" aria-label={`Activity, ${unread} unread`} className="relative ml-auto flex h-10 w-10 items-center justify-center rounded-xl text-navy hover:bg-ice">
            <Bell className="h-5 w-5" />
            {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-dot px-1 text-[10px] font-bold text-white">{unread}</span>}
          </Link>
        </header>

        {pending[0] && (
          <Link to={`/app/approval/${pending[0].id}`} className="flex items-center gap-3 bg-warn-soft px-4 py-3 text-warn-ink">
            <FaceCrop variant={pending[0].faceVariant} className="h-10 w-10" rounded="rounded-full" />
            <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-bold">{pending[0].visitorName} is at the gate</span><span className="text-xs">{pending[0].purpose} · tap to respond</span></span>
            <span className="rounded-lg bg-warn-ink px-3 py-1.5 text-xs font-bold text-white">Respond</span>
          </Link>
        )}

        <main className="flex-1 px-4 pb-8 pt-4">
          <PageOutlet />
        </main>

        <nav aria-label="Resident" className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white safe-bottom sm:rounded-b-[32px]">
          {[
            { to: '/app', label: 'Home', icon: Home, end: true },
            { to: '/app/visitors', label: 'Visitors', icon: Users },
            { to: '/app/invite', label: 'Invite', icon: Plus, center: true },
            { to: '/app/book', label: 'Book', icon: CalendarDays },
            { to: '/app/unit', label: 'My unit', icon: UserRound },
          ].map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('relative flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold', isActive ? 'text-brand' : 'text-muted')}>
              {n.center ? (
                <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-pop"><n.icon className="h-6 w-6" /></span>
              ) : <n.icon className="h-[22px] w-[22px]" />}
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
