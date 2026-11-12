import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";

// One container for every screen. The width grows with the viewport: a single
// column on phones, more columns and a wider measure on tablets and desktops.
const WIDTHS = {
  narrow: "max-w-md md:max-w-xl lg:max-w-2xl",
  default: "max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl",
  wide: "max-w-md md:max-w-3xl lg:max-w-5xl xl:max-w-7xl",
} as const;

type PageContainerProps = {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
  className?: string;
};

export default function PageContainer({
  children,
  width = "default",
  className,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:py-10",
        WIDTHS[width],
        className
      )}
    >
      {children}
    </div>
  );
}
