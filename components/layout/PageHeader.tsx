import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export default function PageHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          {eyebrow ? (
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="balance max-w-prose text-sm leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  );
}
