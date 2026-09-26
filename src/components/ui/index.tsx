import { useEffect, useId, useRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { useToasts } from '@/store/toast';
import { Button } from './Button';

/* ---------- Chip ---------- */
export type ChipTone = 'red' | 'amber' | 'teal' | 'blue' | 'grey' | 'purple' | 'navy';
const chipTones: Record<ChipTone, string> = {
  red: 'bg-danger-soft text-danger-ink',
  amber: 'bg-warn-soft text-warn-ink',
  teal: 'bg-teal-soft text-teal-dark',
  blue: 'bg-brand-soft text-brand-ink',
  grey: 'bg-[#EEF1F7] text-muted-dark',
  purple: 'bg-grape-soft text-grape-ink',
  navy: 'bg-navy text-white',
};
const chipTonesDark: Record<ChipTone, string> = {
  red: 'bg-[rgba(229,72,77,.2)] text-[#FFA3A6]',
  amber: 'bg-[rgba(245,158,11,.2)] text-[#FCC56B]',
  teal: 'bg-[rgba(20,184,166,.2)] text-[#5EEAD4]',
  blue: 'bg-[rgba(59,130,246,.22)] text-[#A9C4FF]',
  grey: 'bg-night-line text-[#C9D3EE]',
  purple: 'bg-[rgba(139,92,246,.22)] text-[#C4B5FD]',
  navy: 'bg-white text-navy',
};
export function Chip({ tone = 'grey', dark, className, children, dot }: { tone?: ChipTone; dark?: boolean; className?: string; children: ReactNode; dot?: boolean }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-bold', dark ? chipTonesDark[tone] : chipTones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

/* ---------- Card ---------- */
export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, sub, action, className }: { title: ReactNode; sub?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="h2">{title}</h2>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Plate ---------- */
export function Plate({ children, light, className }: { children: ReactNode; light?: boolean; className?: string }) {
  return <span className={cn('inline-block whitespace-nowrap rounded-md px-2 py-0.5 font-mono text-xs font-bold', light ? 'bg-[#EEF2FA] text-navy' : 'bg-navy text-white', className)}>{children}</span>;
}

/* ---------- Avatar ---------- */
export function Avatar({ name, color = '#1D4FE0', size = 32, className }: { name: string; color?: string; size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white', className)} style={{ width: size, height: size, background: color, fontSize: Math.round(size * 0.36) }} aria-hidden>
      {initials(name)}
    </span>
  );
}

/* ---------- Form fields ---------- */
export function Field({ label, hint, children, className, dark }: { label: string; hint?: ReactNode; children: (id: string) => ReactNode; className?: string; dark?: boolean }) {
  const id = useId();
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={cn('text-xs font-bold', dark ? 'text-muted-light' : 'text-muted-dark')}>
        {label}
      </label>
      {children(id)}
      {hint && <span className={cn('text-[11.5px]', dark ? 'text-muted-light' : 'text-muted')}>{hint}</span>}
    </div>
  );
}

const inputBase = 'w-full rounded-[10px] border px-3 text-[13.5px] font-medium outline-none transition-colors placeholder:text-[#8C95B0]';
export const inputLight = cn(inputBase, 'h-10 border-line-strong bg-white text-navy focus:border-brand focus:ring-2 focus:ring-brand/15');
export const inputDark = cn(inputBase, 'h-[52px] rounded-xl border-navy-500 bg-night-field text-[15px] text-white focus:border-brand-light');

/** Let a caller's width (w-36, w-auto …) and height (h-8 …) override the defaults, since cn() doesn't merge Tailwind classes. */
const fit = (base: string, className?: string) => {
  let b = base;
  if (className && /(^|\s)w-/.test(className)) b = b.replace(/(^|\s)w-full(?=\s|$)/, ' ');
  if (className && /(^|\s)h-/.test(className)) b = b.replace(/(^|\s)h-(10|\[52px\])(?=\s|$)/, ' ');
  return cn(b, className);
};

export function Input({ dark, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { dark?: boolean }) {
  return <input className={fit(dark ? inputDark : inputLight, className)} {...rest} />;
}
export function Select({ dark, className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { dark?: boolean }) {
  return (
    <select className={fit(cn(dark ? inputDark : inputLight, 'pr-8'), className)} {...rest}>
      {children}
    </select>
  );
}
export function Textarea({ dark, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { dark?: boolean }) {
  return <textarea className={fit(cn(dark ? inputDark : inputLight, 'h-auto min-h-[96px] resize-y py-2.5 leading-relaxed'), className)} {...rest} />;
}

export function Switch({ checked, onChange, label, dark, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; dark?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-10 shrink-0 rounded-full transition-colors disabled:opacity-50', checked ? 'bg-brand' : dark ? 'bg-navy-500' : 'bg-[#C9D5EC]')}
    >
      <span className={cn('absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all', checked ? 'left-[19px]' : 'left-[3px]')} />
    </button>
  );
}

export function Checkbox({ checked, onChange, label, sub, dark, className }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; sub?: ReactNode; dark?: boolean; className?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-start gap-2.5 text-[13px] font-semibold', dark ? 'text-white' : 'text-muted-dark', className)}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-brand" />
      <span className="flex flex-col gap-0.5">
        <span>{label}</span>
        {sub && <span className={cn('text-[11.5px] font-medium', dark ? 'text-muted-light' : 'text-muted')}>{sub}</span>}
      </span>
    </label>
  );
}

/* ---------- Segmented tabs ---------- */
export function Segmented<T extends string>({ value, onChange, options, dark, className, full, label }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; dark?: boolean; className?: string; full?: boolean; label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn('inline-flex max-w-full gap-0.5 overflow-x-auto rounded-[11px] p-[3px] scrollbar-thin', dark ? 'bg-night-panel' : 'bg-[#E9EEF7]', full && 'flex w-full', className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              'h-8 shrink-0 whitespace-nowrap rounded-lg px-3 text-[12.5px] font-semibold transition-colors',
              full && 'flex-1',
              dark ? (on ? 'bg-brand text-white' : 'text-muted-light hover:text-white') : on ? 'bg-white text-navy shadow-sm' : 'text-muted-dark hover:text-navy',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Progress ---------- */
export function Progress({ value, color = '#1D4FE0', track = '#EEF2F8', h = 8, label }: { value: number; color?: string; track?: string; h?: number; label?: string }) {
  return (
    <div className="w-full rounded-full" style={{ background: track, height: h }} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color, height: h }} />
    </div>
  );
}

/* ---------- Empty ---------- */
export function Empty({ icon, title, body, action, dark }: { icon?: ReactNode; title: string; body?: string; action?: ReactNode; dark?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {icon && <span className={cn('mb-1 flex h-12 w-12 items-center justify-center rounded-2xl', dark ? 'bg-night-line text-muted-light' : 'bg-ice text-muted')}>{icon}</span>}
      <p className="text-sm font-bold">{title}</p>
      {body && <p className={cn('max-w-xs text-[12.5px]', dark ? 'text-muted-light' : 'text-muted')}>{body}</p>}
      {action}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, description, children, footer, size = 'md', dark }: {
  open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children?: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl'; dark?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the open/focus effect on every render
  // (callers usually pass an inline arrow, which would otherwise steal focus while typing).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => {
      const el = ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
      el?.focus();
    }, 30);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(t);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [open]);
  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Close dialog" data-close className="absolute inset-0 animate-fade-in bg-navy/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn('dialog-panel relative flex max-h-[92vh] w-full animate-slide-up flex-col overflow-hidden rounded-t-3xl shadow-pop sm:rounded-2xl', widths[size], dark ? 'bg-night-panel text-white' : 'bg-white text-navy')}
      >
        <div className={cn('flex items-start justify-between gap-4 border-b px-5 py-4', dark ? 'border-night-line' : 'border-line')}>
          <div className="flex min-w-0 flex-col gap-1">
            <h2 className="text-[17px] font-extrabold tracking-tight">{title}</h2>
            {description && <p className={cn('text-[13px]', dark ? 'text-muted-light' : 'text-muted')}>{description}</p>}
          </div>
          <button type="button" data-close aria-label="Close" onClick={onClose} className={cn('-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', dark ? 'text-muted-light hover:bg-night-line' : 'text-muted hover:bg-ice')}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {children && <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>}
        {footer && <div className={cn('flex flex-wrap justify-end gap-2 border-t px-5 py-3.5', dark ? 'border-night-line' : 'border-line')}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Confirm({ open, onClose, onConfirm, title, body, confirmLabel = 'Confirm', danger, dark }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; body?: ReactNode; confirmLabel?: string; danger?: boolean; dark?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" dark={dark}
      footer={<>
        <Button variant={dark ? 'night' : 'secondary'} onClick={onClose}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
      </>}
    >
      {body && <div className={cn('text-[13.5px] leading-relaxed', dark ? 'text-[#C9D3EE]' : 'text-muted-dark')}>{body}</div>}
    </Modal>
  );
}

/* ---------- Drawer ---------- */
export function Drawer({ open, onClose, title, children, side = 'right', width = 420, footer }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; side?: 'right' | 'left'; width?: number; footer?: ReactNode;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[55]">
      <button type="button" aria-label="Close panel" className="absolute inset-0 animate-fade-in bg-navy/45" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn('absolute top-0 flex h-full w-full flex-col bg-white shadow-pop', side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left')}
        style={{ maxWidth: width }}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-[17px] font-extrabold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-ice">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="border-t border-line px-5 py-3.5">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

/* ---------- Toaster ---------- */
export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  const icons = { success: CheckCircle2, info: Info, warning: AlertTriangle, error: XCircle };
  const colors = { success: 'text-teal', info: 'text-brand', warning: 'text-warn', error: 'text-danger' };
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 sm:bottom-auto sm:left-auto sm:right-4 sm:top-4 sm:items-end">
      {toasts.map((t) => {
        const Icon = icons[t.tone];
        return (
          <div key={t.id} role="status" className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-2xl border border-line bg-white p-3.5 text-navy shadow-pop">
            <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', colors[t.tone])} aria-hidden />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-[13.5px] font-bold">{t.title}</p>
              {t.body && <p className="text-[12.5px] text-muted">{t.body}</p>}
            </div>
            <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="-m-1 flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-ice">
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Stat tile ---------- */
export function Stat({ label, value, note, noteTone = 'muted', icon, iconTone = 'blue', onClick, href }: {
  label: string; value: ReactNode; note?: ReactNode; noteTone?: 'muted' | 'red' | 'amber' | 'teal'; icon?: ReactNode; iconTone?: ChipTone; onClick?: () => void; href?: string;
}) {
  const noteColor = { muted: 'text-muted-dark', red: 'text-danger-ink', amber: 'text-warn-ink', teal: 'text-teal-dark' }[noteTone];
  const inner = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12.5px] font-bold text-muted-dark">{label}</span>
        {icon && <span className={cn('flex h-8 w-8 items-center justify-center rounded-[9px]', chipTones[iconTone])}>{icon}</span>}
      </div>
      <div className="text-[28px] font-extrabold leading-none tracking-tight">{value}</div>
      {note && <div className={cn('text-xs font-semibold', noteColor)}>{note}</div>}
    </>
  );
  const cls = 'card flex flex-col gap-2.5 p-4 text-left transition-shadow hover:shadow-pop/20';
  if (href) {
    return (
      <a href={href} onClick={(e) => { if (onClick) { e.preventDefault(); onClick(); } }} className={cn(cls, 'cursor-pointer')}>
        {inner}
      </a>
    );
  }
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>{inner}</button>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function SrOnly({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
