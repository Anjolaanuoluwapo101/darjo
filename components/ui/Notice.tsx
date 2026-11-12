import type { ReactNode } from "react";
import { cn } from "./cn";

type Variant = "info" | "success" | "error" | "warning";

const variants: Record<Variant, string> = {
  info: "border-line bg-surface-2 text-muted",
  success: "border-safe-line bg-safe-soft text-safe-ink",
  error: "border-error-line bg-error-soft text-error-ink",
  warning: "border-risky-line bg-risky-soft text-risky-ink",
};

type NoticeProps = {
  variant?: Variant;
  title?: string;
  className?: string;
  children?: ReactNode;
};

export default function Notice({
  variant = "info",
  title,
  className,
  children,
}: NoticeProps) {
  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        variants[variant],
        className
      )}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
    </div>
  );
}
