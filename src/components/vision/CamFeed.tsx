import { memo } from 'react';
import type { Scene, Tone } from '@/data/types';
import { cn } from '@/lib/utils';

const TONES: Record<Tone, string> = { red: '#F04438', amber: '#F79009', teal: '#14B8A6', blue: '#3B82F6' };
const BOXES: Record<Scene, [number, number, number, number, string]> = {
  gate: [110, 64, 104, 62, 'Vehicle · plate not registered'],
  lobby: [132, 63, 28, 76, 'Unregistered · 96%'],
  fence: [180, 46, 54, 70, 'Climbing · 97%'],
  carpark: [134, 76, 32, 68, 'Loitering 4m 12s'],
  corridor: [144, 62, 42, 86, 'Rider · beyond drop-off'],
  pool: [108, 86, 88, 24, 'Fall detected · 93%'],
  bin: [146, 104, 102, 44, 'Bulky item dumped'],
  sidegate: [144, 58, 34, 86, 'Unregistered · 94%'],
  guardpost: [60, 34, 200, 104, 'Post unattended'],
};

export interface CamFeedProps {
  scene: Scene;
  tone?: Tone;
  tag?: string;
  cam?: string;
  time?: string;
  plate?: string;
  boxLabel?: string;
  showBox?: boolean;
  live?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  aspect?: string;
  children?: React.ReactNode;
}

/** Stylised camera view with an AI detection overlay (illustrative, not real footage). */
export const CamFeed = memo(function CamFeed({ scene, tone = 'red', tag, cam, time, plate = 'VKT 5521', boxLabel, showBox = true, live = true, size = 'md', className, aspect = 'aspect-video', children }: CamFeedProps) {
  const color = TONES[tone];
  const [x, y, bw, bh, def] = BOXES[scene];
  const label = boxLabel || def;
  const lw = Math.round(label.length * 3.05 + 8);
  const c = 6;
  const corners = `M${x} ${y + c}V${y}H${x + c}M${x + bw - c} ${y}H${x + bw}V${y + c}M${x + bw} ${y + bh - c}V${y + bh}H${x + bw - c}M${x + c} ${y + bh}H${x}V${y + bh - c}`;
  const wall = scene === 'fence' ? '#070D22' : scene === 'pool' ? '#0D1636' : scene === 'carpark' ? '#0E1738' : '#101B3F';
  const floor = scene === 'fence' ? '#0A1128' : '#0C1532';
  const fs = { xs: 'text-[9px]', sm: 'text-[10.5px]', md: 'text-[11.5px]', lg: 'text-[13px]' }[size];
  const pad = { xs: 'p-1.5', sm: 'p-2', md: 'p-2.5', lg: 'p-3.5' }[size];
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-[#0C1532] text-white', !/(^|\s)w-/.test(className ?? '') && 'w-full', aspect, className)} role="img" aria-label={`${cam ?? 'Camera'} view${tag ? `: ${tag}` : ''}`}>
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <rect width="320" height="180" fill={floor} />
        <rect width="320" height="80" fill={wall} />
        <path d="M160 80L-80 180M160 80L20 180M160 80L110 180M160 80L210 180M160 80L300 180M160 80L400 180M0 88H320M0 101H320M0 122H320M0 156H320" stroke="#1B2A58" strokeWidth="0.6" fill="none" />
        {scene === 'gate' && (
          <g>
            <rect x="12" y="34" width="74" height="8" fill="#1E2D5E" />
            <rect x="18" y="42" width="62" height="58" fill="#16224A" stroke="#26386E" strokeWidth="0.8" />
            <rect x="26" y="52" width="46" height="20" fill="#F5C26B" opacity="0.28" />
            <rect x="92" y="72" width="8" height="32" fill="#2B3A6B" />
            <rect x="100" y="75" width="150" height="4" fill="#E8EEF8" />
            <path d="M112 75h10v4h-10zM140 75h10v4h-10zM168 75h10v4h-10zM196 75h10v4h-10zM224 75h10v4h-10z" fill="#E0484A" />
            <path d="M121 100L50 180H150Z" fill="#FDE9A8" opacity="0.06" />
            <path d="M203 100L174 180H274Z" fill="#FDE9A8" opacity="0.06" />
            <path d="M128 88L136 70H188L196 88Z" fill="#24335F" />
            <path d="M134 86L140 74H184L190 86Z" fill="#0F1A3A" />
            <rect x="116" y="86" width="92" height="30" rx="6" fill="#2E3F74" />
            <rect x="121" y="94" width="16" height="6" rx="2" fill="#FDE9A8" />
            <rect x="187" y="94" width="16" height="6" rx="2" fill="#FDE9A8" />
            <rect x="146" y="95" width="32" height="8" rx="2" fill="#1A254B" />
            <rect x="144" y="105.5" width="36" height="8.5" rx="1" fill="#EEF2FA" />
            <text x="162" y="112" fontSize="5.8" textAnchor="middle" fill="#0B1640" fontFamily="'JetBrains Mono', monospace" fontWeight="700">{plate}</text>
            <rect x="120" y="114" width="14" height="8" rx="2" fill="#0A1128" />
            <rect x="190" y="114" width="14" height="8" rx="2" fill="#0A1128" />
          </g>
        )}
        {scene === 'lobby' && (
          <g>
            <rect x="40" y="18" width="240" height="64" fill="#122050" />
            <rect x="104" y="24" width="52" height="58" fill="#1A3066" opacity="0.8" />
            <rect x="164" y="24" width="52" height="58" fill="#1A3066" opacity="0.8" />
            <path d="M100 18V82M160 18V82M220 18V82" stroke="#2A3E78" strokeWidth="1.5" />
            <path d="M70 8h40v2H70zM140 8h40v2h-40zM210 8h40v2h-40z" fill="#CFE0FF" opacity="0.55" />
            <rect x="56" y="104" width="18" height="28" rx="2" fill="#2B3A6B" />
            <rect x="190" y="104" width="18" height="28" rx="2" fill="#2B3A6B" />
            <rect x="246" y="104" width="18" height="28" rx="2" fill="#2B3A6B" />
            <path d="M74 112H96M208 112H230" stroke="#6B7FB8" strokeWidth="2" />
            <circle cx="146" cy="74" r="6" fill="#3F528C" />
            <path d="M137 85Q146 80 155 85L157 116H135Z" fill="#33467F" />
            <path d="M138 116h7v20h-7zM147 116h7v20h-7z" fill="#27366A" />
            <circle cx="118" cy="79" r="6.5" fill="#4A5E9A" />
            <path d="M108 91Q118 85 128 91L130 125H106Z" fill="#3A4D86" />
            <path d="M110 125h7v22h-7zM119 125h7v22h-7z" fill="#2C3C6E" />
            {showBox && (
              <>
                <rect x="102" y="69" width="32" height="80" fill="none" stroke="#2DD4BF" strokeWidth="1.1" />
                <rect x="102" y="150" width="58" height="8.5" fill="#2DD4BF" />
                <text x="105" y="156.4" fontSize="5.4" fill="#062A26" fontWeight="700">Resident · A-08-2</text>
              </>
            )}
          </g>
        )}
        {scene === 'fence' && (
          <g>
            <circle cx="44" cy="22" r="14" fill="#F5C26B" opacity="0.12" />
            <circle cx="44" cy="22" r="3" fill="#F5E3B5" opacity="0.8" />
            <path d="M0 68H320M0 112H320" stroke="#2F3F74" strokeWidth="2.4" />
            <path d={Array.from({ length: 23 }, (_, i) => `M${8 + i * 14} 60V128`).join('')} stroke="#26356A" strokeWidth="2" />
            <path d="M0 132H320" stroke="#22D3EE" strokeWidth="1.2" strokeDasharray="5 3" />
            <text x="6" y="143" fontSize="5.2" fill="#67E8F9" fontWeight="600">VIRTUAL TRIPWIRE · PERIMETER NORTH</text>
            <circle cx="207" cy="57" r="6" fill="#4A5E9A" />
            <path d="M197 65L215 67L211 95L195 91Z" fill="#3A4D86" />
            <path d="M213 70L228 58M199 70L188 62" stroke="#3A4D86" strokeWidth="4" strokeLinecap="round" />
            <path d="M197 92L186 108M207 95L215 112" stroke="#2C3C6E" strokeWidth="5" strokeLinecap="round" />
          </g>
        )}
        {scene === 'carpark' && (
          <g>
            <path d="M96 12h36v3H96zM148 12h36v3h-36zM200 12h36v3h-36z" fill="#CFE0FF" opacity="0.5" />
            <rect x="56" y="24" width="14" height="96" fill="#1A2956" />
            <rect x="250" y="24" width="14" height="96" fill="#1A2956" />
            <rect x="40" y="80" width="34" height="16" rx="3" fill="#26366A" />
            <rect x="246" y="80" width="34" height="16" rx="3" fill="#26366A" />
            {[14, 74, 190, 252].map((cx, i) => (
              <g key={cx}>
                <rect x={cx} y="98" width="50" height="24" rx="5" fill={['#2E3F74', '#34467E', '#2E3F74', '#3A4C86'][i]} />
                <rect x={cx + 6} y="101" width="38" height="8" rx="2" fill="#0F1A3A" />
                <path d={`M${cx + 2} 112h8v4h-8zM${cx + 40} 112h8v4h-8z`} fill="#F97066" />
              </g>
            ))}
            <circle cx="150" cy="86" r="5" fill="#4A5E9A" />
            <path d="M142 95Q150 90 158 95L159 122H141Z" fill="#3A4D86" />
            <path d="M143 122h6v18h-6zM151 122h6v18h-6z" fill="#2C3C6E" />
            <path d="M0 150H320" stroke="#F5C26B" strokeWidth="1" strokeDasharray="8 6" opacity="0.5" />
          </g>
        )}
        {scene === 'corridor' && (
          <g>
            <rect x="84" y="20" width="62" height="80" fill="#1E2F63" />
            <rect x="174" y="20" width="62" height="80" fill="#1E2F63" />
            <path d="M115 20V100M205 20V100" stroke="#101B3F" strokeWidth="1.5" />
            <rect x="104" y="10" width="22" height="7" rx="1" fill="#0A1128" />
            <rect x="194" y="10" width="22" height="7" rx="1" fill="#0A1128" />
            <text x="115" y="15.6" fontSize="5" textAnchor="middle" fill="#F79009" fontFamily="'JetBrains Mono', monospace">12</text>
            <text x="205" y="15.6" fontSize="5" textAnchor="middle" fill="#F79009" fontFamily="'JetBrains Mono', monospace">G</text>
            <circle cx="162" cy="74" r="6" fill="#4A5E9A" />
            <path d="M152 86Q162 80 172 86L174 120H150Z" fill="#3A4D86" />
            <rect x="170" y="94" width="12" height="14" rx="2" fill="#F79009" opacity="0.8" />
            <path d="M154 120h7v24h-7zM163 120h7v24h-7z" fill="#2C3C6E" />
          </g>
        )}
        {scene === 'pool' && (
          <g>
            <rect x="0" y="80" width="320" height="34" fill="#1A2956" />
            <rect x="0" y="114" width="320" height="66" fill="#0E3A5E" />
            <path d="M10 128q10-4 20 0t20 0 20 0 20 0M120 142q10-4 20 0t20 0 20 0 20 0M40 160q10-4 20 0t20 0 20 0M200 124q10-4 20 0t20 0 20 0M230 164q10-4 20 0t20 0 20 0" stroke="#2A6E9E" strokeWidth="1" fill="none" />
            <rect x="228" y="86" width="44" height="10" rx="2" fill="#2B3A6B" />
            <rect x="30" y="86" width="44" height="10" rx="2" fill="#2B3A6B" />
            <circle cx="120" cy="98" r="5.5" fill="#4A5E9A" />
            <rect x="126" y="93.5" width="42" height="10" rx="4" fill="#3A4D86" />
            <rect x="167" y="95" width="24" height="7" rx="3" fill="#2C3C6E" />
          </g>
        )}
        {scene === 'bin' && (
          <g>
            <rect x="20" y="16" width="280" height="68" fill="#16224A" />
            <path d="M150 22H290M150 30H290M150 38H290M150 46H290M150 54H290M150 62H290M150 70H290M150 78H290" stroke="#223266" strokeWidth="1.2" />
            <rect x="30" y="66" width="30" height="40" rx="3" fill="#1E4A4A" />
            <rect x="68" y="66" width="30" height="40" rx="3" fill="#1E4A4A" />
            <rect x="106" y="66" width="30" height="40" rx="3" fill="#1E4A4A" />
            <path d="M150 120L230 110L242 132L162 144Z" fill="#5B6A9A" />
            <path d="M170 118L182 139M190 116L202 136M210 113L222 133" stroke="#7684B3" strokeWidth="1" />
            <rect x="252" y="118" width="22" height="16" rx="1" fill="#6B5B45" />
          </g>
        )}
        {scene === 'sidegate' && (
          <g>
            <rect x="0" y="30" width="126" height="70" fill="#1A2956" />
            <rect x="194" y="30" width="126" height="70" fill="#1A2956" />
            <path d="M126 40H194M126 96H194" stroke="#2F3F74" strokeWidth="2" />
            <path d="M132 40V96M140 40V96M148 40V96M178 40V96M186 40V96" stroke="#2F3F74" strokeWidth="1.6" />
            <circle cx="161" cy="70" r="6" fill="#4A5E9A" />
            <path d="M151 81Q161 76 171 81L173 114H149Z" fill="#3A4D86" />
            <path d="M153 114L149 140M166 114L172 139" stroke="#2C3C6E" strokeWidth="6" strokeLinecap="round" />
            <circle cx="60" cy="20" r="3" fill="#F5E3B5" opacity="0.7" />
          </g>
        )}
        {scene === 'guardpost' && (
          <g>
            <rect x="40" y="26" width="240" height="54" fill="#16224A" />
            <rect x="70" y="40" width="44" height="28" rx="2" fill="#2A4A8A" opacity="0.7" />
            <rect x="124" y="40" width="44" height="28" rx="2" fill="#2A4A8A" opacity="0.7" />
            <rect x="178" y="40" width="44" height="28" rx="2" fill="#2A4A8A" opacity="0.7" />
            <rect x="30" y="96" width="260" height="12" fill="#2B3A6B" />
            <rect x="142" y="112" width="34" height="8" rx="3" fill="#33467F" />
            <rect x="156" y="120" width="6" height="18" fill="#26356A" />
            <rect x="140" y="84" width="38" height="28" rx="4" fill="#33467F" opacity="0.8" />
          </g>
        )}
        {showBox && (
          <g>
            <rect x={x} y={y} width={bw} height={bh} fill="none" stroke={color} strokeWidth="1.3" />
            <path d={corners} stroke={color} strokeWidth="2.6" fill="none" />
            <rect x={x} y={y - 9} width={lw} height="8.5" fill={color} />
            <text x={x + 3} y={y - 2.6} fontSize="5.4" fill="#fff" fontWeight="700">{label}</text>
          </g>
        )}
      </svg>
      {(tag || live) && (
        <div className={cn('absolute inset-x-0 top-0 flex items-start justify-between gap-2', pad)}>
          {tag ? (
            <span className={cn('flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[rgba(8,13,33,.78)] py-1 pl-2 pr-2.5 font-semibold leading-none', fs)}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              {tag}
            </span>
          ) : <span />}
          {live && (
            <span className={cn('flex items-center gap-1 rounded-md bg-[rgba(8,13,33,.78)] px-1.5 py-1 font-bold leading-none tracking-wider', fs)}>
              <span className="h-1.5 w-1.5 animate-pulse2 rounded-full bg-[#F04438]" />
              LIVE
            </span>
          )}
        </div>
      )}
      {(cam || time) && (
        <div className={cn('absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-[rgba(8,13,33,.85)] to-transparent', pad)}>
          <span className={cn('truncate font-semibold', fs)}>{cam}</span>
          <span className={cn('whitespace-nowrap font-mono text-[#C7D2EE]', fs)}>{time}</span>
        </div>
      )}
      {children}
    </div>
  );
});
