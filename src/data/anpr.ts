import { ago } from '@/lib/utils';

export interface PlateRead {
  id: string;
  at: string;
  plate: string;
  vehicle: string;
  colour: string;
  model: string;
  match: string;
  detail: string;
  lane: string;
  camera: string;
  barrier: 'Auto-opened' | 'Guard opened' | 'Denied' | 'Denied · alert';
  kind: 'resident' | 'visitor' | 'unknown' | 'watchlist' | 'courier' | 'exit';
}

export const makeReads = (): PlateRead[] => [
  { id: 'r1', at: ago(0.2), plate: 'VBK 2231', vehicle: 'Honda HR-V', colour: 'white', model: 'hr-v', match: 'Resident · A-15-07', detail: 'Owner Tan Mei Ling', lane: 'Lane 1 in', camera: 'CAM 01', barrier: 'Auto-opened', kind: 'resident' },
  { id: 'r2', at: ago(2.6), plate: 'WTK 5520', vehicle: 'Yamaha motorcycle', colour: 'black', model: 'motorcycle', match: 'Rider · walk-in', detail: 'GrabFood · registered by Kumar', lane: 'Lane 1 in', camera: 'CAM 01', barrier: 'Guard opened', kind: 'visitor' },
  { id: 'r3', at: ago(5), plate: 'BMQ 3321', vehicle: 'Perodua Axia', colour: 'silver', model: 'axia', match: 'Visitor · exit', detail: 'Guest of C-09-10', lane: 'Lane 3 out', camera: 'CAM 03', barrier: 'Auto-opened', kind: 'exit' },
  { id: 'r4', at: ago(18), plate: 'WXY 8812', vehicle: 'Perodua Myvi', colour: 'silver', model: 'myvi', match: 'No match', detail: 'Not a resident or visitor · 2nd attempt', lane: 'Lane 1 in', camera: 'CAM 01', barrier: 'Denied', kind: 'unknown' },
  { id: 'r5', at: ago(24), plate: 'VHN 2091', vehicle: 'Toyota Hiace', colour: 'white', model: 'hiace', match: 'Courier · single-use code', detail: 'J&T Express · code used once', lane: 'Lane 2 in', camera: 'CAM 02', barrier: 'Auto-opened', kind: 'courier' },
  { id: 'r6', at: ago(30), plate: 'JPR 780', vehicle: 'Honda Civic', colour: 'grey', model: 'civic', match: 'Visitor pass', detail: 'Guest of A-22-01 · approved walk-in', lane: 'Lane 1 in', camera: 'CAM 01', barrier: 'Auto-opened', kind: 'visitor' },
  { id: 'r7', at: ago(43), plate: 'VEE 7102', vehicle: 'Toyota Vios', colour: 'black', model: 'vios', match: 'Watchlist', detail: 'Barred ex-tenant vehicle', lane: 'Lane 2 in', camera: 'CAM 02', barrier: 'Denied · alert', kind: 'watchlist' },
  { id: 'r8', at: ago(54), plate: 'WVN 1945', vehicle: 'Perodua Bezza', colour: 'white', model: 'bezza', match: 'Resident · B-12-05', detail: '2nd car on unit', lane: 'Lane 1 in', camera: 'CAM 01', barrier: 'Auto-opened', kind: 'resident' },
  { id: 'r9', at: ago(62), plate: 'PKD 3310', vehicle: 'Proton Saga', colour: 'blue', model: 'saga', match: 'Visitor · exit', detail: 'Guest of B-03-11', lane: 'Lane 3 out', camera: 'CAM 03', barrier: 'Auto-opened', kind: 'exit' },
  // yesterday evening (used by the evidence search demo)
  { id: 'r10', at: ago(1440 + 120), plate: 'VFR 6620', vehicle: 'Perodua Myvi', colour: 'red', model: 'myvi', match: 'Visitor pass', detail: 'Guest of B-03-11 until 21:30', lane: 'Lane 1 in', camera: 'CAM 01', barrier: 'Auto-opened', kind: 'visitor' },
  { id: 'r11', at: ago(1440 + 16), plate: 'VFR 6620', vehicle: 'Perodua Myvi', colour: 'red', model: 'myvi', match: 'Visitor · exit', detail: 'Left 28 min past the pass', lane: 'Lane 3 out', camera: 'CAM 03', barrier: 'Auto-opened', kind: 'exit' },
  { id: 'r12', at: ago(1440 + 93), plate: 'BLK 3319', vehicle: 'Perodua Myvi', colour: 'red', model: 'myvi', match: 'Resident · A-11-02', detail: 'Owner Nadia Rahim', lane: 'Lane 1 in', camera: 'CAM 01', barrier: 'Auto-opened', kind: 'resident' },
  { id: 'r13', at: ago(1440 + 67), plate: 'WUV 7004', vehicle: 'Perodua Myvi', colour: 'red', model: 'myvi', match: 'Visitor pass', detail: 'Guest of C-02-05', lane: 'Lane 2 in', camera: 'CAM 02', barrier: 'Auto-opened', kind: 'visitor' },
  { id: 'r14', at: ago(1440 + 38), plate: 'BLK 3319', vehicle: 'Perodua Myvi', colour: 'red', model: 'myvi', match: 'Resident · exit', detail: 'Resident leaving', lane: 'Lane 3 out', camera: 'CAM 03', barrier: 'Auto-opened', kind: 'exit' },
  { id: 'r15', at: ago(1440 + 132), plate: 'VCE 215', vehicle: 'Perodua Axia', colour: 'maroon', model: 'axia', match: 'Visitor pass', detail: 'Guest of A-06-02', lane: 'Lane 2 in', camera: 'CAM 02', barrier: 'Auto-opened', kind: 'visitor' },
];
