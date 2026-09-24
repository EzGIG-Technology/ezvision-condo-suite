import { ago } from '@/lib/utils';
import type {
  Alert, Approval, Announcement, AuditEntry, Bill, Booking, Checkpoint, DataRequest, Guard, LiftBooking, Parcel, Permit,
  ResidentNotice, Retention, Rule, Ticket, UnitRecord, UnknownFace, UnknownPlate, Visit, WatchEntry,
} from './types';

export const SITE = {
  name: 'Vista Harmoni Residences',
  short: 'Vista Harmoni',
  towers: 3,
  units: 612,
  cameras: 48,
  camerasOnline: 46,
};

export const RESIDENT_UNIT = 'A-15-07';

const dayAt = (daysFromNow: number, h: number, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

export function makeSeed() {
  const alerts: Alert[] = [
    {
      id: 'al-1', ref: 'INC-0923-014', category: 'perimeter', title: 'Person climbing perimeter fence', where: 'Perimeter North, behind Tower C',
      camera: 'CAM 17 · Perimeter North', scene: 'fence', at: ago(2), severity: 'critical', status: 'dispatched', owner: 'Aiman Rashid', faceVariant: 4, unknownId: 'uf-1',
      summary: 'One adult in a dark hooded top climbed the north perimeter fence behind Tower C and moved towards the Tower C service door. No match against residents, registered visitors or contractors. The same face was recorded at the side gate on two earlier nights.',
      timeline: [
        { at: ago(2), text: 'Climb detected on CAM 17', kind: 'detect' },
        { at: ago(1.95), text: 'Guardhouse tablet and on-call phone alerted', kind: 'system' },
        { at: ago(1.7), text: 'AI talk-down played on speaker SPK 4', kind: 'action' },
        { at: ago(1.6), text: 'Aiman Rashid accepted dispatch', kind: 'guard' },
      ],
      talkDown: true,
    },
    {
      id: 'al-2', ref: 'INC-0923-013', category: 'unregistered', title: 'Unregistered person tailgated resident', where: 'Tower A lobby turnstile',
      camera: 'CAM 08 · Tower A lobby', scene: 'lobby', at: ago(7), severity: 'critical', status: 'open', faceVariant: 1, unknownId: 'uf-2', unit: 'A-08-2',
      summary: 'Two people passed the Tower A turnstile on one card tap. The card belongs to unit A-08-2. The second person does not match any resident or visitor registered today.',
      timeline: [{ at: ago(7), text: 'Tailgating detected on CAM 08 (2 people, 1 card tap)', kind: 'detect' }],
    },
    {
      id: 'al-3', ref: 'INC-0923-012', category: 'unregistered', title: 'Unregistered person at side gate', where: 'Side gate, pedestrian',
      camera: 'CAM 05 · Side gate', scene: 'sidegate', at: ago(1), severity: 'high', status: 'open', faceVariant: 3, unknownId: 'uf-3',
      summary: 'A person walked in through the side gate behind a resident. No registration for this person today.',
      timeline: [{ at: ago(1), text: 'Unregistered entry detected on CAM 05', kind: 'detect' }],
    },
    {
      id: 'al-4', ref: 'INC-0923-011', category: 'carpark', title: 'Loitering and door-checking in carpark', where: 'Carpark B2, near bay 214',
      camera: 'CAM 22 · Carpark B2', scene: 'carpark', at: ago(11), severity: 'warning', status: 'acknowledged', owner: 'Auto',
      summary: 'A person stayed in rows D to F for 4 minutes and tried the doors of 3 parked cars. The automated talk-down played and the person left through the ramp.',
      timeline: [
        { at: ago(11), text: 'Loitering over 3 min detected on CAM 22', kind: 'detect' },
        { at: ago(10.8), text: 'AI talk-down played on speaker SPK 9', kind: 'action' },
        { at: ago(9), text: 'Person left the zone', kind: 'system' },
      ],
      talkDown: true,
    },
    {
      id: 'al-5', ref: 'INC-0923-010', category: 'vehicle', title: 'Unknown plate WXY 8812 refused', where: 'Main gate, lane 1 in',
      camera: 'CAM 01 · Main gate lane 1', scene: 'gate', at: ago(18), severity: 'high', status: 'open', plate: 'WXY 8812', owner: 'Kumar Selvam',
      summary: 'A silver Perodua Myvi with plate WXY 8812 tried to enter twice. The plate is not registered to any unit and has no visitor pass today.',
      timeline: [
        { at: ago(34), text: 'First attempt refused at barrier', kind: 'detect' },
        { at: ago(18), text: 'Second attempt refused at barrier', kind: 'detect' },
      ],
    },
    {
      id: 'al-6', ref: 'INC-0923-009', category: 'nuisance', title: 'Mattress dumped at bin centre', where: 'Bin centre, bay 3',
      camera: 'CAM 44 · Bin centre', scene: 'bin', at: ago(43), severity: 'nuisance', status: 'acknowledged', owner: 'Management', unit: 'B-07-11',
      summary: 'A mattress was left outside the bin area. The lift camera traced the person carrying it to unit B-07-11.',
      timeline: [
        { at: ago(43), text: 'Bulky item dumping detected on CAM 44', kind: 'detect' },
        { at: ago(40), text: 'Traced to unit B-07-11 via lift camera', kind: 'system' },
      ],
    },
    {
      id: 'al-7', ref: 'INC-0923-008', category: 'carpark', title: 'Visitor car overstay 3h 10m', where: 'Carpark B1, bay V17',
      camera: 'CAM 23 · Carpark B1', scene: 'carpark', at: ago(86), severity: 'warning', status: 'acknowledged', plate: 'BQR 5512', unit: 'A-03-09',
      summary: 'Visitor car BQR 5512 is still inside although the pass for A-03-09 ended at 19:00.',
      timeline: [{ at: ago(86), text: 'Pass ended with vehicle still on site', kind: 'detect' }],
    },
    {
      id: 'al-8', ref: 'INC-0923-007', category: 'contractor', title: 'Delivery rider beyond drop-off zone', where: 'Tower B lift lobby, level 12',
      camera: 'CAM 36 · Tower B L12', scene: 'corridor', at: ago(26), severity: 'warning', status: 'closed', outcome: 'Resident approved unit delivery',
      summary: 'A food delivery rider went up to level 12. The resident at B-12-05 confirmed the delivery.',
      timeline: [
        { at: ago(26), text: 'Rider detected beyond drop-off zone', kind: 'detect' },
        { at: ago(24), text: 'Closed: resident approved unit delivery', kind: 'close' },
      ],
    },
  ];

  const visits: Visit[] = [
    { id: 'v-1', name: 'Nurul Izzati', phone: '012-708 4418', type: 'guest', unit: 'A-15-07', host: 'Tan Mei Ling', plate: 'VFB 1180', status: 'on_site', entry: 'Plate · auto', checkIn: ago(152), validFrom: dayAt(0, 19, 30), validTo: dayAt(0, 23, 59), verification: 'IC + face 98%', selfie: true, faceVariant: 2, people: 1, createdBy: 'resident' },
    { id: 'v-2', name: 'Rajesh Kumar', phone: '016-551 2093', type: 'guest', unit: 'B-03-11', host: 'Hafiz Osman', status: 'on_site', entry: 'QR · lobby B', checkIn: ago(119), validFrom: dayAt(0, 20, 0), validTo: dayAt(0, 23, 0), verification: 'Selfie pre-enrolled', selfie: true, faceVariant: 6, people: 1, createdBy: 'resident' },
    { id: 'v-3', name: 'Ahmad Zulkifli', phone: '019-330 7751', type: 'contractor', unit: 'C-21-02', host: 'Permit RN-0412', status: 'on_site', entry: 'Face · side gate', checkIn: ago(823), validFrom: dayAt(0, 8, 0), validTo: dayAt(0, 18, 0), verification: 'Permit + face 97%', selfie: true, faceVariant: 3, people: 1, createdBy: 'management', note: 'Overstay 4h' },
    { id: 'v-4', name: 'Siti Aminah', phone: '011-209 3302', type: 'helper', unit: 'A-08-2', host: 'Wong Kar Fai', status: 'on_site', entry: 'Recurring face', checkIn: ago(859), validFrom: dayAt(0, 7, 30), validTo: dayAt(0, 21, 0), verification: 'Face 99%', selfie: true, faceVariant: 7, people: 1, createdBy: 'resident', recurringDays: [true, true, true, true, true, true, false] },
    { id: 'v-5', name: 'GrabFood rider', phone: '014-880 8810', type: 'rider', unit: 'B-12-05', host: 'Lim Wei Jie', plate: 'WTK 5520', status: 'on_site', entry: 'Walk-in · guard', checkIn: ago(12), validFrom: ago(12), validTo: ago(-8), verification: 'IC scanned', selfie: false, faceVariant: 8, people: 1, createdBy: 'guard' },
    { id: 'v-6', name: 'Chong Yi Xuan', phone: '017-402 6614', type: 'guest', unit: 'C-09-10', host: 'Priya Nair', plate: 'BMQ 3321', status: 'on_site', entry: 'Plate · auto', checkIn: ago(207), validFrom: dayAt(0, 18, 30), validTo: dayAt(0, 23, 30), verification: 'IC + face 96%', selfie: true, faceVariant: 5, people: 2, createdBy: 'resident' },
    { id: 'v-7', name: 'Farid Hakimi', phone: '013-661 9021', type: 'guest', unit: 'A-22-01', host: 'Azlan Hashim', plate: 'JPR 780', status: 'on_site', entry: 'Walk-in · approved', checkIn: ago(64), validFrom: ago(64), validTo: dayAt(0, 23, 59), verification: 'IC scanned', selfie: false, faceVariant: 1, people: 1, createdBy: 'guard' },
    { id: 'v-8', name: 'Mohan Raj', phone: '012-774 5540', type: 'contractor', unit: 'B-17-08', host: 'Permit RN-0419', plate: 'VKB 6612', status: 'left', entry: 'QR · main gate', checkIn: ago(782), checkOut: ago(290), validFrom: dayAt(0, 9, 0), validTo: dayAt(0, 17, 30), verification: 'Permit + IC', selfie: false, faceVariant: 3, people: 1, createdBy: 'management' },
    { id: 'v-9', name: 'Lee Hui Min', phone: '018-903 1107', type: 'guest', unit: 'C-14-03', host: 'Daniel Teoh', status: 'on_site', entry: 'QR · lobby C', checkIn: ago(41), validFrom: ago(60), validTo: ago(-166), verification: 'Selfie pre-enrolled', selfie: true, faceVariant: 5, people: 1, createdBy: 'resident' },
    { id: 'v-10', name: 'Farah Aqilah', phone: '012-640 1175', type: 'guest', unit: 'C-03-08', host: 'Syed Hamzah', plate: 'WVB 3021', status: 'expected', validFrom: ago(-6), validTo: dayAt(0, 23, 59), selfie: true, faceVariant: 2, people: 1, createdBy: 'resident' },
    { id: 'v-11', name: 'Ms Kavitha', phone: '016-212 8830', type: 'tutor', unit: 'B-10-06', host: 'Ravi Shankar', status: 'expected', validFrom: ago(-16), validTo: ago(-196), selfie: false, faceVariant: 7, people: 1, createdBy: 'resident', recurringDays: [false, true, false, true, false, false, false] },
    { id: 'v-12', name: 'Jason Tan', phone: '019-887 5510', type: 'guest', unit: 'A-19-04', host: 'Yap Kok Hin', plate: 'BNH 5510', status: 'expected', validFrom: ago(-31), validTo: dayAt(1, 1, 0), selfie: false, faceVariant: 6, people: 1, createdBy: 'resident' },
    { id: 'v-13', name: 'Sri Rahayu', phone: '011-398 2208', type: 'helper', unit: 'A-15-07', host: 'Tan Mei Ling', status: 'left', entry: 'Recurring face', checkIn: ago(820), checkOut: ago(76), validFrom: dayAt(0, 7, 30), validTo: dayAt(0, 21, 0), verification: 'Face 99%', selfie: true, faceVariant: 7, people: 1, createdBy: 'resident', recurringDays: [true, true, true, true, true, true, false] },
    { id: 'v-14', name: 'Mum and Dad', phone: '012-300 7713', type: 'family', unit: 'A-15-07', host: 'Tan Mei Ling', plate: 'WA 7713 Q', status: 'expected', validFrom: dayAt(2, 10, 0), validTo: dayAt(4, 20, 0), selfie: false, faceVariant: 1, people: 2, createdBy: 'resident' },
  ];

  const approvals: Approval[] = [
    { id: 'ap-1', visitorName: 'Chew Siew Ling', unit: 'A-15-07', purpose: 'Tutor for your son', faceVariant: 5, createdAt: ago(0.3), status: 'waiting', until: '23:30 tonight', idLast4: '4418' },
    { id: 'ap-2', visitorName: 'Azhar Ismail', unit: 'C-05-07', purpose: 'Aircond technician', faceVariant: 3, createdAt: ago(1.7), status: 'waiting', until: '1 hour', idLast4: '0921' },
  ];

  const parcels: Parcel[] = [
    { id: 'p-1', unit: 'A-15-07', recipient: 'Tan Mei Ling', courier: 'Lazada', size: 'Medium', tracking: 'LZMY7719930221', shelf: 'C-3', loggedAt: ago(12), loggedBy: 'Kumar Selvam', status: 'waiting', code: '4471' },
    { id: 'p-2', unit: 'B-03-11', recipient: 'Hafiz Osman', courier: 'J&T Express', size: 'Small', tracking: 'JT6600128843', shelf: 'A-1', loggedAt: ago(24), loggedBy: 'Kumar Selvam', status: 'waiting', code: '1902' },
    { id: 'p-3', unit: 'B-12-05', recipient: 'Lim Wei Jie', courier: 'Pos Laju', size: 'Medium', tracking: 'EP553102981MY', shelf: 'C-4', loggedAt: ago(62), loggedBy: 'Kumar Selvam', status: 'waiting', code: '7730' },
    { id: 'p-4', unit: 'C-09-10', recipient: 'Priya Nair', courier: 'Shopee Express', size: 'Small', tracking: 'SPXMY04718820117', shelf: 'B-2', loggedAt: ago(94), loggedBy: 'Nor Azman', status: 'collected', code: '5561', collectedAt: ago(40), collectedBy: 'Priya Nair' },
    { id: 'p-5', unit: 'A-22-01', recipient: 'Azlan Hashim', courier: 'Ninja Van', size: 'Large', tracking: 'NVMY22019384', shelf: 'D-1', loggedAt: ago(119), loggedBy: 'Nor Azman', status: 'collected', code: '6620', collectedAt: ago(70), collectedBy: 'Azlan Hashim' },
    { id: 'p-6', unit: 'C-18-02', recipient: 'Ng Siew Yin', courier: 'GrabMart', size: 'Chilled', tracking: 'GM-88213', shelf: 'F-1', loggedAt: ago(136), loggedBy: 'Nor Azman', status: 'waiting', code: '3348' },
    { id: 'p-7', unit: 'B-17-08', recipient: 'Gan Choon Hock', courier: 'Shopee Express', size: 'Medium', tracking: 'SPXMY04718811140', shelf: 'A-3', loggedAt: ago(199), loggedBy: 'Nor Azman', status: 'waiting', code: '2285' },
    { id: 'p-8', unit: 'A-15-07', recipient: 'Tan Mei Ling', courier: 'Shopee Express', size: 'Small', tracking: 'SPXMY04718800012', shelf: 'B-5', loggedAt: ago(2 * 1440 + 180), loggedBy: 'Nor Azman', status: 'collected', code: '8810', collectedAt: ago(2 * 1440 + 60), collectedBy: 'Tan Mei Ling' },
  ];

  const unknownFaces: UnknownFace[] = [
    { id: 'uf-1', variant: 4, where: 'Perimeter North', at: ago(2), note: 'Seen on 3 nights', status: 'unresolved', similarity: 41, description: 'Adult, dark hoodie, black backpack',
      sightings: [
        { scene: 'fence', camera: 'CAM 17 · Perimeter North', at: ago(2) },
        { scene: 'sidegate', camera: 'CAM 05 · Side gate', at: ago(2 * 1440 + 90) },
        { scene: 'carpark', camera: 'CAM 22 · Carpark B2', at: ago(2 * 1440 + 80) },
        { scene: 'sidegate', camera: 'CAM 05 · Side gate', at: ago(4 * 1440 - 120) },
        { scene: 'corridor', camera: 'CAM 34 · Tower C L3', at: ago(4 * 1440 - 128) },
      ] },
    { id: 'uf-2', variant: 1, where: 'Tower A lobby', at: ago(7), note: 'Tailgated A-08-2', status: 'unresolved', similarity: 38, description: 'Adult, dark shirt', sightings: [{ scene: 'lobby', camera: 'CAM 08 · Tower A lobby', at: ago(7) }] },
    { id: 'uf-3', variant: 3, where: 'Side gate', at: ago(1), note: 'Walked in', status: 'unresolved', similarity: 33, description: 'Adult, green shirt, cap', sightings: [{ scene: 'sidegate', camera: 'CAM 05 · Side gate', at: ago(1) }] },
    { id: 'uf-4', variant: 2, where: 'Tower B lobby', at: ago(93), note: 'Host confirmed', status: 'known', resolution: 'Guest of B-11-04, host confirmed by phone', similarity: 52, description: 'Adult, purple headscarf', sightings: [{ scene: 'lobby', camera: 'CAM 11 · Tower B lobby', at: ago(93) }] },
    { id: 'uf-5', variant: 6, where: 'Carpark B2 lift', at: ago(136), note: 'Seen on 3 days', status: 'unresolved', similarity: 29, description: 'Adult, grey jacket, mask', sightings: [{ scene: 'corridor', camera: 'CAM 26 · B2 lift lobby', at: ago(136) }, { scene: 'carpark', camera: 'CAM 22 · Carpark B2', at: ago(1440 + 100) }] },
    { id: 'uf-6', variant: 5, where: 'Tower C lobby', at: ago(232), note: 'Guard verified', status: 'registered', resolution: 'Registered as walk-in for C-09-10', similarity: 44, description: 'Adult, blue top', sightings: [{ scene: 'lobby', camera: 'CAM 14 · Tower C lobby', at: ago(232) }] },
    { id: 'uf-7', variant: 8, where: 'Main gate, walking', at: ago(369), note: 'No host found', status: 'unresolved', similarity: 31, description: 'Adult, red shirt, orange cap', sightings: [{ scene: 'gate', camera: 'CAM 04 · Main gate pedestrian', at: ago(369) }] },
    { id: 'uf-8', variant: 7, where: 'Pool deck', at: ago(457), note: 'Guest of B-11-04', status: 'known', resolution: 'Family of B-11-04', similarity: 57, description: 'Adult, teal headscarf', sightings: [{ scene: 'pool', camera: 'CAM 40 · Pool deck', at: ago(457) }] },
  ];

  const unknownPlates: UnknownPlate[] = [
    { id: 'up-1', plate: 'WXY 8812', vehicle: 'Silver Perodua Myvi', firstSeen: ago(34), attempts: 2, lane: 'Main gate · lane 1', outcome: 'Denied at barrier', status: 'open' },
    { id: 'up-2', plate: 'BPK 4470', vehicle: 'White Toyota Hilux', firstSeen: ago(242), attempts: 1, lane: 'Main gate · lane 2', outcome: 'Let in by guard without pass', status: 'open' },
    { id: 'up-3', plate: 'JQT 902', vehicle: 'Black Honda City', firstSeen: ago(514), attempts: 1, lane: 'Main gate · lane 1', outcome: 'Denied at barrier', status: 'watchlisted' },
    { id: 'up-4', plate: 'VFA 6123', vehicle: 'Grey Proton X50', firstSeen: ago(851), attempts: 3, lane: 'Main gate · lane 1', outcome: 'Driver registered as walk-in', status: 'linked' },
  ];

  const watchlist: WatchEntry[] = [
    { id: 'w-1', kind: 'person', name: 'Ex-contractor, RN-0376', variant: 3, reason: 'Removed from site after tools went missing from B-09-02 in July.', level: 'Deny entry', addedBy: 'MC', addedAt: ago(50 * 1440), until: '4 Feb 2027', lastSeen: 'Never since' },
    { id: 'w-2', kind: 'person', name: 'Former tenant, C-12-09', variant: 1, reason: 'Tenancy ended with a court order. Owner asked for no access.', level: 'Deny entry', addedBy: 'MC', addedAt: ago(104 * 1440), until: '11 Dec 2026', lastSeen: '2 Sep, refused' },
    { id: 'w-3', kind: 'person', name: 'Unknown U-0911-02', variant: 8, reason: 'Went through parked cars in B2 checking door handles.', level: 'Alert only', addedBy: 'Farah Hanim', addedAt: ago(12 * 1440), until: '11 Oct 2026', lastSeen: '11 Sep' },
    { id: 'w-4', kind: 'person', name: 'Flyer distributor', variant: 6, reason: 'Repeatedly slips flyers under doors despite warnings.', level: 'Alert only', addedBy: 'Kumar Selvam', addedAt: ago(21 * 1440), until: '2 Oct 2026', lastSeen: '20 Sep, escorted out' },
    { id: 'w-5', kind: 'vehicle', name: 'Former tenant vehicle', plate: 'VEE 7102', vehicle: 'Black Toyota Vios', reason: 'Former tenant vehicle, court order', level: 'Deny and alert', addedBy: 'MC', addedAt: ago(104 * 1440), until: '11 Dec 2026', lastSeen: 'Today 21:31 · denied' },
    { id: 'w-6', kind: 'vehicle', name: 'Abandoned car', plate: 'BHC 118', vehicle: 'Blue Proton Saga', reason: 'Abandoned in B3 for 11 days, tow notice issued', level: 'Alert only', addedBy: 'Farah Hanim', addedAt: ago(3 * 1440), until: '15 Oct 2026', lastSeen: 'Parked B3' },
    { id: 'w-7', kind: 'vehicle', name: 'Flyer distribution car', plate: 'JQT 902', vehicle: 'Black Honda City', reason: 'Linked to flyer distribution', level: 'Deny entry', addedBy: 'Kumar Selvam', addedAt: ago(21 * 1440), until: '2 Oct 2026', lastSeen: 'Today 13:40 · denied' },
  ];

  const docsOk = (insuranceOk: boolean) => [
    { name: 'Floor plan with work marked', ok: true, note: 'Uploaded' },
    { name: 'Contractor SSM registration', ok: true, note: 'Verified' },
    { name: 'Public liability insurance', ok: insuranceOk, note: insuranceOk ? 'Valid to Mar 2027' : 'Expires 30 Sep' },
    { name: 'Worker IC list', ok: true, note: 'Complete' },
  ];

  const permits: Permit[] = [
    { id: 'RN-0427', kind: 'renovation', unit: 'B-17-08', owner: 'Gan Choon Hock', scope: 'Kitchen hacking and re-tiling', contractor: 'Bina Jaya Renovation Sdn Bhd', workers: [
      { name: 'Ahmad Faizal', id: 'IC ••••5521', variant: 1, enrolled: true }, { name: 'Tharmendran R.', id: 'IC ••••0417', variant: 3, enrolled: true },
      { name: 'Nguyen Van Minh', id: 'Passport ••••2281', variant: 6, enrolled: false }, { name: 'Hasrul Nizam', id: 'IC ••••8830', variant: 8, enrolled: false }],
      onSite: 0, start: '28 Sep', end: '16 Oct', hours: 'Mon to Sat, 09:00 to 17:30', zones: 'Tower B · L17 · service lift', deposit: 2000, depositPaid: true, status: 'review', submittedAt: ago(362), docs: docsOk(false) },
    { id: 'RN-0412', kind: 'renovation', unit: 'C-21-02', owner: 'Loh Kian Seng', scope: 'Full unit renovation', contractor: 'Kemas Deco Sdn Bhd', workers: [
      { name: 'Ahmad Zulkifli', id: 'IC ••••7751', variant: 3, enrolled: true }, { name: 'Muthu Kumar', id: 'IC ••••1182', variant: 1, enrolled: true }, { name: 'Rafiq Hamdan', id: 'IC ••••4409', variant: 6, enrolled: true }],
      onSite: 3, start: '1 Sep', end: '30 Oct', hours: 'Mon to Sat, 09:00 to 18:00', zones: 'Tower C · L21 · service lift', deposit: 5000, depositPaid: true, status: 'breach', submittedAt: ago(30 * 1440), docs: docsOk(true) },
    { id: 'RN-0419', kind: 'renovation', unit: 'B-17-08', owner: 'Gan Choon Hock', scope: 'Aircond piping', contractor: 'CoolAir Services', workers: [{ name: 'Mohan Raj', id: 'IC ••••5540', variant: 3, enrolled: true }, { name: 'Lee Wai Kit', id: 'IC ••••2217', variant: 1, enrolled: true }],
      onSite: 0, start: '21 Sep', end: '25 Sep', hours: 'Mon to Sat, 09:00 to 17:30', zones: 'Tower B · L17', deposit: 500, depositPaid: true, status: 'active', submittedAt: ago(9 * 1440), docs: docsOk(true) },
    { id: 'RN-0421', kind: 'renovation', unit: 'A-09-11', owner: 'Nadia Rahim', scope: 'Wardrobe installation', contractor: 'Signature Kitchen', workers: [{ name: 'Kamal Arif', id: 'IC ••••6120', variant: 1, enrolled: true }, { name: 'Tan Boon Huat', id: 'IC ••••3309', variant: 6, enrolled: true }, { name: 'Irfan Shah', id: 'IC ••••7740', variant: 3, enrolled: true }],
      onSite: 2, start: '22 Sep', end: '26 Sep', hours: 'Mon to Sat, 09:00 to 17:30', zones: 'Tower A · L9', deposit: 1000, depositPaid: true, status: 'active', submittedAt: ago(6 * 1440), docs: docsOk(true) },
    { id: 'RN-0405', kind: 'renovation', unit: 'A-26-03', owner: 'Chia Poh Leng', scope: 'Grille and window film', contractor: 'SafeHome Grilles', workers: [{ name: 'Ganesan P.', id: 'IC ••••1945', variant: 3, enrolled: true }, { name: 'Wan Hafiz', id: 'IC ••••8812', variant: 1, enrolled: true }],
      onSite: 0, start: '14 Sep', end: '23 Sep', hours: 'Mon to Sat, 09:00 to 17:30', zones: 'Tower A · L26', deposit: 500, depositPaid: true, status: 'ending', submittedAt: ago(12 * 1440), docs: docsOk(true) },
    { id: 'RN-0398', kind: 'renovation', unit: 'C-04-06', owner: 'Rosnah Ali', scope: 'Bathroom waterproofing', contractor: 'Aqua Seal Works', workers: [{ name: 'Faizul Amri', id: 'IC ••••3321', variant: 6, enrolled: true }, { name: 'Lau Chee Meng', id: 'IC ••••9910', variant: 1, enrolled: true }, { name: 'Salleh Omar', id: 'IC ••••5503', variant: 3, enrolled: true }],
      onSite: 2, start: '7 Sep', end: '2 Oct', hours: 'Mon to Sat, 09:00 to 17:30', zones: 'Tower C · L4', deposit: 2000, depositPaid: true, status: 'active', submittedAt: ago(20 * 1440), docs: docsOk(true) },
    { id: 'RN-0422', kind: 'renovation', unit: 'B-02-09', owner: 'Kevin Ong', scope: 'Painting and wall repair', contractor: 'Warna Ceria Painting', workers: [{ name: 'Azman Yusof', id: 'IC ••••4471', variant: 1, enrolled: false }, { name: 'Ravi Kumar', id: 'IC ••••6632', variant: 3, enrolled: false }],
      onSite: 0, start: '29 Sep', end: '3 Oct', hours: 'Mon to Sat, 09:00 to 17:30', zones: 'Tower B · L2', deposit: 500, depositPaid: false, status: 'awaiting_deposit', submittedAt: ago(2 * 1440), docs: docsOk(true) },
  ];

  const liftBookings: LiftBooking[] = [
    { id: 'lb-1', date: dayAt(-2, 10), slot: '10:00 to 13:00', what: 'Move-in', unit: 'A-12-04', lift: 'Tower A service lift', kind: 'move_in' },
    { id: 'lb-2', date: dayAt(0, 14), slot: '14:00 to 17:00', what: 'Sofa delivery', unit: 'C-18-02', lift: 'Tower C service lift', kind: 'delivery' },
    { id: 'lb-3', date: dayAt(1, 9), slot: '09:00 to 12:00', what: 'Move-out', unit: 'B-06-10', lift: 'Tower B service lift', kind: 'move_out' },
    { id: 'lb-4', date: dayAt(3, 9), slot: '09:00 to 13:00', what: 'Move-in', unit: 'B-06-10', lift: 'Tower B service lift', kind: 'move_in' },
  ];

  const bookings: Booking[] = [
    { id: 'bk-1', facility: 'BBQ pit 1', unit: 'B-11-04', date: dayAt(0, 12), from: 12, to: 15, status: 'confirmed', fee: 30, deposit: 100 },
    { id: 'bk-2', facility: 'BBQ pit 1', unit: 'A-03-02', date: dayAt(0, 18), from: 18, to: 22, status: 'confirmed', fee: 30, deposit: 100 },
    { id: 'bk-3', facility: 'BBQ pit 2', unit: 'C-20-05', date: dayAt(0, 18), from: 18, to: 22, status: 'confirmed', fee: 30, deposit: 100 },
    { id: 'bk-4', facility: 'Function hall', unit: 'Management', date: dayAt(0, 10), from: 10, to: 14, status: 'confirmed', fee: 0, deposit: 0, label: 'Kids art class' },
    { id: 'bk-5', facility: 'Function hall', unit: 'A-15-07', date: dayAt(3, 19), from: 19, to: 23, status: 'confirmed', fee: 150, deposit: 300, label: 'Birthday party' },
    { id: 'bk-6', facility: 'Squash court', unit: 'A-09-01', date: dayAt(0, 7), from: 7, to: 8, status: 'confirmed', fee: 0, deposit: 0 },
    { id: 'bk-7', facility: 'Squash court', unit: 'B-02-06', date: dayAt(0, 20), from: 20, to: 21, status: 'confirmed', fee: 0, deposit: 0 },
    { id: 'bk-8', facility: 'BBQ pit 2', unit: 'Other unit', date: dayAt(3, 14), from: 14, to: 18, status: 'confirmed', fee: 30, deposit: 100 },
  ];

  const announcements: Announcement[] = [
    { id: 'an-1', title: 'Water supply interruption, Tower B', body: 'Water to Tower B will be cut on Friday from 10:00 to 14:00 for tank cleaning.', audience: 'Tower B', channels: ['App push', 'WhatsApp'], sentAt: ago(2 * 1440), sentBy: 'Farah Hanim' },
    { id: 'an-2', title: 'EGM e-voting is open', body: 'Vote on installing EV chargers at B1 before 30 September.', audience: 'All towers', channels: ['App push', 'Email'], sentAt: ago(5 * 1440), sentBy: 'JMB Secretary' },
  ];

  const R = (id: string, group: Rule['group'], name: string, cameras: number, schedule: string, enabled: boolean, firedWeek: number, falseWeek: number, dwellMin = 0, sensitivity = 7): Rule => ({
    id, group, name, cameras, schedule, enabled, sensitivity, dwellMin, firedWeek, falseWeek,
    actions: { talkDown: group === 'Carpark' || group === 'Perimeter', alertGuard: true, dispatch: group !== 'Nuisance', escalate: group === 'Perimeter' || group === 'Access' || group === 'Safety' },
  });
  const rules: Rule[] = [
    R('r-1', 'Access', 'Unregistered person', 9, 'Always', true, 84, 6),
    R('r-2', 'Access', 'Tailgating and piggybacking', 6, 'Always', true, 38, 3),
    R('r-3', 'Access', 'Registered visitor in wrong block', 12, 'Always', true, 11, 2),
    R('r-4', 'Perimeter', 'Fence tripwire, north and east', 8, '20:00 to 07:00', true, 3, 0),
    R('r-5', 'Perimeter', 'Roof, M&E and substation entry', 5, 'Always', true, 1, 0),
    R('r-6', 'Carpark', 'Loitering or door-checking', 3, '22:00 to 06:00', true, 9, 1, 3),
    R('r-7', 'Carpark', 'Fire lane and ramp blocking', 6, 'Always', true, 14, 2, 5),
    R('r-8', 'Carpark', 'Visitor overstay', 4, 'Always', true, 27, 0),
    R('r-9', 'Safety', 'Fall or collapse', 14, 'Always', true, 2, 1),
    R('r-10', 'Safety', 'Child alone near pool', 2, '07:00 to 22:00', true, 1, 0),
    R('r-11', 'Safety', 'Fighting', 20, 'Always', false, 0, 0),
    R('r-12', 'Nuisance', 'Bulky item dumping', 3, 'Always', true, 4, 0),
    R('r-13', 'Nuisance', 'Objects thrown from height', 4, 'Always', true, 2, 1),
    R('r-14', 'Nuisance', 'Smoking in lobby and lifts', 18, 'Always', false, 0, 0),
    R('r-15', 'Operations', 'Guardhouse unattended over 5 min', 1, 'Always', true, 2, 0, 5),
    R('r-16', 'Operations', 'Camera offline, moved or covered', 48, 'Always', true, 3, 0),
  ];

  const notices: ResidentNotice[] = [
    { id: 'n-1', unit: 'A-15-07', title: 'Security notice', body: 'Someone climbed the north fence behind Tower C. Guards responded in under a minute. No unit was entered.', at: ago(1), kind: 'security', read: false },
    { id: 'n-2', unit: 'A-15-07', title: 'Your car came in', body: 'VBK 2231 entered at the main gate.', at: ago(3), kind: 'vehicle', read: false },
    { id: 'n-3', unit: 'A-15-07', title: 'Parcel waiting', body: 'Lazada parcel on shelf C-3. Pickup code 4471.', at: ago(12), kind: 'parcel', read: true, link: '/app/parcels' },
    { id: 'n-4', unit: 'A-15-07', title: 'Sri Rahayu left', body: 'Your helper left through the Tower A lobby.', at: ago(76), kind: 'visitor', read: true },
    { id: 'n-5', unit: 'A-15-07', title: 'Nurul Izzati arrived', body: 'Your guest was verified at the gate and parked at bay V12.', at: ago(152), kind: 'visitor', read: true, link: '/app/visitors' },
    { id: 'n-6', unit: 'A-15-07', title: 'Q4 bill is ready', body: 'RM 1,026.00 due on 1 Oct. Pay in Fees and billing.', at: ago(7 * 1440), kind: 'billing', read: true, link: '/app/billing' },
  ];

  const bills: Bill[] = [
    { id: 'b-q4', unit: 'A-15-07', label: 'Q4 2026 fees', amount: 1026, due: '1 Oct 2026', status: 'due', lines: [
      { label: 'Maintenance fee · 1,180 sq ft', amount: 920.4 }, { label: 'Sinking fund · 10%', amount: 92.04 }, { label: 'Building insurance', amount: 13.56 }] },
    { id: 'b-q3', unit: 'A-15-07', label: 'Q3 2026 fees', amount: 1026, status: 'paid', paidAt: '1 Jul 2026', method: 'FPX', lines: [] },
    { id: 'b-q2', unit: 'A-15-07', label: 'Q2 2026 fees', amount: 1026, status: 'paid', paidAt: '2 Apr 2026', method: 'FPX', lines: [] },
  ];

  const checkpoints: Checkpoint[] = [
    ['Guardhouse', 'CAM 02', 350, 490], ['Side gate', 'CAM 05', 650, 400], ['East fence', 'CAM 18', 660, 220], ['North fence', 'CAM 17', 555, 30],
    ['Tower C lobby', 'CAM 14', 455, 200], ['Pool deck', 'CAM 40', 350, 215], ['Tower A lobby', 'CAM 08', 245, 200], ['Carpark B1 ramp', 'CAM 21', 130, 350],
    ['West fence', 'CAM 19', 40, 220], ['Roof A access', 'CAM 46', 145, 30], ['Bin centre', 'CAM 44', 570, 350], ['Gym and hall', 'CAM 41', 450, 470],
  ].map(([name, camera, x, y], i) => ({
    id: `cp-${i + 1}`, name: name as string, camera: camera as string, x: x as number, y: y as number,
    status: i < 7 ? (i === 4 ? 'late' : 'done') : i === 7 ? 'next' : 'todo',
    at: i < 7 ? ago(21 - i * 3) : undefined,
  }));

  const guards: Guard[] = [
    { id: 'g-1', name: 'Aiman Rashid', initials: 'AR', shift: 'Night', where: 'Responding · Perimeter North', state: 'Responding', color: '#1D4FE0', alertsClosed: 214, avgResponse: '0:34', patrolPct: 98, unattended: '0', talkDowns: 22, rating: 'Excellent', pin: '1111' },
    { id: 'g-2', name: 'Kumar Selvam', initials: 'KS', shift: 'Night', where: 'Guardhouse · Main gate', state: 'At post', color: '#14A38F', alertsClosed: 198, avgResponse: '0:39', patrolPct: 97, unattended: '0', talkDowns: 17, rating: 'Excellent', pin: '2468' },
    { id: 'g-3', name: 'Mohd Taufiq', initials: 'MT', shift: 'Night', where: 'Patrol round 3 · 7 of 12', state: 'Patrolling', color: '#3A4468', alertsClosed: 176, avgResponse: '0:52', patrolPct: 91, unattended: '1 · 6 min', talkDowns: 9, rating: 'Good', pin: '3333' },
    { id: 'g-4', name: 'Nor Azman', initials: 'NA', shift: 'Day', where: 'Off duty · back 07:00', state: 'Off duty', color: '#5B34B8', alertsClosed: 241, avgResponse: '0:44', patrolPct: 99, unattended: '0', talkDowns: 4, rating: 'Excellent', pin: '4444' },
    { id: 'g-5', name: 'Bishnu Karki', initials: 'BK', shift: 'Evening', where: 'Off duty', state: 'Off duty', color: '#C2410C', alertsClosed: 205, avgResponse: '1:12', patrolPct: 88, unattended: '1 · 6 min', talkDowns: 12, rating: 'Needs coaching', pin: '5555' },
    { id: 'g-6', name: 'Suhaimi Ismail', initials: 'SI', shift: 'Evening', where: 'Off duty', state: 'Off duty', color: '#0B1640', alertsClosed: 174, avgResponse: '0:47', patrolPct: 97, unattended: '0', talkDowns: 14, rating: 'Good', pin: '6666' },
  ];

  const tickets: Ticket[] = [
    { id: 'TK-1182', title: 'Mattress dumped at bin centre', meta: 'Traced to B-07-11 · notice issued', evidence: true, state: 'In progress', unit: 'B-07-11' },
    { id: 'TK-1180', title: 'Water leaking at B2 near ramp', meta: 'Detected by camera 19:04 · plumber tomorrow', evidence: true, state: 'Assigned' },
    { id: 'TK-1177', title: 'Cigarette butts thrown from height', meta: 'Tower A east side · 3 reports', evidence: true, state: 'Investigating' },
    { id: 'TK-1174', title: 'Lift A2 door slow to close', meta: 'Reported by A-15-07 · vendor visit Fri', evidence: false, state: 'Assigned', unit: 'A-15-07' },
    { id: 'TK-1169', title: 'Noise from renovation after 6pm', meta: 'RN-0412 · C-21-02 · warning issued', evidence: false, state: 'Monitoring', unit: 'C-21-02' },
  ];

  const dataRequests: DataRequest[] = [
    { id: 'dr-1', title: 'Access request · B-03-11', meta: 'Resident asked for all visitor records for their unit · due 10 Oct', state: 'In progress' },
    { id: 'dr-2', title: 'Deletion request · visitor', meta: 'Guest of C-09-10 asked to delete her selfie · due 12 Oct', state: 'New' },
    { id: 'dr-3', title: 'Correction · A-22-01', meta: 'Wrong plate on file fixed on 18 Sep', state: 'Done' },
  ];

  const audit: AuditEntry[] = [
    { id: 'au-1', at: ago(9), who: 'Kumar Selvam', role: 'Guard', action: 'Viewed', record: 'Unknown face at Tower A lobby' },
    { id: 'au-2', at: ago(214), who: 'Ir. Rosli Daud', role: 'JMB Chairman', action: 'Viewed', record: 'Weekly incident summary' },
    { id: 'au-3', at: ago(672), who: 'System', role: 'Retention job', action: 'Deleted', record: '214 unknown-face snapshots older than 30 days' },
    { id: 'au-4', at: ago(1784), who: 'Farah Hanim', role: 'Building Manager', action: 'Changed', record: 'Retention for plate reads, 60 to 90 days' },
  ];

  const retention: Retention[] = [
    { id: 'rt-1', data: 'Visitor log entries', keep: '90 days', options: ['30 days', '60 days', '90 days', '180 days', '1 year'], why: 'Answering "who visited when" for residents and investigations' },
    { id: 'rt-2', data: 'Unknown-face snapshots', keep: '30 days', options: ['7 days', '14 days', '30 days', '60 days'], why: 'Review in the Unregistered Gallery, then deleted unless attached to an incident' },
    { id: 'rt-3', data: 'Plate reads (ANPR)', keep: '90 days', options: ['30 days', '60 days', '90 days', '180 days'], why: 'Overstay, parking disputes and vehicle investigations' },
    { id: 'rt-4', data: 'Incident evidence packs', keep: 'Case closed + 1 year', options: ['Case closed + 6 months', 'Case closed + 1 year', 'Case closed + 2 years'], why: 'Police reports, insurance claims and by-law enforcement' },
    { id: 'rt-5', data: 'Resident face templates', keep: 'Move-out + 7 days', options: ['Move-out + 1 day', 'Move-out + 7 days', 'Move-out + 30 days'], why: 'Hands-free access, deleted automatically when the tenancy ends' },
    { id: 'rt-6', data: 'Visitor selfies', keep: 'Pass end + 24 hours', options: ['Pass end + 1 hour', 'Pass end + 24 hours', 'Pass end + 7 days'], why: 'Lobby recognition for invited guests only' },
    { id: 'rt-7', data: 'Watchlist entries', keep: 'Up to 6 months', options: ['Up to 3 months', 'Up to 6 months', 'Up to 12 months'], why: 'Must be renewed by the committee, otherwise removed' },
  ];

  const units: UnitRecord[] = [
    { unit: 'A-15-07', tower: 'A', name: 'Tan Mei Ling (tenant)', meta: '4 people · 2 cars', tag: 'Tenant', size: 1180, beds: 3, owner: 'Dr Lim Chee Keong', since: '1 Mar 2025', tenancyEnds: '28 Feb 2027', bays: 'B2-118, B2-119', feesOk: true,
      household: [{ name: 'Tan Mei Ling', role: 'Primary tenant', app: true, face: false }, { name: 'Ong Kah Wai', role: 'Spouse', app: true, face: false }, { name: 'Ong Jun Hao', role: 'Son', app: false, face: false }, { name: 'Sri Rahayu', role: 'Helper · recurring pass', app: false, face: true }],
      vehicles: [{ plate: 'VBK 2231', model: 'Honda HR-V · white' }, { plate: 'WQE 4812', model: 'Perodua Ativa · grey' }],
      cards: [{ id: '0048-2291', holder: 'Tan Mei Ling', active: true }, { id: '0048-2292', holder: 'Ong Kah Wai', active: true }, { id: '0048-1170', holder: 'Reported lost', active: false, note: 'Blocked 12 Sep' }] },
    { unit: 'A-15-06', tower: 'A', name: 'Hj. Kamarul Ariffin', meta: '3 people · 1 car', tag: 'Owner', size: 1180, beds: 3, owner: 'Hj. Kamarul Ariffin', since: '2019', bays: 'B2-116', feesOk: true,
      household: [{ name: 'Hj. Kamarul Ariffin', role: 'Owner', app: true, face: true }, { name: 'Pn. Rohani', role: 'Spouse', app: true, face: true }, { name: 'Aisyah', role: 'Daughter', app: true, face: false }],
      vehicles: [{ plate: 'WMK 1818', model: 'Toyota Camry · black' }], cards: [{ id: '0048-2201', holder: 'Hj. Kamarul Ariffin', active: true }] },
    { unit: 'A-15-05', tower: 'A', name: 'Vacant', meta: 'Listed for rent', tag: 'Vacant', size: 980, beds: 2, owner: 'Tan Sri Holdings', since: '-', bays: 'B2-114', feesOk: true, household: [], vehicles: [], cards: [] },
    { unit: 'A-15-04', tower: 'A', name: 'Sharmila Devi', meta: '2 people · 1 car', tag: 'Owner', size: 980, beds: 2, owner: 'Sharmila Devi', since: '2021', bays: 'B2-112', feesOk: false,
      household: [{ name: 'Sharmila Devi', role: 'Owner', app: true, face: false }, { name: 'Arvind', role: 'Son', app: false, face: false }], vehicles: [{ plate: 'BJK 4402', model: 'Perodua Bezza · silver' }], cards: [{ id: '0048-2190', holder: 'Sharmila Devi', active: true }] },
    { unit: 'A-15-03', tower: 'A', name: 'Wong Siew Mei (tenant)', meta: '5 people · 2 cars', tag: 'Tenant', size: 1180, beds: 3, owner: 'Mr Chan', since: '2024', tenancyEnds: '31 Jan 2027', bays: 'B2-110, B2-111', feesOk: true,
      household: [{ name: 'Wong Siew Mei', role: 'Primary tenant', app: true, face: true }], vehicles: [{ plate: 'VCD 9001', model: 'Mazda CX-5 · red' }], cards: [{ id: '0048-2150', holder: 'Wong Siew Mei', active: true }] },
    { unit: 'A-15-01', tower: 'A', name: 'Chen Jia Hui (tenant)', meta: 'Tenancy ends 30 Sep', tag: 'Ending', size: 1180, beds: 3, owner: 'Ms Goh', since: '2023', tenancyEnds: '30 Sep 2026', bays: 'B2-106', feesOk: true,
      household: [{ name: 'Chen Jia Hui', role: 'Primary tenant', app: true, face: true }], vehicles: [{ plate: 'WTA 3310', model: 'Honda City · white' }], cards: [{ id: '0048-2101', holder: 'Chen Jia Hui', active: true }] },
    { unit: 'A-14-05', tower: 'A', name: 'Lee Boon Kiat', meta: 'Renovation RN-0417', tag: 'Reno', size: 980, beds: 2, owner: 'Lee Boon Kiat', since: '2018', bays: 'B2-090', feesOk: true,
      household: [{ name: 'Lee Boon Kiat', role: 'Owner', app: true, face: false }], vehicles: [{ plate: 'PKK 118', model: 'BMW 320i · blue' }], cards: [{ id: '0048-1990', holder: 'Lee Boon Kiat', active: true }] },
    { unit: 'B-12-05', tower: 'B', name: 'Lim Wei Jie', meta: '2 people · 1 car', tag: 'Owner', size: 1050, beds: 3, owner: 'Lim Wei Jie', since: '2020', bays: 'B2-214', feesOk: true,
      household: [{ name: 'Lim Wei Jie', role: 'Owner', app: true, face: true }], vehicles: [{ plate: 'WVN 1945', model: 'Perodua Bezza · white' }], cards: [{ id: '0049-1020', holder: 'Lim Wei Jie', active: true }] },
    { unit: 'B-03-11', tower: 'B', name: 'Hafiz Osman', meta: '3 people · 1 car', tag: 'Owner', size: 1050, beds: 3, owner: 'Hafiz Osman', since: '2022', bays: 'B1-031', feesOk: true,
      household: [{ name: 'Hafiz Osman', role: 'Owner', app: true, face: true }], vehicles: [{ plate: 'VJR 4410', model: 'Proton X70 · grey' }], cards: [{ id: '0049-0311', holder: 'Hafiz Osman', active: true }] },
    { unit: 'C-09-10', tower: 'C', name: 'Priya Nair', meta: '2 people · 1 car', tag: 'Tenant', size: 1250, beds: 3, owner: 'Mr Ho', since: '2025', tenancyEnds: '31 May 2027', bays: 'B3-091', feesOk: true,
      household: [{ name: 'Priya Nair', role: 'Primary tenant', app: true, face: false }], vehicles: [{ plate: 'WBB 6621', model: 'Honda Civic · black' }], cards: [{ id: '0050-0910', holder: 'Priya Nair', active: true }] },
    { unit: 'C-21-02', tower: 'C', name: 'Loh Kian Seng', meta: 'Renovation RN-0412', tag: 'Reno', size: 1480, beds: 4, owner: 'Loh Kian Seng', since: '2026', bays: 'B3-210', feesOk: true, household: [], vehicles: [], cards: [] },
  ];

  return {
    alerts, visits, approvals, parcels, unknownFaces, unknownPlates, watchlist, permits, liftBookings, bookings, announcements, rules, notices, bills,
    checkpoints, guards, tickets, dataRequests, audit, retention, units,
    patrolStartedAt: ago(21),
    nightMode: true,
    feeRestriction: true,
    autoDebit: false,
    faceEnrolled: false,
    resident: { name: 'Tan Mei Ling', unit: RESIDENT_UNIT },
  };
}

export type Seed = ReturnType<typeof makeSeed>;
