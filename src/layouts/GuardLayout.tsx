import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Bike, ClipboardPen, CloudOff, Home, LogOut, MessageCircle, Package, Route, ScanLine, UserPlus } from 'lucide-react';
import { useCurrentGuard, useStore } from '@/store/useStore';
import { PageOutlet } from '@/components/PageBoundary';
import { Logo } from '@/components/vision';
import { Avatar } from '@/components/ui';
import { cn, hhmm } from '@/lib/utils';
import { useCallTimeout, useNow, useOnline } from '@/lib/hooks';
import { toast } from '@/store/toast';

const NAV = [
  { to: '/guard', label: 'Gate', icon: Home, end: true },
  { to: '/guard/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/guard/walk-in', label: 'Walk-in', icon: UserPlus },
  { to: '/guard/verify', label: 'Verify', icon: ScanLine },
  { to: '/guard/parcels', label: 'Parcels', icon: Package },
  { to: '/guard/riders', label: 'Riders', icon: Bike },
  { to: '/guard/messages', label: 'Messages', icon: MessageCircle },
  { to: '/guard/patrol', label: 'Patrol', icon: Route },
  { to: '/guard/report', label: 'Report', icon: ClipboardPen },
];

export default function GuardLayout() {
  const guardId = useStore((s) => s.session.guardId);
  const alerts = useStore((s) => s.alerts);
  const messages = useStore((s) => s.messages);
  const logout = useStore((s) => s.logoutGuard);
  const guard = useCurrentGuard();
  const now = useNow(15000);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const seen = useRef<Set<string>>(new Set(alerts.map((a) => a.id)));
  const seenMsg = useRef<Set<string>>(new Set(messages.map((m) => m.id)));
  const unreadMsgs = messages.filter((m) => m.from === 'resident' && !m.read).length;
  const online = useOnline();
  const call = useStore((s) => s.call);
  useCallTimeout('Guardhouse');

  // Tell the guard how a call from the tablet went.
  const callState = call?.from === 'Guardhouse' ? `${call.id}:${call.state}:${call.outcome ?? ''}` : '';
  useEffect(() => {
    if (!call || call.from !== 'Guardhouse') return;
    if (call.state === 'answered') toast.success(`${call.unit} answered`, 'You are connected.');
    if (call.state === 'ended') {
      if (call.outcome === 'declined') toast.warning(`${call.unit} declined the call`);
      if (call.outcome === 'missed') toast.warning(`No answer from ${call.unit}`, 'Try their phone, or send a message.');
    }
  }, [callState]);
  const [queued, setQueued] = useState(0);
  const pendingSync = useRef(0);
  const wasOffline = useRef(false);

  // Offline mode: the tablet keeps working from its own copy of the data. Count what changes while
  // the connection is down, and report the sync when it comes back.
  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return useStore.subscribe(() => { pendingSync.current += 1; setQueued(pendingSync.current); });
    }
    if (wasOffline.current) {
      const n = pendingSync.current;
      wasOffline.current = false;
      pendingSync.current = 0;
      setQueued(0);
      toast.success('Back online', n ? `${n} change${n > 1 ? 's' : ''} synced to the portal.` : 'Nothing to sync.');
    }
  }, [online]);

  const open = alerts.filter((a) => a.status !== 'closed');
  const urgent = open.find((a) => a.status === 'open' && (a.severity === 'critical' || a.severity === 'high'));

  // New alerts created elsewhere (resident SOS, portal) pop a toast on the tablet.
  useEffect(() => {
    alerts.forEach((a) => {
      if (!seen.current.has(a.id)) {
        seen.current.add(a.id);
        if (a.status === 'open') toast.warning(a.category === 'sos' ? `SOS from ${a.unit ?? 'resident'}` : 'New alert', a.title);
      }
    });
  }, [alerts]);

  // Resident messages sent from the app (another tab) pop a toast on the tablet.
  useEffect(() => {
    messages.forEach((m) => {
      if (!seenMsg.current.has(m.id)) {
        seenMsg.current.add(m.id);
        if (m.from === 'resident' && !pathname.startsWith('/guard/messages')) toast.info(`Message from ${m.unit}`, m.text);
      }
    });
  }, [messages, pathname]);

  if (!guardId) return <Navigate to="/guard/login" replace />;

  const signOut = () => { logout(); toast.info('Signed out', 'Hand the tablet to the next guard.'); navigate('/guard/login'); };

  return (
    <div className="min-h-screen bg-night text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[92px] flex-col items-center border-r border-night-line bg-night-deep py-4 md:flex">
        <Link to="/guard" aria-label="Gate console"><Logo dark size={40} iconOnly /></Link>
        <nav aria-label="Guard" className="mt-6 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto scrollbar-thin">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('relative flex h-[62px] w-[72px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition-colors', isActive ? 'bg-brand text-white' : 'text-muted-light hover:bg-night-panel hover:text-white')}>
              <n.icon className="h-[22px] w-[22px]" aria-hidden />
              {n.label}
              {n.label === 'Alerts' && open.length > 0 && <span className="absolute right-2 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-dot px-1 text-[10.5px] font-bold">{open.length}</span>}
              {n.label === 'Messages' && unreadMsgs > 0 && <span className="absolute right-2 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-dot px-1 text-[10.5px] font-bold">{unreadMsgs}</span>}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={signOut} className="flex h-[58px] w-[72px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold text-muted-light hover:bg-night-panel hover:text-white"><LogOut className="h-5 w-5" />Sign out</button>
      </aside>

      <div className="md:pl-[92px]">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-night-line bg-night/95 px-4 py-3 backdrop-blur safe-top sm:px-6">
          <span className="md:hidden"><Logo dark size={28} /></span>
          <div className="hidden flex-col md:flex">
            <span className="text-[15px] font-extrabold">Guardhouse · Main gate</span>
            <span className="text-xs text-muted-light">Vista Harmoni Residences · {guard.shift} shift</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden font-mono text-lg font-bold sm:block">{hhmm(now.toISOString())}</span>
            <span className="flex items-center gap-2 rounded-full bg-night-panel py-1 pl-1 pr-3">
              <Avatar name={guard.name} color={guard.color} size={30} />
              <span className="text-[13px] font-semibold">{guard.name.split(' ')[0]}</span>
            </span>
            <button type="button" onClick={signOut} aria-label="Sign out" className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-light hover:bg-night-panel md:hidden"><LogOut className="h-5 w-5" /></button>
          </div>
        </header>

        {!online && (
          <div role="status" className="flex items-center gap-3 bg-warn px-4 py-2.5 text-[13.5px] font-semibold text-navy sm:px-6">
            <CloudOff className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1">Offline. Keep working: walk-ins, parcels, riders and patrols are saved on this tablet and sync when the connection is back.</span>
            <span className="shrink-0 rounded-lg bg-navy/10 px-2.5 py-1 text-xs font-bold">{queued} waiting to sync</span>
          </div>
        )}

        {urgent && !pathname.startsWith(`/guard/alerts/${urgent.id}`) && (
          <Link to={`/guard/alerts/${urgent.id}`} className="flex animate-fade-in items-center gap-3 bg-danger px-4 py-3 text-white sm:px-6">
            <span className="h-2.5 w-2.5 animate-pulse2 rounded-full bg-white" />
            <span className="min-w-0 flex-1 truncate text-[14px] font-bold">{urgent.title} · {urgent.where}</span>
            <span className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-[13px] font-bold">Respond</span>
          </Link>
        )}

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 md:pb-10">
          <PageOutlet />
        </main>
      </div>

      <nav aria-label="Guard" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-night-line bg-night-deep safe-bottom md:hidden">
        {NAV.filter((n) => ['Gate', 'Alerts', 'Walk-in', 'Verify', 'Parcels'].includes(n.label)).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => cn('relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold', isActive ? 'text-white' : 'text-muted-light')}>
            {({ isActive }) => (
              <>
                <span className={cn('flex h-8 w-12 items-center justify-center rounded-full', isActive && 'bg-brand')}><n.icon className="h-5 w-5" aria-hidden /></span>
                {n.label}
                {n.label === 'Alerts' && open.length > 0 && <span className="absolute right-[18%] top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-dot px-1 text-[10px] font-bold">{open.length}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
