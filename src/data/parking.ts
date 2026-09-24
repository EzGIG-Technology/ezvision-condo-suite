import type { Scene, Tone } from '@/data/types';

export interface Violation { id: string; tone: Tone; scene: Scene; tag: string; box: string; cam: string; time: string; title: string; body: string; plate: string; unit: string; state: 'open' | 'notified' | 'notice' }
export const PARKING_VIOLATIONS: Violation[] = [
  { id: 'vi-1', tone: 'red', scene: 'carpark', tag: 'Fire lane', box: 'VJT 902 · fire lane 22m', cam: 'CAM 21 · B1 ramp', time: '21:52', title: 'Parked in fire lane', body: 'Resident of B-05-03. Parked for 22 minutes next to hydrant H-3.', plate: 'VJT 902', unit: 'B-05-03', state: 'open' },
  { id: 'vi-2', tone: 'amber', scene: 'carpark', tag: 'Bay misuse', box: 'VJR 4410 · bay 214', cam: 'CAM 22 · Carpark B2', time: '20:18', title: 'Wrong resident bay', body: 'Car from B-03-11 is in bay B2-214, which belongs to B-12-05.', plate: 'VJR 4410', unit: 'B-03-11', state: 'open' },
  { id: 'vi-3', tone: 'amber', scene: 'carpark', tag: 'Double parked', box: 'WPN 6621 · blocking 2', cam: 'CAM 25 · Carpark B3', time: '19:47', title: 'Double parking', body: 'Blocking two cars in row F. Owner notified by app at 19:48.', plate: 'WPN 6621', unit: 'C-09-10', state: 'notified' },
  { id: 'vi-4', tone: 'blue', scene: 'carpark', tag: 'Abandoned', box: 'BHC 118 · 11 days', cam: 'CAM 27 · Carpark B3', time: '11 days', title: 'Not moved for 11 days', body: 'No unit on record. Flat rear tyre. Tow notice under house rule 14.', plate: 'BHC 118', unit: '—', state: 'open' },
];

