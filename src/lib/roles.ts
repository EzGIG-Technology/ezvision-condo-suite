export type PortalRole = 'Building Manager' | 'JMB/MC committee' | 'Security supervisor';

export const PORTAL_ROLES: { role: PortalRole; name: string; email: string; initials: string; access: string }[] = [
  { role: 'Building Manager', name: 'Farah Hanim', email: 'farah.hanim@vistaharmoni.my', initials: 'FH', access: 'Full operations: permits, alerts, residents, reports and settings' },
  { role: 'JMB/MC committee', name: 'Rahman Aziz', email: 'chairman@vistaharmoni.my', initials: 'RA', access: 'Dashboard, reports, watchlist approval, voting and configuration' },
  { role: 'Security supervisor', name: 'Ravi Kumar', email: 'ravi@securiforce.my', initials: 'RK', access: 'Alerts, incidents, guards, visitors and evidence export' },
];

/** Portal pages each role can open, by path segment. The building manager can open everything. */
const PAGES: Record<PortalRole, string[] | 'all'> = {
  'Building Manager': 'all',
  'JMB/MC committee': ['dashboard', 'incidents', 'watchlist', 'community', 'facilities', 'reports', 'rules', 'privacy', 'settings', 'integrations'],
  'Security supervisor': ['dashboard', 'live', 'incidents', 'unregistered', 'search', 'visitors', 'vehicles', 'watchlist', 'guards', 'reports'],
};

export const roleOf = (role?: string): PortalRole => (PORTAL_ROLES.some((r) => r.role === role) ? (role as PortalRole) : 'Building Manager');
export const canOpen = (role: string | undefined, page: string) => { const p = PAGES[roleOf(role)]; return p === 'all' || p.includes(page); };
/** Watchlist entries need committee approval unless the committee added them. */
export const approvesWatchlist = (role?: string) => roleOf(role) === 'JMB/MC committee';
