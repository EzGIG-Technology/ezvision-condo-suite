import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, Bell, Building2, ChevronsUpDown, FileText, LayoutGrid, Lock, LogOut, Megaphone, Menu, Search, ShieldCheck, SlidersHorizontal,
  Users, UserX, Car, ClipboardList, Ban, Video, Sparkles, Grid3X3, Check, CalendarDays, Settings as SettingsIcon, Cable,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { PageOutlet } from '@/components/PageBoundary';
import { Logo, CamFeed } from '@/components/vision';
import { Drawer, Modal, Progress } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { SITE } from '@/data/seed';
import { cn, relative } from '@/lib/utils';
import { useNow } from '@/lib/hooks';
import { toast } from '@/store/toast';
import { canOpen, PORTAL_ROLES, roleOf } from '@/lib/roles';

type NavItem = { to: string; label: string; icon: typeof LayoutGrid; badge?: () => number; tone?: 'red' | 'blue' };

/** Portal pages with personal data (faces, plates, names, IC details). Opening them is logged. */
const PERSONAL_DATA_PAGES = ['residents', 'visitors', 'unregistered', 'watchlist', 'incidents', 'search', 'live'];

export const PORTAL_TITLES: Record<string, [string, string]> = {
  dashboard: ['Command Center', 'Overview'],
  live: ['Live View', 'Overview'],
  incidents: ['Alerts & Incidents', 'Overview'],
  unregistered: ['Unregistered Gallery', 'Overview'],
  search: ['Evidence Search', 'Overview'],
  visitors: ['Visitors', 'Access'],
  vehicles: ['Vehicles & Carpark', 'Access'],
  permits: ['Permits & Contractors', 'Access'],
  residents: ['Residents & Units', 'Access'],
  watchlist: ['Watchlist', 'Access'],
  guards: ['Guard Performance', 'Operations'],
  community: ['Community', 'Operations'],
  facilities: ['Facilities', 'Operations'],
  reports: ['Reports', 'Operations'],
  rules: ['Detection Rules', 'System'],
  privacy: ['Privacy & PDPA', 'System'],
  settings: ['Site settings', 'System'],
  integrations: ['Integrations', 'System'],
};

function useNav() {
  const role = useStore((s) => s.session.portal?.role);
  const alerts = useStore((s) => s.alerts);
  const faces = useStore((s) => s.unknownFaces);
  const permits = useStore((s) => s.permits);
  return useMemo(() => {
    const openAlerts = alerts.filter((a) => a.status !== 'closed').length;
    const unresolved = faces.filter((f) => f.status === 'unresolved').length;
    const review = permits.filter((p) => p.status === 'review').length;
    const groups: { label: string; items: NavItem[] }[] = [
      { label: 'Overview', items: [
        { to: '/portal/dashboard', label: 'Command Center', icon: LayoutGrid },
        { to: '/portal/live', label: 'Live View', icon: Video },
        { to: '/portal/incidents', label: 'Alerts & Incidents', icon: AlertTriangle, badge: () => openAlerts, tone: 'red' },
        { to: '/portal/unregistered', label: 'Unregistered', icon: UserX, badge: () => unresolved, tone: 'red' },
        { to: '/portal/search', label: 'Evidence Search', icon: Search },
      ] },
      { label: 'Access', items: [
        { to: '/portal/visitors', label: 'Visitors', icon: Users },
        { to: '/portal/vehicles', label: 'Vehicles & Carpark', icon: Car },
        { to: '/portal/permits', label: 'Permits & Contractors', icon: ClipboardList, badge: () => review, tone: 'blue' },
        { to: '/portal/residents', label: 'Residents & Units', icon: Building2 },
        { to: '/portal/watchlist', label: 'Watchlist', icon: Ban },
      ] },
      { label: 'Operations', items: [
        { to: '/portal/guards', label: 'Guard Performance', icon: ShieldCheck },
        { to: '/portal/community', label: 'Community', icon: Megaphone },
        { to: '/portal/facilities', label: 'Facilities', icon: CalendarDays },
        { to: '/portal/reports', label: 'Reports', icon: FileText },
      ] },
      { label: 'System', items: [
        { to: '/portal/rules', label: 'Detection Rules', icon: SlidersHorizontal },
        { to: '/portal/privacy', label: 'Privacy & PDPA', icon: Lock },
        { to: '/portal/integrations', label: 'Integrations', icon: Cable },
        { to: '/portal/settings', label: 'Site settings', icon: SettingsIcon },
      ] },
    ];
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => canOpen(role, it.to.split('/')[2])) }))
      .filter((g) => g.items.length);
  }, [alerts, faces, permits, role]);
}

function Sidebar({ onNavigate, onSiteSwitch }: { onNavigate?: () => void; onSiteSwitch: () => void }) {
  const groups = useNav();
  const session = useStore((s) => s.session.portal);
  const logout = useStore((s) => s.logoutPortal);
  const navigate = useNavigate();
  return (
    <nav aria-label="Main" className="flex h-full flex-col bg-navy px-4 pb-4 pt-5 text-[#C9D3EE]">
      <Link to="/portal/dashboard" onClick={onNavigate} className="px-2 pb-5">
        <Logo dark sub="Condo Suite" />
      </Link>
      <button type="button" onClick={onSiteSwitch} className="flex w-full items-center gap-2.5 rounded-xl border border-navy-600 bg-navy-800 px-3 py-2.5 text-left text-white hover:bg-navy-700">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#1A2B66] text-brand-light"><Building2 className="h-4 w-4" /></span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-bold">{SITE.name}</span>
          <span className="text-[11px] text-[#8D9CC7]">{SITE.towers} towers · {SITE.units} units</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 text-[#8D9CC7]" />
      </button>
      <div className="mt-5 flex flex-1 flex-col gap-4 overflow-y-auto scrollbar-thin">
        {groups.map((g) => (
          <div key={g.label} className="flex flex-col gap-0.5">
            <div className="px-3 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#7C8BB8]">{g.label}</div>
            {g.items.map((it) => {
              const n = it.badge?.() ?? 0;
              return (
                <NavLink
                  key={it.to}
                  to={it.to}
                  onClick={onNavigate}
                  className={({ isActive }) => cn('flex h-[38px] items-center gap-3 rounded-[10px] px-3 text-[13.5px] transition-colors', isActive ? 'bg-brand font-bold text-white' : 'font-medium hover:bg-white/5 hover:text-white')}
                >
                  <it.icon className="h-[18px] w-[18px]" aria-hidden />
                  <span className="flex-1">{it.label}</span>
                  {n > 0 && <span className={cn('flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold text-white', it.tone === 'red' ? 'bg-danger-dot' : 'bg-brand')}>{n}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-[#1C2B63] pt-4">
        <Link to="/portal/guards" onClick={onNavigate} className="flex flex-col gap-2 rounded-xl bg-navy-800 p-3 hover:bg-navy-700">
          <div className="flex justify-between text-xs"><span className="font-semibold">Cameras online</span><span className="font-bold text-white">{SITE.camerasOnline} / {SITE.cameras}</span></div>
          <Progress value={(SITE.camerasOnline / SITE.cameras) * 100} color="#2DD4BF" track="#22336E" h={6} label="Cameras online" />
          <div className="text-[11px] text-[#8D9CC7]">Edge server · 38% GPU · 11 ms</div>
        </Link>
        <div className="flex items-center gap-2.5 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-bright text-[13px] font-extrabold text-[#062A26]">{PORTAL_ROLES.find((r) => r.role === roleOf(session?.role))?.initials ?? 'FH'}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-bold text-white">{session?.name ?? 'Farah Hanim'}</span>
            <span className="text-[11.5px] text-[#8D9CC7]">{session?.role ?? 'Building Manager'}</span>
          </span>
          <button
            type="button"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => { logout(); navigate('/login'); toast.info('Signed out'); }}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] text-[#8D9CC7] hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function NotificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const allAlerts = useStore((s) => s.alerts);
  const allApprovals = useStore((s) => s.approvals);
  const allPermits = useStore((s) => s.permits);
  const alerts = allAlerts.filter((a) => a.status !== 'closed');
  const approvals = allApprovals.filter((a) => a.status === 'waiting');
  const permits = allPermits.filter((p) => p.status === 'review');
  const navigate = useNavigate();
  const go = (to: string) => { onClose(); navigate(to); };
  return (
    <Drawer open={open} onClose={onClose} title="Notifications">
      <div className="flex flex-col">
        <div className="px-5 pb-2 pt-4 eyebrow">Open alerts · {alerts.length}</div>
        {alerts.map((a) => (
          <button key={a.id} type="button" onClick={() => go(`/portal/incidents/${a.id}`)} className="flex items-start gap-3 border-t border-line-soft px-5 py-3 text-left hover:bg-ice">
            <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', a.severity === 'critical' || a.severity === 'high' ? 'bg-danger-dot' : a.severity === 'warning' ? 'bg-warn' : 'bg-brand')} />
            <span className="flex flex-col gap-0.5">
              <span className="text-[13.5px] font-bold">{a.title}</span>
              <span className="text-xs text-muted">{a.where} · {relative(a.at)}</span>
            </span>
          </button>
        ))}
        {approvals.length > 0 && <div className="px-5 pb-2 pt-4 eyebrow">Walk-ins waiting · {approvals.length}</div>}
        {approvals.map((a) => (
          <button key={a.id} type="button" onClick={() => go('/portal/visitors')} className="flex flex-col gap-0.5 border-t border-line-soft px-5 py-3 text-left hover:bg-ice">
            <span className="text-[13.5px] font-bold">{a.visitorName} → {a.unit}</span>
            <span className="text-xs text-muted">{a.purpose} · {relative(a.createdAt)}</span>
          </button>
        ))}
        {permits.length > 0 && <div className="px-5 pb-2 pt-4 eyebrow">Permits to review · {permits.length}</div>}
        {permits.map((p) => (
          <button key={p.id} type="button" onClick={() => go(`/portal/permits?id=${p.id}`)} className="flex flex-col gap-0.5 border-t border-line-soft px-5 py-3 text-left hover:bg-ice">
            <span className="text-[13.5px] font-bold">{p.id} · {p.unit}</span>
            <span className="text-xs text-muted">{p.scope}</span>
          </button>
        ))}
      </div>
    </Drawer>
  );
}

function AgentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const top = useStore((s) => s.alerts.find((a) => a.status !== 'closed' && (a.severity === 'critical' || a.severity === 'high')));
  const navigate = useNavigate();
  return (
    <Modal open={open} onClose={onClose} title="EzVision Agent" description="Watching every camera and surfacing the most important event about once a minute." size="lg"
      footer={<>
        <Button onClick={onClose}>Close</Button>
        <Button variant="primary" onClick={() => { onClose(); navigate('/portal/live'); }} icon={<Grid3X3 className="h-4 w-4" />}>Open agent wall</Button>
      </>}
    >
      {top ? (
        <div className="flex flex-col gap-3">
          <CamFeed scene={top.scene} tone="red" tag={top.title} cam={top.camera} time={relative(top.at)} size="lg" />
          <p className="text-[13.5px] leading-relaxed text-muted-dark">{top.summary}</p>
          <Button variant="danger" onClick={() => { onClose(); navigate(`/portal/incidents/${top.id}`); }}>Open incident {top.ref}</Button>
        </div>
      ) : (
        <p className="text-sm text-muted">Nothing needs attention right now. All cameras are quiet.</p>
      )}
    </Modal>
  );
}

function SiteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sites = [
    { name: SITE.name, meta: '3 towers · 612 units · 48 cameras', current: true },
    { name: 'Residensi Taman Sentosa', meta: '2 towers · 380 units · 26 cameras · pilot from Nov', current: false },
  ];
  return (
    <Modal open={open} onClose={onClose} title="Switch site" description="Your account manages these communities." size="sm">
      <div className="flex flex-col gap-2">
        {sites.map((s) => (
          <button key={s.name} type="button" onClick={() => { onClose(); if (!s.current) toast.info(`${s.name} is not live yet`, 'The pilot starts in November. You will get access automatically.'); }}
            className={cn('flex items-center gap-3 rounded-xl border p-3 text-left', s.current ? 'border-brand bg-brand-soft' : 'border-line hover:bg-ice')}>
            <Building2 className="h-5 w-5 text-brand" />
            <span className="flex flex-1 flex-col"><span className="text-[13.5px] font-bold">{s.name}</span><span className="text-xs text-muted">{s.meta}</span></span>
            {s.current && <Check className="h-4 w-4 text-brand" />}
          </button>
        ))}
      </div>
    </Modal>
  );
}

function NoAccess({ role, page }: { role: string; page: string }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center" role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ice text-muted"><Lock className="h-5 w-5" /></span>
      <h2 className="text-lg font-extrabold">{page} is not part of your role</h2>
      <p className="max-w-md text-[13.5px] text-muted">Signed in as {role}. Ask the building manager if you need access. Every attempt to open a page is recorded in the audit log.</p>
      <Link to="/portal/dashboard" className="font-bold text-brand">Go to the Command Center</Link>
    </div>
  );
}

export default function PortalLayout() {
  const session = useStore((s) => s.session.portal);
  const openCount = useStore((s) => s.alerts.filter((a) => a.status !== 'closed').length);
  const [menu, setMenu] = useState(false);
  const [notif, setNotif] = useState(false);
  const [agent, setAgent] = useState(false);
  const [site, setSite] = useState(false);
  const [q, setQ] = useState('');
  const loc = useLocation();
  const navigate = useNavigate();
  const now = useNow(15000);
  const key = loc.pathname.split('/')[2] ?? 'dashboard';
  const [title, crumb] = PORTAL_TITLES[key] ?? ['Command Center', 'Overview'];

  useEffect(() => {
    document.title = `${title} · EzVision Condo Suite`;
    setMenu(false);
  }, [title, loc.pathname]);

  // Views of pages that show personal data go in the PDPA audit log.
  useEffect(() => {
    const me = useStore.getState().session.portal;
    if (!me || !PERSONAL_DATA_PAGES.includes(key) || !canOpen(me.role, key)) return;
    const detail = loc.pathname.split('/')[3];
    useStore.getState().log({ who: me.name, role: me.role, action: 'Viewed', record: `${title}${detail ? ` · ${decodeURIComponent(detail)}` : ''}` });
  }, [key, title, loc.pathname]);

  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate(`/portal/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="min-h-screen bg-ice lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar onSiteSwitch={() => setSite(true)} />
      </aside>
      <Drawer open={menu} onClose={() => setMenu(false)} title="Menu" side="left" width={300}>
        <div className="h-full">
          <Sidebar onNavigate={() => setMenu(false)} onSiteSwitch={() => { setMenu(false); setSite(true); }} />
        </div>
      </Drawer>
      <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-[76px] lg:px-8">
        <button type="button" aria-label="Open menu" onClick={() => setMenu(true)} className="-ml-1 flex h-10 w-10 items-center justify-center rounded-[10px] text-navy hover:bg-ice lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="hidden items-center gap-1.5 text-xs font-semibold text-muted sm:flex"><span>{SITE.name}</span><span aria-hidden>/</span><span>{crumb}</span></div>
          <h1 className="truncate text-lg font-extrabold tracking-tight lg:text-[21px]">{title}</h1>
        </div>
        {canOpen(session.role, 'search') && <form onSubmit={submit} role="search" className="hidden h-10 w-72 items-center gap-2 rounded-[10px] border border-line bg-ice px-3 text-muted md:flex xl:w-80">
          <Search className="h-4 w-4" aria-hidden />
          <label htmlFor="global-search" className="sr-only">Search</label>
          <input id="global-search" value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder='Plate, unit, name or "red Myvi last night"' className="min-w-0 flex-1 bg-transparent text-[13px] text-navy outline-none placeholder:text-[#8C95B0]" />
        </form>}
        {canOpen(session.role, 'search') && <button type="button" aria-label="Search" onClick={() => navigate('/portal/search')} className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-white md:hidden"><Search className="h-[18px] w-[18px]" /></button>}
        <button type="button" onClick={() => setAgent(true)} className="hidden h-10 items-center gap-2 whitespace-nowrap rounded-full bg-teal-soft px-3.5 text-[12.5px] font-bold text-teal-dark hover:bg-[#d2efea] xl:flex">
          <span className="h-2 w-2 animate-pulse2 rounded-full bg-teal shadow-[0_0_0_4px_rgba(20,163,143,.2)]" />
          <Sparkles className="h-3.5 w-3.5" aria-hidden />AI Agent · {SITE.cameras} cameras
        </button>
        <div className="hidden flex-col items-end leading-tight sm:flex">
          <span className="font-mono text-[15px] font-bold">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-[11.5px] font-semibold text-muted">{now.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
        </div>
        <button type="button" aria-label={`Notifications, ${openCount} open alerts`} onClick={() => setNotif(true)} className="relative flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-white hover:bg-ice">
          <Bell className="h-[18px] w-[18px]" />
          {openCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-danger-dot px-1 text-[10px] font-bold text-white">{openCount}</span>}
        </button>
      </header>
      <main className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        {key in PORTAL_TITLES && !canOpen(session.role, key) ? <NoAccess role={roleOf(session.role)} page={title} /> : <PageOutlet />}
      </main>
      <NotificationsDrawer open={notif} onClose={() => setNotif(false)} />
      <AgentModal open={agent} onClose={() => setAgent(false)} />
      <SiteModal open={site} onClose={() => setSite(false)} />
    </div>
  );
}
