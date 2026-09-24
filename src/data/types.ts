export type Scene = 'gate' | 'lobby' | 'fence' | 'carpark' | 'corridor' | 'pool' | 'bin' | 'sidegate' | 'guardpost';
export type Tone = 'red' | 'amber' | 'teal' | 'blue';
export type Severity = 'critical' | 'high' | 'warning' | 'nuisance' | 'info';
export type AlertStatus = 'open' | 'acknowledged' | 'dispatched' | 'on_scene' | 'closed';

export interface TimelineEntry {
  at: string;
  text: string;
  kind: 'detect' | 'system' | 'action' | 'guard' | 'close';
}

export interface Alert {
  id: string;
  ref: string;
  category: 'unregistered' | 'perimeter' | 'carpark' | 'vehicle' | 'safety' | 'nuisance' | 'contractor' | 'sos' | 'report' | 'operations';
  title: string;
  where: string;
  camera: string;
  scene: Scene;
  at: string;
  severity: Severity;
  status: AlertStatus;
  owner?: string;
  faceVariant?: number;
  plate?: string;
  summary: string;
  timeline: TimelineEntry[];
  outcome?: string;
  policeRef?: string;
  unit?: string;
  unknownId?: string;
  talkDown?: boolean;
}

export type VisitType = 'guest' | 'contractor' | 'rider' | 'helper' | 'driver' | 'event' | 'family' | 'tutor';
export type VisitStatus = 'expected' | 'on_site' | 'left' | 'cancelled' | 'denied';

export interface Visit {
  id: string;
  name: string;
  phone: string;
  type: VisitType;
  unit: string;
  host: string;
  plate?: string;
  status: VisitStatus;
  entry?: string;
  checkIn?: string;
  checkOut?: string;
  validFrom: string;
  validTo: string;
  verification?: string;
  selfie: boolean;
  faceVariant: number;
  people: number;
  recurringDays?: boolean[];
  note?: string;
  createdBy: 'resident' | 'guard' | 'management';
  /** Riders: lobby drop-off zone only, or allowed up to the unit by the resident. */
  zone?: 'dropoff' | 'unit';
  platform?: string;
}

export interface Approval {
  id: string;
  visitorName: string;
  unit: string;
  purpose: string;
  plate?: string;
  faceVariant: number;
  createdAt: string;
  status: 'waiting' | 'approved' | 'declined';
  until: string;
  respondedAt?: string;
  respondedBy?: string;
  visitId?: string;
  idLast4: string;
}

export interface Parcel {
  id: string;
  unit: string;
  recipient: string;
  courier: string;
  size: 'Small' | 'Medium' | 'Large' | 'Chilled';
  tracking: string;
  shelf: string;
  loggedAt: string;
  loggedBy: string;
  status: 'waiting' | 'collected';
  code: string;
  collectedAt?: string;
  collectedBy?: string;
  /** Smart locker number when the parcel is in a locker instead of on a shelf. */
  locker?: string;
}

export interface Sighting {
  scene: Scene;
  camera: string;
  at: string;
}

export interface UnknownFace {
  id: string;
  variant: number;
  where: string;
  at: string;
  note: string;
  status: 'unresolved' | 'known' | 'watchlisted' | 'registered';
  resolution?: string;
  sightings: Sighting[];
  similarity: number;
  description: string;
}

export interface UnknownPlate {
  id: string;
  plate: string;
  vehicle: string;
  firstSeen: string;
  attempts: number;
  lane: string;
  outcome: string;
  status: 'open' | 'linked' | 'watchlisted';
}

export interface WatchEntry {
  id: string;
  kind: 'person' | 'vehicle';
  name: string;
  plate?: string;
  vehicle?: string;
  variant?: number;
  reason: string;
  level: 'Alert all guards' | 'Deny entry' | 'Alert only' | 'Deny and alert';
  addedBy: string;
  addedAt: string;
  until: string;
  lastSeen: string;
  /** Entries added by staff wait for JMB/MC approval. Missing on older records, which count as approved. */
  approval?: 'pending' | 'approved';
  approvedBy?: string;
}

export type PermitStatus = 'review' | 'active' | 'awaiting_deposit' | 'ending' | 'breach' | 'rejected' | 'completed' | 'changes_requested';

export interface Worker {
  name: string;
  id: string;
  variant: number;
  enrolled: boolean;
}

export interface Permit {
  id: string;
  kind: 'renovation' | 'move_in' | 'move_out' | 'delivery';
  unit: string;
  owner: string;
  scope: string;
  contractor: string;
  workers: Worker[];
  onSite: number;
  start: string;
  end: string;
  hours: string;
  zones: string;
  deposit: number;
  depositPaid: boolean;
  status: PermitStatus;
  submittedAt: string;
  docs: { name: string; ok: boolean; note: string }[];
}

export interface LiftBooking {
  id: string;
  date: string;
  slot: string;
  what: string;
  unit: string;
  lift: string;
  kind: 'move_in' | 'move_out' | 'delivery';
  /** Missing on older records, which count as approved. */
  status?: 'requested' | 'approved' | 'rejected' | 'completed';
  requestedBy?: 'resident' | 'management';
  mover?: string;
  lorryPlate?: string;
  crew?: number;
  deposit?: number;
  depositPaid?: boolean;
  depositRefunded?: boolean;
  /** Pre- and post-move inspection of the lift and common areas. */
  checklist?: { pre: boolean; post: boolean };
  visitId?: string;
}

export interface IntercomCall {
  id: string;
  unit: string;
  /** Who is calling, e.g. 'Tower A lobby panel' or 'Guardhouse'. */
  from: string;
  at: string;
  state: 'ringing' | 'answered' | 'ended';
  outcome?: 'door_opened' | 'declined' | 'missed' | 'talked';
}

export interface GuardMessage {
  id: string;
  unit: string;
  from: 'resident' | 'guard';
  text: string;
  at: string;
  /** Read by the other side. */
  read: boolean;
}

export type FacilityKind = 'hall' | 'bbq' | 'court' | 'gym' | 'pool' | 'room' | 'other';

export interface Facility {
  id: string;
  name: string;
  kind: FacilityKind;
  /** Fee per booking, in RM. 0 means free. */
  fee: number;
  /** Refundable deposit, in RM. */
  deposit: number;
  /** Longest single booking, in hours. */
  maxHours: number;
  /** First bookable hour (0 to 23). */
  opens: number;
  /** Hour the last booking must end by (1 to 24). */
  closes: number;
  /** How many days ahead residents can book. */
  advanceDays: number;
  /** Rules shown to residents when they book. */
  note: string;
  /** Closed facilities stay listed in the portal but residents cannot book them. */
  active: boolean;
}

export interface Booking {
  id: string;
  facility: string;
  unit: string;
  date: string;
  from: number;
  to: number;
  status: 'confirmed' | 'cancelled';
  fee: number;
  deposit: number;
  label?: string;
}

export interface SiteLimits {
  /** Visitor passes a unit can create for one day. */
  visitorsPerDay: number;
  /** Visitors a unit can have on site at the same time. */
  onSiteAtOnce: number;
  /** Most guests on one event pass. */
  eventGuestCap: number;
  /** Longest multi-day pass, in days. */
  multiDayMax: number;
  /** Resident cars registered per unit. */
  vehiclesPerUnit: number;
}

export type VoteChoice = 'yes' | 'no' | 'abstain';

export interface Resolution {
  id: string;
  title: string;
  detail: string;
  meeting: string;
  closes: string;
  status: 'open' | 'passed' | 'not_passed';
  votes: Record<VoteChoice, number>;
  /** Units that voted in the app or by proxy, so each unit votes once. */
  voted: Record<string, { choice: VoteChoice; by: string; proxy: boolean; at: string }>;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;
  channels: string[];
  sentAt: string;
  sentBy: string;
}

export type RuleGroup = 'Access' | 'Perimeter' | 'Carpark' | 'Safety' | 'Fire' | 'Nuisance' | 'Contractors' | 'Operations' | 'Audio';

export interface Rule {
  id: string;
  group: RuleGroup;
  name: string;
  cameras: number;
  schedule: string;
  enabled: boolean;
  sensitivity: number;
  dwellMin: number;
  firedWeek: number;
  falseWeek: number;
  actions: { talkDown: boolean; alertGuard: boolean; dispatch: boolean; escalate: boolean };
  /** Where the rule runs, for example 'Main gate ANPR lanes'. */
  zone?: string;
  /** Package that includes this detection. */
  tier?: 'Core' | 'Secure' | 'Premium';
  /** Compound rule: alert only when every condition is also true. */
  conditions?: string[];
  /** Created by the site, not from the standard catalogue. */
  custom?: boolean;
}

export interface ResidentNotice {
  id: string;
  unit: string;
  title: string;
  body: string;
  at: string;
  kind: 'security' | 'visitor' | 'parcel' | 'vehicle' | 'billing' | 'announcement' | 'booking' | 'permit' | 'ticket' | 'message';
  read: boolean;
  link?: string;
}

export interface Bill {
  id: string;
  unit: string;
  label: string;
  amount: number;
  lines: { label: string; amount: number }[];
  due?: string;
  status: 'due' | 'paid';
  paidAt?: string;
  method?: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  camera: string;
  x: number;
  y: number;
  status: 'done' | 'late' | 'missed' | 'next' | 'todo';
  at?: string;
}

export interface Guard {
  id: string;
  name: string;
  initials: string;
  shift: 'Night' | 'Day' | 'Evening';
  where: string;
  state: 'At post' | 'Patrolling' | 'Responding' | 'Off duty' | 'On break';
  color: string;
  alertsClosed: number;
  avgResponse: string;
  patrolPct: number;
  unattended: string;
  talkDowns: number;
  rating: 'Excellent' | 'Good' | 'Needs coaching';
  pin: string;
}

export type TicketCategory = 'Defect' | 'Cleanliness' | 'Noise' | 'Parking' | 'Security' | 'Other';

export interface Ticket {
  id: string;
  title: string;
  meta: string;
  evidence: boolean;
  state: 'New' | 'Assigned' | 'In progress' | 'Investigating' | 'Monitoring' | 'Resolved';
  unit?: string;
  category?: TicketCategory;
  location?: string;
  details?: string;
  /** Small JPEG data URL taken by the resident. */
  photo?: string;
  raisedBy?: 'resident' | 'management' | 'camera';
  createdAt?: string;
}

export interface DataRequest {
  id: string;
  title: string;
  meta: string;
  state: 'New' | 'In progress' | 'Done';
}

export interface AuditEntry {
  id: string;
  at: string;
  who: string;
  role: string;
  action: 'Viewed' | 'Exported' | 'Added' | 'Deleted' | 'Changed' | 'Approved' | 'Closed' | 'Sent';
  record: string;
}

export interface Retention {
  id: string;
  data: string;
  keep: string;
  options: string[];
  why: string;
}

export interface UnitRecord {
  unit: string;
  tower: 'A' | 'B' | 'C';
  name: string;
  meta: string;
  tag: 'Owner' | 'Tenant' | 'Vacant' | 'Ending' | 'Reno';
  size: number;
  beds: number;
  owner: string;
  since: string;
  tenancyEnds?: string;
  bays: string;
  feesOk: boolean;
  household: { name: string; role: string; app: boolean; face: boolean }[];
  /** `tag` is the UHF/RFID windscreen tag, a backup to plate recognition for dirty or damaged plates. */
  vehicles: { plate: string; model: string; tag?: string }[];
  cards: { id: string; holder: string; active: boolean; note?: string }[];
}

export interface Session {
  portal?: { name: string; role: string; email: string };
  guardId?: string;
  resident?: { name: string; unit: string };
}
