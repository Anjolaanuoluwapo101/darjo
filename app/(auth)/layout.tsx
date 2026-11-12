import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/brand/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";

const FEATURES = [
  {
    title: "Save in a rhythm",
    body: "Everyone contributes the same amount each cycle, so the pot grows predictably.",
    icon: (
      <path d="M12 3v18M7 8h7a3 3 0 0 1 0 6H8a2.5 2.5 0 0 0 0 5h6" />
    ),
  },
  {
    title: "Take turns collecting",
    body: "Turn order is set up front. No negotiating, no surprises when the pot is ready.",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
  {
    title: "Build portable trust",
    body: "Every on-time payment strengthens a score you can carry into new circles.",
    icon: (
      <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-2.5Z" />
    ),
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-surface-2 lg:flex-row">
      <section className="relative hidden overflow-hidden bg-[#151038] text-white lg:flex lg:w-[47%] lg:flex-col xl:w-1/2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-[#4f46e5]/35 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-[#0ea5e9]/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:64px_64px]"
        />

        <div className="relative z-10 flex h-full flex-col p-10 xl:p-14">
          <div className="flex items-center justify-between gap-4">
            <Logo href="/" size="md" tone="inverse" />
            <Link
              href="/"
              className="text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              Back to home
            </Link>
          </div>

          <div className="my-auto flex max-w-lg flex-col gap-8 py-12">
            <div className="flex flex-col gap-5">
              <span className="w-fit rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                Rotating savings, rebuilt
              </span>
              <h1 className="balance text-4xl font-semibold leading-[1.08] tracking-tight xl:text-5xl">
                Your circle. Your capital. Your credit.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-white/70 xl:text-lg">
                A savings circle for people who already trust each other — with
                a clear schedule, a visible pot, and a score that grows every
                time you show up.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-white/60">
                  Cycle 3 pot
                </span>
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  75% funded
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight">
                $4,000
                <span className="ml-1.5 text-base font-normal text-white/50">
                  of $5,000
                </span>
              </p>
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#818cf8] to-[#38bdf8]" />
              </div>
              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex -space-x-2" aria-hidden="true">
                  {["AK", "MO", "TS", "JN"].map((initials) => (
                    <span
                      key={initials}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#242048] bg-[#312e81] text-[10px] font-semibold text-white"
                    >
                      {initials}
                    </span>
                  ))}
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#242048] bg-white/10 text-[10px] font-semibold text-white/70">
                    +4
                  </span>
                </div>
                <span className="text-xs text-white/50">8 members · monthly</span>
              </div>
            </div>

            <ul className="flex flex-col gap-4">
              {FEATURES.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.07] text-white/80">
                    <svg
                      className="h-[18px] w-[18px]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      {feature.icon}
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {feature.title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/55">
                      {feature.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-white/45">
            <p>Demo experience. Contributions are processed in a sandbox.</p>
            <Link
              href="/about"
              className="font-medium text-white/65 transition-colors hover:text-white"
            >
              How D&apos;arjo works
            </Link>
          </div>
        </div>
      </section>

      <section className="relative flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8">
        <div className="absolute right-4 top-4 flex items-center gap-1 sm:right-6 sm:top-5">
          <ThemeToggle />
        </div>

        <div className="mb-8 flex w-full max-w-md items-center justify-between lg:hidden">
          <Logo href="/" size="md" />
          <Link
            href="/"
            className="text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            Back to home
          </Link>
        </div>

        <div className="w-full max-w-md">{children}</div>
      </section>
    </main>
  );
}
