import type { ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'info' | 'warning' | 'positive';

const variants: Record<Variant, string> = {
  info: 'border-line bg-surface-2 text-muted',
  warning: 'border-risky-line bg-risky-soft text-risky-ink',
  positive: 'border-safe-line bg-safe-soft text-safe-ink',
};

const icons: Record<Variant, ReactNode> = {
  info: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 7.25v3.5M8 5.25v.5" />
    </svg>
  ),
  warning: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2.5 14 13H2L8 2.5Z" />
      <path d="M8 6.25v3M8 11.25v.5" />
    </svg>
  ),
  positive: (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 8.5 6.2 11.5 13 4.5" />
    </svg>
  ),
};

type InfoNoteProps = {
  title?: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export default function InfoNote({
  title,
  variant = 'info',
  className,
  children,
}: InfoNoteProps) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed',
        variants[variant],
        className
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[variant]}</span>
      <div>
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-1' : ''}>{children}</div>
      </div>
    </div>
  );
}
