import { cn } from "./cn";

export default function Skeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-surface-3", className)}
      aria-hidden="true"
    />
  );
}
