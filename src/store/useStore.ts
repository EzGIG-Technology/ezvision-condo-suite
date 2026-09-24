import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { makeSeed, type Seed } from '@/data/seed';
import type {
  Alert, AlertStatus, Announcement, Approval, AuditEntry, Booking, Facility, LiftBooking, Parcel, Permit, Resolution, ResidentNotice, Rule, SiteLimits, VoteChoice, Session, Ticket, UnitRecord, Visit, WatchEntry,
} from '@/data/types';
import { code4, hhmm, uid } from '@/lib/utils';

const STORAGE_KEY = 'ezvision-condo-suite:v1';

/**
 * localStorage, but writes made in the same tick are combined into one. An action that calls set() twice
 * (for example, save a message, then add a notice) must not expose the half-done state: other tabs reload
 * on every write, and one that saves in reaction would overwrite the second half.
 */
const pending = new Map<string, string>();
const batchedStorage: StateStorage = {
  getItem: (name) => pending.get(name) ?? localStorage.getItem(name),
  setItem: (name, value) => {
    const first = !pending.has(name);
    pending.set(name, value);
    if (first) queueMicrotask(() => { const v = pending.get(name); pending.delete(name); if (v !== undefined) localStorage.setItem(name, v); });
  },
  removeItem: (name) => { pending.delete(name); localStorage.removeItem(name); },
};

type State = Seed & {
  session: Session;
  // session
  loginPortal: (email: string) => void;
  logoutPortal: () => void;
  loginGuard: (guardId: string) => void;
  logoutGuard: () => void;
  loginResident: () => void;
  logoutResident: () => void;
  // alerts
  createAlert: (a: Omit<Alert, 'id' | 'ref' | 'timeline' | 'status'> & { status?: AlertStatus; timelineText?: string }) => string;
  ackAlert: (id: string, by: string) => void;
  talkDown: (id: string) => void;
  dispatchAlert: (id: string, guard: string) => void;
  onScene: (id: string, guard: string) => void;
  addAlertNote: (id: string, text: string) => void;
  closeAlert: (id: string, outcome: string, policeRef?: string, by?: string) => void;
  reopenAlert: (id: string) => void;
  // unknowns
  resolveFace: (id: string, status: 'known' | 'registered' | 'unresolved', resolution: string) => void;
  watchFace: (id: string, reason?: string) => void;
  linkPlate: (id: string, unit: string) => void;
  watchPlate: (id: string) => void;
  // watchlist
  addWatch: (w: Omit<WatchEntry, 'id' | 'addedAt' | 'lastSeen'>) => void;
  removeWatch: (id: string) => void;
  renewWatch: (id: string) => void;
  // visits
  createVisit: (v: Omit<Visit, 'id'>) => string;
  cancelVisit: (id: string) => void;
  checkInVisit: (id: string, entry: string, verification?: string) => void;
  checkOutVisit: (id: string) => void;
  extendVisit: (id: string, hours: number) => void;
  setVisitSelfie: (id: string) => void;
  // approvals
  createApproval: (a: Omit<Approval, 'id' | 'createdAt' | 'status'>) => string;
  respondApproval: (id: string, approve: boolean, by: string, recurring?: boolean) => void;
  // parcels
  logParcel: (p: Omit<Parcel, 'id' | 'loggedAt' | 'status' | 'code'>) => Parcel;
  collectParcel: (id: string, by: string) => void;
  // permits
  setPermitStatus: (id: string, status: Permit['status']) => void;
  markDepositPaid: (id: string) => void;
  createPermit: (p: Omit<Permit, 'id' | 'submittedAt' | 'status' | 'onSite'>) => string;
  // facilities
  addFacility: (f: Omit<Facility, 'id'>) => string;
  updateFacility: (id: string, patch: Partial<Omit<Facility, 'id'>>) => void;
  removeFacility: (id: string) => void;
  // bookings
  createBooking: (b: Omit<Booking, 'id' | 'status'>) => string;
  cancelBooking: (id: string) => void;
  // service lift and moves
  createLiftBooking: (b: Omit<LiftBooking, 'id'>) => string;
  setLiftStatus: (id: string, status: NonNullable<LiftBooking['status']>) => void;
  setLiftChecklist: (id: string, key: 'pre' | 'post', v: boolean) => void;
  payLiftDeposit: (id: string) => void;
  // guardhouse messages
  sendMessage: (unit: string, from: 'resident' | 'guard', text: string) => void;
  markMessagesRead: (unit: string, reader: 'resident' | 'guard') => void;
  // settings
  setLimits: (patch: Partial<SiteLimits>) => void;
  // e-voting
  createResolution: (r: Pick<Resolution, 'title' | 'detail' | 'meeting' | 'closes'>) => string;
  castVote: (id: string, unit: string, choice: VoteChoice, by: string, proxy: boolean) => boolean;
  closeResolution: (id: string) => void;
  // community
  sendAnnouncement: (a: Omit<Announcement, 'id' | 'sentAt'>) => void;
  setTicketState: (id: string, state: Ticket['state']) => void;
  createTicket: (t: Omit<Ticket, 'id'>) => string;
  // rules
  toggleRule: (id: string) => void;
  updateRule: (id: string, patch: Partial<Rule>) => void;
  // resident
  markNoticesRead: () => void;
  addNotice: (n: Omit<ResidentNotice, 'id' | 'at' | 'read'>) => void;
  payBill: (id: string, method: string) => void;
  setAutoDebit: (v: boolean) => void;
  setFaceEnrolled: (v: boolean) => void;
  // patrol
  verifyCheckpoint: (id: string) => void;
  startNewRound: () => void;
  // misc
  setGuardState: (id: string, state: State['guards'][number]['state'], where?: string) => void;
  updateUnit: (unit: string, patch: Partial<UnitRecord>) => void;
  setNightMode: (v: boolean) => void;
  setFeeRestriction: (v: boolean) => void;
  setRetention: (id: string, keep: string) => void;
  advanceRequest: (id: string) => void;
  log: (e: Omit<AuditEntry, 'id' | 'at'>) => void;
  resetDemo: () => void;
};

const now = () => new Date().toISOString();

/** A special resolution needs 75% of the votes cast for or against; an ordinary one needs a simple majority. */
export const resolutionPasses = (r: Pick<Resolution, 'detail' | 'votes'>) => {
  const cast = r.votes.yes + r.votes.no;
  return cast > 0 && (/special/i.test(r.detail) ? r.votes.yes / cast >= 0.75 : r.votes.yes > r.votes.no);
};

let refCounter = 15;
const nextRef = () => `INC-0923-${String(refCounter++).padStart(3, '0')}`;

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...makeSeed(),
      session: {},

      loginPortal: (email) => set({ session: { ...get().session, portal: { name: 'Farah Hanim', role: 'Building Manager', email } } }),
      logoutPortal: () => set({ session: { ...get().session, portal: undefined } }),
      loginGuard: (guardId) => set({ session: { ...get().session, guardId } }),
      logoutGuard: () => set({ session: { ...get().session, guardId: undefined } }),
      loginResident: () => set({ session: { ...get().session, resident: get().resident } }),
      logoutResident: () => set({ session: { ...get().session, resident: undefined } }),

      createAlert: ({ timelineText, status, ...a }) => {
        const id = uid('al');
        const alert: Alert = { ...a, id, ref: nextRef(), status: status ?? 'open', timeline: [{ at: a.at, text: timelineText ?? a.title, kind: 'detect' }] };
        set({ alerts: [alert, ...get().alerts] });
        return id;
      },
      ackAlert: (id, by) =>
        set({ alerts: get().alerts.map((a) => (a.id === id && a.status === 'open' ? { ...a, status: 'acknowledged', owner: by, timeline: [...a.timeline, { at: now(), text: `Acknowledged by ${by}`, kind: 'guard' }] } : a)) }),
      talkDown: (id) =>
        set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, talkDown: true, timeline: [...a.timeline, { at: now(), text: 'AI talk-down played on the nearest speaker', kind: 'action' }] } : a)) }),
      dispatchAlert: (id, guard) => {
        set({
          alerts: get().alerts.map((a) => (a.id === id ? { ...a, status: 'dispatched', owner: guard, timeline: [...a.timeline, { at: now(), text: `${guard} dispatched`, kind: 'guard' }] } : a)),
          guards: get().guards.map((g) => (g.name === guard ? { ...g, state: 'Responding', where: `Responding · ${get().alerts.find((a) => a.id === id)?.where ?? ''}` } : g)),
        });
      },
      onScene: (id, guard) =>
        set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, status: 'on_scene', owner: guard, timeline: [...a.timeline, { at: now(), text: `${guard} on scene`, kind: 'guard' }] } : a)) }),
      addAlertNote: (id, text) =>
        set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, timeline: [...a.timeline, { at: now(), text, kind: 'action' }] } : a)) }),
      closeAlert: (id, outcome, policeRef, by = 'Farah Hanim') => {
        const a = get().alerts.find((x) => x.id === id);
        set({
          alerts: get().alerts.map((x) => (x.id === id ? { ...x, status: 'closed', outcome, policeRef, timeline: [...x.timeline, { at: now(), text: `Closed: ${outcome}`, kind: 'close' }] } : x)),
          guards: get().guards.map((g) => (a && g.name === a.owner && g.state === 'Responding' ? { ...g, state: g.id === 'g-2' ? 'At post' : 'Patrolling', where: g.id === 'g-2' ? 'Guardhouse · Main gate' : 'Patrol round 3' } : g)),
        });
        get().log({ who: by, role: by === 'Farah Hanim' ? 'Building Manager' : 'Guard', action: 'Closed', record: `${a?.ref ?? id} · ${outcome}` });
      },
      reopenAlert: (id) =>
        set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, status: 'open', outcome: undefined, timeline: [...a.timeline, { at: now(), text: 'Reopened', kind: 'system' }] } : a)) }),

      resolveFace: (id, status, resolution) => set({ unknownFaces: get().unknownFaces.map((f) => (f.id === id ? { ...f, status, resolution } : f)) }),
      watchFace: (id, reason) => {
        const f = get().unknownFaces.find((x) => x.id === id);
        if (!f) return;
        set({ unknownFaces: get().unknownFaces.map((x) => (x.id === id ? { ...x, status: 'watchlisted', resolution: 'Added to watchlist' } : x)) });
        get().addWatch({ kind: 'person', name: `Unknown U-${id.toUpperCase().replace('UF-', '0923-0')}`, variant: f.variant, reason: reason ?? `${f.description}. Seen at ${f.where}.`, level: 'Alert all guards', addedBy: 'Farah Hanim', until: '23 Dec 2026' });
      },
      linkPlate: (id, unit) => set({ unknownPlates: get().unknownPlates.map((p) => (p.id === id ? { ...p, status: 'linked', outcome: `Linked to ${unit}` } : p)) }),
      watchPlate: (id) => {
        const p = get().unknownPlates.find((x) => x.id === id);
        if (!p) return;
        set({ unknownPlates: get().unknownPlates.map((x) => (x.id === id ? { ...x, status: 'watchlisted' } : x)) });
        if (!get().watchlist.some((w) => w.plate === p.plate)) {
          get().addWatch({ kind: 'vehicle', name: 'Unknown vehicle', plate: p.plate, vehicle: p.vehicle, reason: `${p.attempts} entry attempts with no host`, level: 'Alert only', addedBy: 'Farah Hanim', until: '30 Oct 2026' });
        }
      },

      addWatch: (w) => {
        set({ watchlist: [{ ...w, id: uid('w'), addedAt: now(), lastSeen: 'Not yet' }, ...get().watchlist] });
        get().log({ who: w.addedBy, role: 'Building Manager', action: 'Added', record: `Watchlist entry ${w.plate ?? w.name}` });
      },
      removeWatch: (id) => set({ watchlist: get().watchlist.filter((w) => w.id !== id) }),
      renewWatch: (id) => set({ watchlist: get().watchlist.map((w) => (w.id === id ? { ...w, until: '23 Mar 2027' } : w)) }),

      createVisit: (v) => {
        const id = uid('v');
        set({ visits: [{ ...v, id }, ...get().visits] });
        return id;
      },
      cancelVisit: (id) => set({ visits: get().visits.map((v) => (v.id === id ? { ...v, status: 'cancelled' } : v)) }),
      checkInVisit: (id, entry, verification) => {
        const v = get().visits.find((x) => x.id === id);
        set({ visits: get().visits.map((x) => (x.id === id ? { ...x, status: 'on_site', entry, checkIn: now(), verification: verification ?? x.verification ?? 'Pass verified' } : x)) });
        if (v && v.unit === get().resident.unit) {
          get().addNotice({ unit: v.unit, title: `${v.name} arrived`, body: `Verified at the gate by ${entry.toLowerCase()}.${v.plate ? ' Visitor parking: bay V12, B1.' : ''}`, kind: 'visitor', link: '/app/visitors' });
        }
      },
      checkOutVisit: (id) => {
        const v = get().visits.find((x) => x.id === id);
        set({ visits: get().visits.map((x) => (x.id === id ? { ...x, status: 'left', checkOut: now() } : x)) });
        if (v && v.unit === get().resident.unit) get().addNotice({ unit: v.unit, title: `${v.name} left`, body: 'Checked out at the gate.', kind: 'visitor' });
      },
      extendVisit: (id, hours) =>
        set({ visits: get().visits.map((v) => (v.id === id ? { ...v, validTo: new Date(new Date(v.validTo).getTime() + hours * 3600_000).toISOString() } : v)) }),
      setVisitSelfie: (id) => set({ visits: get().visits.map((v) => (v.id === id ? { ...v, selfie: true } : v)) }),

      createApproval: (a) => {
        const id = uid('ap');
        set({ approvals: [{ ...a, id, createdAt: now(), status: 'waiting' }, ...get().approvals] });
        return id;
      },
      respondApproval: (id, approve, by, recurring) => {
        const ap = get().approvals.find((a) => a.id === id);
        if (!ap || ap.status !== 'waiting') return;
        let visitId: string | undefined;
        if (approve) {
          const until = new Date();
          until.setHours(23, 30, 0, 0);
          visitId = get().createVisit({
            name: ap.visitorName, phone: '—', type: /tutor/i.test(ap.purpose) ? 'tutor' : /tech|contract|aircond/i.test(ap.purpose) ? 'contractor' : 'guest',
            unit: ap.unit, host: by, plate: ap.plate, status: 'expected', validFrom: now(), validTo: until.toISOString(), selfie: false, faceVariant: ap.faceVariant, people: 1,
            verification: `IC ••••${ap.idLast4} + face`, createdBy: 'guard', note: 'Walk-in approved',
            recurringDays: recurring ? [false, true, false, true, false, false, false] : undefined,
          });
        }
        set({ approvals: get().approvals.map((a) => (a.id === id ? { ...a, status: approve ? 'approved' : 'declined', respondedAt: now(), respondedBy: by, visitId } : a)) });
      },

      logParcel: (p) => {
        const parcel: Parcel = { ...p, id: uid('p'), loggedAt: now(), status: 'waiting', code: code4() };
        set({ parcels: [parcel, ...get().parcels] });
        if (p.unit === get().resident.unit) {
          get().addNotice({ unit: p.unit, title: 'Parcel waiting', body: `${p.courier} parcel on shelf ${p.shelf}. Pickup code ${parcel.code}.`, kind: 'parcel', link: '/app/parcels' });
        }
        return parcel;
      },
      collectParcel: (id, by) => set({ parcels: get().parcels.map((p) => (p.id === id ? { ...p, status: 'collected', collectedAt: now(), collectedBy: by } : p)) }),

      setPermitStatus: (id, status) => {
        const p = get().permits.find((x) => x.id === id);
        set({ permits: get().permits.map((x) => (x.id === id ? { ...x, status } : x)) });
        get().log({ who: 'Farah Hanim', role: 'Building Manager', action: status === 'active' ? 'Approved' : 'Changed', record: `Permit ${id} → ${status.replace('_', ' ')}` });
        if (p && p.unit === get().resident.unit) {
          const label = status === 'active' ? 'approved' : status === 'changes_requested' ? 'needs changes' : status === 'rejected' ? 'was not approved' : status.replace('_', ' ');
          get().addNotice({ unit: p.unit, title: `Permit ${id} ${label}`, body: `${p.scope} · ${p.start} to ${p.end}`, kind: 'permit', link: '/app/renovation' });
        }
      },
      markDepositPaid: (id) => set({ permits: get().permits.map((p) => (p.id === id ? { ...p, depositPaid: true, status: p.status === 'awaiting_deposit' ? 'active' : p.status } : p)) }),
      createPermit: (p) => {
        const id = `RN-0${430 + get().permits.length}`;
        set({ permits: [{ ...p, id, submittedAt: now(), status: 'review', onSite: 0 }, ...get().permits] });
        return id;
      },

      addFacility: (f) => {
        const id = uid('fc');
        set({ facilities: [...get().facilities, { ...f, id }] });
        return id;
      },
      updateFacility: (id, patch) => {
        const old = get().facilities.find((f) => f.id === id);
        if (!old) return;
        const renamed = patch.name !== undefined && patch.name !== old.name;
        set({
          facilities: get().facilities.map((f) => (f.id === id ? { ...f, ...patch } : f)),
          // Bookings refer to a facility by name, so carry a rename over to them.
          ...(renamed ? { bookings: get().bookings.map((b) => (b.facility === old.name ? { ...b, facility: patch.name! } : b)) } : {}),
        });
      },
      removeFacility: (id) => {
        const f = get().facilities.find((x) => x.id === id);
        if (!f) return;
        const today = new Date(new Date().setHours(0, 0, 0, 0));
        set({
          facilities: get().facilities.filter((x) => x.id !== id),
          bookings: get().bookings.map((b) => (b.facility === f.name && b.status === 'confirmed' && new Date(b.date) >= today ? { ...b, status: 'cancelled' } : b)),
        });
      },

      createBooking: (b) => {
        const id = uid('bk');
        set({ bookings: [...get().bookings, { ...b, id, status: 'confirmed' }] });
        if (b.unit === get().resident.unit && b.fee + b.deposit > 0) {
          set({ bills: [{ id: uid('b'), unit: b.unit, label: `${b.facility} booking`, amount: b.fee + b.deposit, status: 'paid', paidAt: 'Today', method: 'FPX', lines: [] }, ...get().bills] });
        }
        return id;
      },
      cancelBooking: (id) => set({ bookings: get().bookings.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)) }),

      createLiftBooking: (b) => {
        const id = uid('lb');
        set({ liftBookings: [...get().liftBookings, { ...b, id }] });
        return id;
      },
      setLiftStatus: (id, status) => {
        const b = get().liftBookings.find((x) => x.id === id);
        if (!b) return;
        let visitId = b.visitId;
        // An approved move puts the mover's lorry on the guard's expected list for that slot.
        if (status === 'approved' && !visitId && b.lorryPlate) {
          const [from, to] = b.slot.split(' to ').map((t) => Number(t.slice(0, 2)));
          const start = new Date(b.date); start.setHours(from - 1, 0, 0, 0);
          const end = new Date(b.date); end.setHours(to + 1, 0, 0, 0);
          const host = get().units.find((u) => u.unit === b.unit)?.name ?? b.unit;
          visitId = get().createVisit({
            name: b.mover ?? 'Movers', phone: '—', type: 'contractor', unit: b.unit, host, plate: b.lorryPlate, status: 'expected',
            validFrom: start.toISOString(), validTo: end.toISOString(), selfie: false, faceVariant: 5, people: b.crew ?? 1,
            note: `${b.what} · ${b.lift} · ${b.slot}`, createdBy: 'management',
          });
        }
        if (status === 'rejected' && visitId) get().cancelVisit(visitId);
        const depositRefunded = status === 'completed' && b.depositPaid ? true : b.depositRefunded;
        set({ liftBookings: get().liftBookings.map((x) => (x.id === id ? { ...x, status, visitId, depositRefunded } : x)) });
        const day = new Date(b.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        const body = status === 'approved' ? `${b.what} on ${day}, ${b.slot}. The ${b.lift.toLowerCase()} is reserved and the guard expects ${b.lorryPlate ?? 'your mover'}.`
          : status === 'rejected' ? `${b.what} on ${day} was not approved. Please pick another slot.`
          : status === 'completed' ? `${b.what} is closed.${b.depositPaid && b.deposit ? ` Your deposit of RM ${b.deposit} will be refunded.` : ''}` : '';
        if (body) get().addNotice({ unit: b.unit, title: status === 'approved' ? 'Move approved' : status === 'rejected' ? 'Move not approved' : 'Move completed', body, kind: 'permit', link: '/app/move' });
      },
      setLiftChecklist: (id, key, v) => set({ liftBookings: get().liftBookings.map((x) => (x.id === id ? { ...x, checklist: { pre: false, post: false, ...x.checklist, [key]: v } } : x)) }),
      payLiftDeposit: (id) => {
        const b = get().liftBookings.find((x) => x.id === id);
        if (!b) return;
        set({ liftBookings: get().liftBookings.map((x) => (x.id === id ? { ...x, depositPaid: true } : x)) });
        if (b.deposit) set({ bills: [{ id: uid('b'), unit: b.unit, label: `${b.what} damage deposit (refundable)`, amount: b.deposit, status: 'paid', paidAt: `Today ${hhmm(now())}`, method: 'FPX', lines: [] }, ...get().bills] });
      },

      setLimits: (patch) => set({ limits: { ...get().limits, ...patch } }),

      createResolution: (r) => {
        const id = uid('rs');
        set({ resolutions: [{ ...r, id, status: 'open', votes: { yes: 0, no: 0, abstain: 0 }, voted: {} }, ...get().resolutions] });
        return id;
      },
      castVote: (id, unit, choice, by, proxy) => {
        const r = get().resolutions.find((x) => x.id === id);
        if (!r || r.status !== 'open' || r.voted[unit]) return false;
        set({ resolutions: get().resolutions.map((x) => (x.id === id ? { ...x, votes: { ...x.votes, [choice]: x.votes[choice] + 1 }, voted: { ...x.voted, [unit]: { choice, by, proxy, at: now() } } } : x)) });
        return true;
      },
      closeResolution: (id) =>
        set({ resolutions: get().resolutions.map((x) => (x.id === id ? { ...x, status: resolutionPasses(x) ? 'passed' : 'not_passed', closes: now() } : x)) }),

      sendMessage: (unit, from, text) => {
        set({ messages: [...get().messages, { id: uid('gm'), unit, from, text, at: now(), read: false }] });
        if (from === 'guard') get().addNotice({ unit, title: 'Guardhouse replied', body: text, kind: 'message', link: '/app/guardhouse' });
      },
      markMessagesRead: (unit, reader) =>
        set({ messages: get().messages.map((m) => (m.unit === unit && m.from !== reader && !m.read ? { ...m, read: true } : m)) }),

      sendAnnouncement: (a) => {
        set({ announcements: [{ ...a, id: uid('an'), sentAt: now() }, ...get().announcements] });
        if (/all|tower a/i.test(a.audience)) get().addNotice({ unit: get().resident.unit, title: a.title, body: a.body, kind: 'announcement' });
        get().log({ who: a.sentBy, role: 'Building Manager', action: 'Sent', record: `Announcement "${a.title}"` });
      },
      setTicketState: (id, state) => {
        const t = get().tickets.find((x) => x.id === id);
        set({ tickets: get().tickets.map((x) => (x.id === id ? { ...x, state } : x)) });
        if (t?.unit && t.raisedBy === 'resident' && t.state !== state) {
          get().addNotice({ unit: t.unit, title: `${t.id} is ${state.toLowerCase()}`, body: t.title, kind: 'ticket', link: '/app/report' });
        }
      },
      createTicket: (t) => {
        const id = `TK-${1183 + get().tickets.length}`;
        set({ tickets: [{ ...t, id, createdAt: t.createdAt ?? now() }, ...get().tickets] });
        return id;
      },

      toggleRule: (id) => set({ rules: get().rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) }),
      updateRule: (id, patch) => set({ rules: get().rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) }),

      markNoticesRead: () => set({ notices: get().notices.map((n) => ({ ...n, read: true })) }),
      addNotice: (n) => set({ notices: [{ ...n, id: uid('n'), at: now(), read: false }, ...get().notices] }),
      payBill: (id, method) =>
        set({ bills: get().bills.map((b) => (b.id === id ? { ...b, status: 'paid', paidAt: `Today ${hhmm(now())}`, method } : b)) }),
      setAutoDebit: (v) => set({ autoDebit: v }),
      setFaceEnrolled: (v) => set({ faceEnrolled: v }),

      verifyCheckpoint: (id) => {
        const cps = get().checkpoints;
        const idx = cps.findIndex((c) => c.id === id);
        set({
          checkpoints: cps.map((c, i) => {
            if (c.id === id) return { ...c, status: 'done', at: now() };
            if (i === idx + 1 && c.status === 'todo') return { ...c, status: 'next' };
            return c;
          }),
        });
      },
      startNewRound: () => set({ checkpoints: get().checkpoints.map((c, i) => ({ ...c, status: i === 0 ? 'next' : 'todo', at: undefined })), patrolStartedAt: now() }),

      setGuardState: (id, state, where) => set({ guards: get().guards.map((g) => (g.id === id ? { ...g, state, where: where ?? g.where } : g)) }),
      updateUnit: (unit, patch) => set({ units: get().units.map((u) => (u.unit === unit ? { ...u, ...patch } : u)) }),
      setNightMode: (v) => set({ nightMode: v }),
      setFeeRestriction: (v) => set({ feeRestriction: v }),
      setRetention: (id, keep) => set({ retention: get().retention.map((r) => (r.id === id ? { ...r, keep } : r)) }),
      advanceRequest: (id) =>
        set({ dataRequests: get().dataRequests.map((r) => (r.id === id ? { ...r, state: r.state === 'New' ? 'In progress' : 'Done' } : r)) }),
      log: (e) => set({ audit: [{ ...e, id: uid('au'), at: now() }, ...get().audit].slice(0, 200) }),

      resetDemo: () => {
        const session = get().session;
        set({ ...makeSeed(), session });
      },
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => batchedStorage),
    },
  ),
);

// Keep open tabs in sync (e.g. guard tablet in one tab, resident app in another).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) useStore.persist.rehydrate();
  });
}

export const useCurrentGuard = () => {
  const guardId = useStore((s) => s.session.guardId);
  const guards = useStore((s) => s.guards);
  return guards.find((g) => g.id === guardId) ?? guards[1];
};
