// Buttons: one primary per screen (README 10). All variants are ≥ 44 px tall.
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '../router';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

const BASE =
  'inline-flex items-center justify-center gap-2 min-h-tap rounded-full px-5 py-2 text-base font-semibold transition ' +
  'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:brightness-95 active:brightness-90',
  secondary: 'bg-surface text-ink border border-border hover:bg-surface2',
  quiet: 'text-brand-text hover:bg-mint',
};

export function buttonClass(variant: ButtonVariant = 'primary', block = false, extra = ''): string {
  return `${BASE} ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${extra}`.trim();
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; block?: boolean };

export function Button({ variant = 'primary', block, className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, block, className)} {...rest} />;
}

type ButtonLinkProps = {
  to: string;
  variant?: ButtonVariant;
  block?: boolean;
  className?: string;
  replace?: boolean;
  children: ReactNode;
  onClick?: () => void;
};

export function ButtonLink({ to, variant = 'primary', block, className = '', replace, children, onClick }: ButtonLinkProps) {
  return (
    <Link to={to} replace={replace} onClick={onClick} className={buttonClass(variant, block, className)}>
      {children}
    </Link>
  );
}
