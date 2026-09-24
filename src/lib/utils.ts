import clsx, { type ClassValue } from 'clsx';

export const cn = (...inputs: ClassValue[]) => clsx(inputs);

let counter = 0;
export const uid = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** ISO timestamp for `minutes` ago (negative = in the future). */
export const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const hhmm = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

export const hhmmss = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const dayLabel = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === y.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const dateLong = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const when = (iso?: string) => (iso ? `${dayLabel(iso)} ${hhmm(iso)}` : '');

export const relative = (iso?: string) => {
  if (!iso) return '';
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff} min ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h} h ago`;
  return `${Math.floor(h / 24)} d ago`;
};

export const duration = (fromIso: string, toIso?: string) => {
  const ms = new Date(toIso ?? Date.now()).getTime() - new Date(fromIso).getTime();
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return `${m}:${String(r).padStart(2, '0')}`;
};

export const initials = (name: string) =>
  name
    .replace(/[^A-Za-z ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

export const rm = (n: number) => `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const code4 = () => String(Math.floor(1000 + Math.random() * 9000));

export const maskPhone = (p: string) => {
  const digits = p.replace(/\D/g, '');
  if (digits.length < 7) return p;
  return `${digits.slice(0, 3)}-••• ${digits.slice(-4)}`;
};

/** Deterministic decorative QR-style path for a 29×29 grid. */
export const qrPath = (seedText: string) => {
  const N = 29;
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) % 233280;
  seed = seed || 7;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  let d = '';
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (inFinder(x, y)) continue;
      if (x === 6 || y === 6) {
        if ((x + y) % 2 === 0) d += `M${x} ${y}h1v1h-1z`;
        continue;
      }
      if (rnd() > 0.52) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  const finder = (x: number, y: number) => {
    d += `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);
  return d;
};

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Trigger a real file download in the browser. */
export const downloadFile = (filename: string, content: string, mime = 'text/csv;charset=utf-8') => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const toCsv = (rows: (string | number | undefined)[][]) =>
  rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');

export const todayStamp = () => new Date().toISOString().slice(0, 10);

/** Deterministic 6-digit pass PIN for a visit id (shown on the pass, typed by the guard). */
export const passCode = (id: string) => {
  let h = 7;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 900000;
  return String(100000 + h);
};
