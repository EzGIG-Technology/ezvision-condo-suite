export interface Camera {
  id: string;
  name: string;
  zone: string;
  kind: 'ANPR' | 'Face recognition' | 'General' | 'Upward-facing';
  /** 7-day uptime, percent. */
  uptime: number;
  status: 'online' | 'offline' | 'obstructed';
  note?: string;
  audio?: boolean;
}

const Z: [string, string, Camera['kind'], boolean?][] = [
  ['Main gate lane in', 'Main gate', 'ANPR'], ['Main gate lane out', 'Main gate', 'ANPR'], ['Main gate lane 2 in', 'Main gate', 'ANPR'], ['Main gate lane 2 out', 'Main gate', 'ANPR'],
  ['Main gate pedestrian', 'Main gate', 'Face recognition', true], ['Guardhouse interior', 'Guardhouse', 'General', true], ['Side gate, pedestrian', 'Side gate', 'Face recognition', true], ['Back gate', 'Back gate', 'Face recognition'],
  ['Tower A lobby door', 'Tower A', 'Face recognition', true], ['Tower A turnstiles', 'Tower A', 'Face recognition'], ['Tower B lobby door', 'Tower B', 'Face recognition', true], ['Tower B turnstiles', 'Tower B', 'Face recognition'],
  ['Tower C lobby door', 'Tower C', 'Face recognition', true], ['Tower C turnstiles', 'Tower C', 'Face recognition'], ['Tower A lift lobby B1', 'Carpark', 'Face recognition'], ['Tower B lift lobby B1', 'Carpark', 'Face recognition'],
  ['Perimeter North', 'Perimeter', 'General'], ['Perimeter East', 'Perimeter', 'General'], ['Perimeter South', 'Perimeter', 'General'], ['Perimeter West', 'Perimeter', 'General'],
  ['B1 ramp', 'Carpark', 'General'], ['Carpark B2', 'Carpark', 'General'], ['Carpark B2 east', 'Carpark', 'General'], ['Carpark B2 west', 'Carpark', 'General'],
  ['Carpark B3', 'Carpark', 'General'], ['Carpark B3 row F', 'Carpark', 'General'], ['Carpark B3 exit', 'Carpark', 'General'], ['Visitor parking B1', 'Carpark', 'General'],
  ['Pump room', 'Basement', 'General'], ['Tower A stair L12', 'Tower A', 'General'], ['Tower C stair L12', 'Tower C', 'General'], ['Tower B stair L8', 'Tower B', 'General'],
  ['Roof access Tower A', 'Restricted', 'General'], ['TNB substation', 'Restricted', 'General'], ['Genset and water tank', 'Restricted', 'General'], ['Tower A facade (up)', 'Facade', 'Upward-facing'],
  ['Tower B facade (up)', 'Facade', 'Upward-facing'], ['Tower C facade (up)', 'Facade', 'Upward-facing'], ['Parcel room', 'Lobby', 'General', true], ['Pool deck', 'Facilities', 'General', true],
  ['Gym', 'Facilities', 'General', true], ['BBQ area', 'Facilities', 'General'], ['Function hall', 'Facilities', 'General', true], ['Bin centre', 'Service', 'General'],
  ['Loading bay', 'Service', 'General'], ['Lift A2 car', 'Lifts', 'General'], ['Lift B1 car', 'Lifts', 'General'], ['Lift C1 car', 'Lifts', 'General'],
];

export const CAMERAS: Camera[] = Z.map(([name, zone, kind, audio], i) => {
  const id = `CAM ${String(i + 1).padStart(2, '0')}`;
  if (id === 'CAM 31') return { id, name, zone, kind, audio, uptime: 98.8, status: 'offline', note: 'Offline for 2h 04m' };
  if (id === 'CAM 44') return { id, name, zone, kind, audio, uptime: 99.6, status: 'obstructed', note: 'View partly blocked since 19:40' };
  return { id, name, zone, kind, audio, uptime: Math.round((99.9 - ((i * 7) % 5) / 10) * 10) / 10, status: 'online' };
});
