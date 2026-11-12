import type { ReactNode } from "react";
import { cn } from "./cn";

type SectionProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export default function Section({
  title,
  description,
  action,
  className,
  children,
}: SectionProps) {
  return (
    <section className={cn("flex flex-col gap-3", className)}>
      {title || action ? (
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            {title ? (
              <h2 className="text-sm font-semibold tracking-tight text-ink">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
