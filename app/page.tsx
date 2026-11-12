import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteHeader from '@/components/marketing/SiteHeader';
import HeroArt from '@/components/marketing/HeroArt';
import LinkButton from '@/components/ui/LinkButton';

export const metadata: Metadata = {
  title: "D'arjo — save together, take turns",
  description:
    "A rotating savings circle for trusted groups: clear cycles, a visible pot, and a trust score that grows with every on-time payment.",
};

const STATS = [
  { value: '2–12', label: 'members per circle' },
  { value: 'Weekly or monthly', label: 'contribution rhythm' },
  { value: '1.5%', label: 'platform fee on payouts' },
  { value: 'Tiered', label: 'portable trust score' },
];

const STEPS = [
  {
    title: 'Create the circle',
    body: 'Set the contribution, cycle rhythm, member limit and who can join. Every rule is visible before anyone commits.',
    icon: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
  },
  {
    title: 'Invite your people',
    body: 'Share the invite code with a group you already trust. Open circles stay open until they fill.',
    icon: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
        <path d="M17 8h4M19 6v4" />
      </>
    ),
  },
  {
    title: 'Contribute each cycle',
    body: 'Members pay the same amount each cycle. Pot progress, payment status and the next winner stay in view.',
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3 10h18M15 15h2" />
      </>
    ),
  },
  {
    title: 'Take your turn',
    body: 'The pot releases to the member whose turn it is. On-time payments strengthen the score you carry forward.',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
];

const FEATURES = [
  {
    title: 'A pot you can see',
    body: 'Every contribution updates the same shared view. No separate spreadsheets, and no guessing who has paid.',
    icon: (
      <>
        <path d="M3 7h18v10H3z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
  },
  {
    title: 'Order set up front',
    body: 'Turn positions are assigned before the circle starts, so everyone knows when their payout is due.',
    icon: (
      <>
        <path d="M4 6h16M4 12h10M4 18h7" />
      </>
    ),
  },
  {
    title: 'Risk made legible',
    body: 'Currency volatility and circle risk are surfaced with plain-language reasons — not buried in fine print.',
    icon: (
      <>
        <path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-2.5Z" />
        <path d="M12 9v3.5M12 16h.01" />
      </>
    ),
  },
  {
    title: 'A score that travels',
    body: 'Your tier follows your payment history. Better tiers unlock access to more circles and larger limits.',
    icon: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="M8 16v-4M12 16V8M16 16v-7M20 16V6" />
      </>
    ),
  },
];

const CAUTIONS = [
  {
    title: 'Circles depend on people',
    body: 'A late or missed contribution can delay the pot. Join with members you trust, and check the risk tag before you commit.',
  },
  {
    title: 'Exchange rates can move',
    body: 'The real cost of a USD contribution can change with your currency. Your profile shows a volatility reading for context.',
  },
  {
    title: 'This is a demo experience',
    body: 'Payments run in a sandbox. D\'arjo is not a bank, does not accept deposits and does not promise investment returns.',
  },
];

function SectionIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line bg-surface-2 text-primary">
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-safe" />
              Peer savings circles
            </span>

            <h1 className="balance max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Save together.
              <br />
              Take turns.
              <br />
              <span className="text-primary">Build trust.</span>
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              D&apos;arjo turns a familiar rotating savings circle into a clear,
              trackable system. One contribution per cycle, one payout per turn,
              and a trust score that grows when you show up.
            </p>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <LinkButton href="/signup" size="lg" className="sm:px-6">
                Start a circle
              </LinkButton>
              <LinkButton href="/#how-it-works" variant="outline" size="lg">
                See how it works
              </LinkButton>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {['No hidden steps', 'Visible cycle schedule', 'Portable score'].map(
                (item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4 text-safe"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 8.5 6.5 12 13 4.5" />
                    </svg>
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>

          <HeroArt />
        </section>

        <section className="border-y border-line bg-surface-2">
          <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-6 px-5 py-8 sm:px-8 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span className="text-lg font-semibold tracking-tight text-ink sm:text-xl">
                  {stat.value}
                </span>
                <span className="text-xs leading-relaxed text-muted sm:text-sm">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto w-full max-w-7xl scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20"
        >
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              How it works
            </p>
            <h2 className="balance mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Four steps, agreed before the first payment.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              The rules are simple on purpose. What changes is the visibility:
              everyone sees the same amount, the same order and the same pot.
            </p>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <SectionIcon>{step.icon}</SectionIcon>
                  <span className="font-mono text-sm font-semibold text-muted-soft">
                    0{index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-line bg-surface-2">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                Built for clarity
              </p>
              <h2 className="balance mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Less coordination. More confidence.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                A group chat can agree on a plan. It cannot show you whether the
                pot is funded, whose turn is next, or why a circle carries a
                risk tag. D&apos;arjo keeps those answers in one place.
              </p>

              <div className="mt-8 rounded-2xl border border-line bg-surface p-5">
                <p className="text-sm font-semibold text-ink">
                  What you can check at any time
                </p>
                <ul className="mt-3 flex flex-col gap-2.5 text-sm text-muted">
                  {[
                    'The exact pot collected so far this cycle',
                    'Who has paid, who is pending and who is late',
                    'The current winner and the turn order',
                    'The circle risk reason and currency context',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-safe"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 8.5 6.5 12 13 4.5" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5"
                >
                  <SectionIcon>{feature.icon}</SectionIcon>
                  <h3 className="text-base font-semibold tracking-tight text-ink">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Before you join
            </p>
            <h2 className="balance mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Built for trust, not guarantees.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              A savings circle is a commitment between people. The product makes
              the commitment easier to see; it does not remove the risk.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {CAUTIONS.map((item, index) => (
              <div
                key={item.title}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-surface-2 p-5"
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold ${
                    index === 1
                      ? 'bg-risky-soft text-risky-ink'
                      : 'bg-surface-3 text-muted'
                  }`}
                >
                  {index + 1}
                </span>
                <h3 className="text-base font-semibold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm text-muted">
            Read the full picture on the{' '}
            <Link
              href="/about"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              About page
            </Link>
            .
          </p>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20">
          <div className="relative overflow-hidden rounded-3xl bg-[#151038] px-6 py-12 text-white sm:px-10 sm:py-14 lg:px-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[#4f46e5]/40 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#0ea5e9]/20 blur-3xl"
            />
            <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              <div className="max-w-xl">
                <h2 className="balance text-3xl font-semibold tracking-tight sm:text-4xl">
                  Start with people you already trust.
                </h2>
                <p className="mt-3 text-base leading-relaxed text-white/65">
                  Create a circle, share the invite code and let the schedule do
                  the coordination.
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 text-base font-semibold text-[#151038] transition-colors hover:bg-white/90"
                >
                  Create an account
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
