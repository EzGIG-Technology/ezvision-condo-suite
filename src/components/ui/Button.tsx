import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'teal' | 'dark' | 'night' | 'nightPrimary' | 'amber' | 'white';
export type Size = 'sm' | 'md' | 'lg' | 'xl';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-white border-brand hover:bg-brand-dark',
  secondary: 'bg-white text-navy border-line-strong hover:border-[#B9C6E2] hover:bg-[#FAFBFE]',
  danger: 'bg-danger text-white border-danger hover:bg-[#B8261B]',
  ghost: 'bg-transparent text-muted-dark border-transparent hover:bg-navy/5',
  teal: 'bg-teal text-white border-teal hover:bg-[#0F8A7A]',
  dark: 'bg-navy text-white border-navy hover:bg-navy-800',
  night: 'bg-navy-700 text-white border-navy-500 hover:bg-[#1c2b6b]',
  nightPrimary: 'bg-brand text-white border-brand hover:bg-brand-dark',
  amber: 'bg-[#B45309] text-white border-[#B45309] hover:bg-[#9A4708]',
  white: 'bg-white text-navy border-white hover:bg-ice',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-[13px] gap-2 rounded-[10px]',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-xl',
  xl: 'h-[60px] px-5 text-[15px] gap-2.5 rounded-2xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  block?: boolean;
}

export const buttonClass = (variant: Variant = 'secondary', size: Size = 'md', block?: boolean, extra?: string) =>
  cn(
    'inline-flex select-none items-center justify-center whitespace-nowrap border font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    variants[variant],
    sizes[size],
    block && 'w-full',
    extra,
  );

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, loading, block, className, children, type = 'button', disabled, ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} className={buttonClass(variant, size, block, className)} {...rest}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function LinkButton({ variant = 'secondary', size = 'md', icon, block, className, children, ...rest }: LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode; block?: boolean }) {
  return (
    <Link className={buttonClass(variant, size, block, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" aria-label={label} title={label} className={cn('inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-line bg-white text-navy transition-colors hover:bg-ice', className)} {...rest}>
      {children}
    </button>
  );
}
