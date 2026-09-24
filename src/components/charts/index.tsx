import { useEffect, useRef, useState } from 'react';

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

interface Tip { x: number; y: number; text: string }

function Tooltip({ tip }: { tip: Tip | null }) {
  if (!tip) return null;
  return (
    <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-[11.5px] font-semibold text-white shadow-pop" style={{ left: tip.x, top: tip.y - 8 }}>
      {tip.text}
    </div>
  );
}

const AXIS = { fontSize: 11, fill: '#5B6585', fontFamily: '"Plus Jakarta Sans", sans-serif' } as const;

/** Vertical bars with an optional dashed comparison line (same unit, one axis). */
export function BarChart({ values, labels, compare, max, height = 220, ariaLabel, highlightLast, tipLabel, labelEvery = 1 }: {
  values: number[]; labels: string[]; compare?: number[]; max?: number; height?: number; ariaLabel: string; highlightLast?: boolean;
  tipLabel: (i: number) => string; labelEvery?: number;
}) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const left = 32, bottom = 24, top = 12;
  const H = height - bottom - top;
  const m = max ?? (Math.ceil(Math.max(...values, ...(compare ?? [])) / 5) * 5 || 5);
  const step = (W - left) / values.length;
  const bw = Math.max(4, Math.min(28, step - 6));
  const y = (v: number) => top + H - (v / m) * H;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(m * f));
  const path = compare?.map((v, i) => `${i ? 'L' : 'M'}${(left + i * step + step / 2).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setTip(null)}>
      <svg width={W} height={height} role="img" aria-label={ariaLabel} className="block max-w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W} y1={y(t)} y2={y(t)} stroke="#EEF2F8" />
            <text x={left - 8} y={y(t) + 4} textAnchor="end" {...AXIS}>{t}</text>
          </g>
        ))}
        {values.map((v, i) => {
          const h = (v / m) * H;
          const cx = left + i * step + step / 2;
          return (
            <g key={i}>
              {h > 0 && <rect x={cx - bw / 2} y={y(v)} width={bw} height={h} rx={Math.min(4, bw / 2)} fill={highlightLast && i === values.length - 1 ? '#8FA9F2' : '#1D4FE0'} />}
              <rect x={left + i * step} y={top} width={step} height={H} fill="transparent" onMouseEnter={() => setTip({ x: cx, y: y(Math.max(v, compare?.[i] ?? 0)), text: tipLabel(i) })} />
              {i % labelEvery === 0 && <text x={cx} y={height - 6} textAnchor="middle" {...AXIS}>{labels[i]}</text>}
            </g>
          );
        })}
        {path && <path d={path} fill="none" stroke="#0B1640" strokeWidth="2" strokeDasharray="5 4" pointerEvents="none" />}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

/** Single-series line with an optional target line and area. */
export function LineChart({ values, labels, target, max, height = 230, ariaLabel, format, tipLabel, labelIdx }: {
  values: number[]; labels: string[]; target?: number; max: number; height?: number; ariaLabel: string; format: (v: number) => string; tipLabel: (i: number) => string; labelIdx: number[];
}) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const [tip, setTip] = useState<Tip | null>(null);
  const left = 44, right = 12, bottom = 24, top = 12;
  const H = height - bottom - top;
  const step = (W - left - right) / (values.length - 1);
  const x = (i: number) => left + i * step;
  const y = (v: number) => top + H - (v / max) * H;
  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(values.length - 1)} ${top + H} L${left} ${top + H} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => max * f);
  const last = values.length - 1;
  return (
    <div ref={ref} className="relative w-full" onMouseLeave={() => setTip(null)}>
      <svg width={W} height={height} role="img" aria-label={ariaLabel} className="block max-w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={W - right} y1={y(t)} y2={y(t)} stroke="#EEF2F8" />
            <text x={left - 8} y={y(t) + 4} textAnchor="end" {...AXIS}>{format(t)}</text>
          </g>
        ))}
        {target !== undefined && <line x1={left} x2={W - right} y1={y(target)} y2={y(target)} stroke="#B42318" strokeWidth="1.5" strokeDasharray="6 4" />}
        <path d={area} fill="#1D4FE0" opacity="0.08" />
        <path d={line} fill="none" stroke="#1D4FE0" strokeWidth="2" strokeLinejoin="round" />
        {values.map((v, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(v)} r={i === last ? 5 : 3} fill={i === last ? '#1D4FE0' : '#fff'} stroke={i === last ? '#fff' : '#1D4FE0'} strokeWidth="2" />
            <rect x={x(i) - step / 2} y={top} width={step} height={H} fill="transparent" onMouseEnter={() => setTip({ x: x(i), y: y(v), text: tipLabel(i) })} />
          </g>
        ))}
        <text x={x(last) - 10} y={y(values[last]) + 22} textAnchor="end" fontSize="12" fontWeight="800" fill="#0B1640" fontFamily='"Plus Jakarta Sans", sans-serif'>{format(values[last])} today</text>
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor={i === last ? 'end' : i === 0 ? 'start' : 'middle'} {...AXIS}>{labels[i]}</text>
        ))}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}
