import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padded?: boolean;
  interactive?: boolean;
};

export default function Card({
  padded = true,
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-surface",
        interactive && "transition-shadow hover:shadow-md",
        padded && "p-5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
