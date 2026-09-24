import { memo } from 'react';
export { CamFeed } from './CamFeed';
import { cn, qrPath } from '@/lib/utils';

const LOOKS = [
  { hair: 'short', skin: '#B98A68', cloth: '#2F3B63', bg: '#1C2A55' },
  { hair: 'tudung', skin: '#C99B78', cloth: '#6B4F7A', bg: '#22305E' },
  { hair: 'cap', skin: '#8A5E45', cloth: '#3C4A3A', cap: '#1F2937', bg: '#1A2750' },
  { hair: 'hood', skin: '#7B5540', cloth: '#1E2433', bg: '#141F44' },
  { hair: 'long', skin: '#D8B394', cloth: '#35507E', hairC: '#231A16', bg: '#213061' },
  { hair: 'short', skin: '#6E4A36', cloth: '#5A6B7F', bg: '#1A2A52', mask: true },
  { hair: 'tudung', skin: '#B7865F', cloth: '#1F4E5F', bg: '#1C2B58' },
  { hair: 'cap', skin: '#C4966F', cloth: '#7A3E3E', cap: '#B45309', bg: '#1E2B55' },
] as const;

/** Stylised, anonymous face crop used in place of real CCTV snapshots. */
export const FaceCrop = memo(function FaceCrop({ variant = 1, className, rounded = 'rounded-xl', label }: { variant?: number; className?: string; rounded?: string; label?: string }) {
  const L = LOOKS[(Math.max(1, variant) - 1) % LOOKS.length] as (typeof LOOKS)[number] & { hairC?: string; cap?: string; mask?: boolean };
  const tudung = L.hair === 'tudung';
  return (
    <div className={cn('relative aspect-square overflow-hidden', rounded, className)} style={{ background: L.bg }} role="img" aria-label={label ?? 'Face snapshot'}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="100" height="100" fill={L.bg} />
        <path d="M0 0H100V30H0Z" fill="#fff" opacity="0.03" />
        {L.hair === 'long' && <path d="M30 40Q30 14 50 14Q70 14 70 40L73 76H27Z" fill={L.hairC ?? '#15151B'} />}
        <rect x="44" y="56" width="12" height="14" fill={L.skin} />
        <path d="M14 104Q16 72 50 68Q84 72 86 104Z" fill={L.cloth} />
        {tudung && <path d="M29 46Q29 14 50 14Q71 14 71 46Q74 66 88 104H12Q26 66 29 46Z" fill={L.cloth} />}
        {L.hair === 'hood' && <path d="M27 52Q27 12 50 12Q73 12 73 52L76 74H24Z" fill={L.cloth} />}
        <ellipse cx="50" cy={tudung ? 44 : 42} rx={tudung ? 13 : 15} ry={tudung ? 16 : 18.5} fill={L.skin} />
        {L.hair === 'hood' && <path d="M36 34Q50 26 64 34L64 40Q50 34 36 40Z" fill="#000" opacity="0.35" />}
        {L.hair === 'short' && <path d="M33 40Q34 18 50 18Q67 18 67 40Q63 28 50 28Q37 28 33 40Z" fill="#15151B" />}
        {L.hair === 'cap' && (
          <>
            <path d="M32 34Q34 15 50 15Q66 15 68 34Z" fill={L.cap ?? '#1F2937'} />
            <path d="M60 32L82 35L66 37Z" fill={L.cap ?? '#1F2937'} />
          </>
        )}
        {L.mask && <path d="M37 48H63Q63 60 50 62Q37 60 37 48Z" fill="#DCE3F0" />}
        <rect width="100" height="100" fill="#0B1640" opacity="0.12" />
      </svg>
    </div>
  );
});

export function QRCode({ value, size = 180, className }: { value: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 29 29" shapeRendering="crispEdges" role="img" aria-label="QR code" className={className}>
      <rect width="29" height="29" fill="#fff" />
      <path d={qrPath(value)} fill="#0B1640" />
    </svg>
  );
}

export function Logo({ dark = false, sub, size = 30, iconOnly = false }: { dark?: boolean; sub?: string; size?: number; iconOnly?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="9" fill="#1D4FE0" />
        <path d="M6 16s4-7 10-7 10 7 10 7-4 7-10 7S6 16 6 16z" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="16" cy="16" r="3.2" fill="#2DD4BF" />
      </svg>
      {iconOnly ? <span className="sr-only">EzVision</span> : <span className="flex flex-col leading-none">
        <span className="text-[19px] font-extrabold tracking-tight">
          <span className={dark ? 'text-white' : 'text-navy'}>Ez</span>
          <span className={dark ? 'text-brand-light' : 'text-brand'}>Vision</span>
          <span className="text-teal-bright">.</span>
        </span>
        {sub && <span className={cn('mt-1 text-[10.5px] font-bold uppercase tracking-[0.12em]', dark ? 'text-[#8D9CC7]' : 'text-muted')}>{sub}</span>}
      </span>}
    </span>
  );
}
