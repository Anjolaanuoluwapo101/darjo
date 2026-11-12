import Link from 'next/link';
import { cn } from '@/components/ui/cn';

type LogoSize = 'sm' | 'md' | 'lg';

const MARK_SIZES: Record<LogoSize, string> = {
  sm: 'h-8 w-8 rounded-lg text-sm',
  md: 'h-9 w-9 rounded-xl text-base',
  lg: 'h-11 w-11 rounded-2xl text-lg',
};

const TEXT_SIZES: Record<LogoSize, string> = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

type LogoProps = {
  size?: LogoSize;
  tone?: 'default' | 'inverse';
  className?: string;
  href?: string;
  label?: string;
};

export default function Logo({
  size = 'md',
  tone = 'default',
  className,
  href,
  label = "D'arjo",
}: LogoProps) {
  const content = (
    <>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center font-bold tracking-tight',
          MARK_SIZES[size],
          tone === 'inverse'
            ? 'bg-white/15 text-white ring-1 ring-white/20'
            : 'bg-primary text-surface',
        )}
        aria-hidden="true"
      >
        D
      </span>
      <span
        className={cn(
          'font-semibold tracking-tight',
          TEXT_SIZES[size],
          tone === 'inverse' ? 'text-white' : 'text-ink',
        )}
      >
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'flex w-fit items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          className,
        )}
      >
        {content}
      </Link>
    );
  }

  return <span className={cn('flex w-fit items-center gap-2', className)}>{content}</span>;
}
