import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteHeader from '@/components/marketing/SiteHeader';
import LinkButton from '@/components/ui/LinkButton';

export const metadata: Metadata = {
  title: "About D'arjo — clearer rotating savings",
  description:
    "How D'arjo's savings circles work, how trust scores are built, what the platform fee covers, and the risks to understand before joining.",
};

const PRINCIPLES = [
  {
    title: 'The rules are visible',
    body: 'Contribution size, cycle rhythm, member limit and turn order are set before the circle starts. Members join the same agreement.',
  },
  {
    title: 'The pot is shared',
    body: 'Every member sees the same progress, payment statuses and next payout. Coordination stops living in a group chat.',
  },
  {
    title: 'Behaviour has context',
    body: 'On-time payments, recoveries and misses shape a score. Risk tags explain what is driving a circle, not just that it is risky.',
  },
  {
    title: 'The limits are honest',
    body: 'D\'arjo is not a bank or an investment product. It does not remove counterparty risk, and it does not guarantee a payout.',
  },
];

const MONEY_STEPS = [
  {
    title: 'A member pays a contribution',
    body: 'Each member pays the same amount for the cycle through the connected payment provider.',
  },
  {
    title: 'The pot accumulates',
    body: 'The shared pot view updates as payments clear. Pending and late statuses stay visible to the circle.',
  },
  {
    title: 'The payout releases',
    body: 'When the cycle is ready, the pot goes to the member whose turn it is. D\'arjo keeps a 1.5% platform fee on each payout.',
  },
  {
    title: 'The score updates',
    body: 'On-time payments, recoveries and misses are recorded. The resulting score travels with the member into future circles.',
  },
];

const NOT_LIST = [
  'Not a bank account, wallet or deposit-taking service.',
  'Not a savings guarantee or a promise of returns.',
  'Not a credit bureau or a formal credit score.',
  'Not a replacement for knowing the people in your circle.',
];

const FAQS = [
  {
    question: 'What happens if someone pays late?',
    answer:
      'The circle sees the late status, and the payout may wait until the pot is ready. Repeated misses affect the member\'s score and tier. D\'arjo does not cover a missed contribution from its own funds.',
  },
  {
    question: 'Can I join any circle?',
    answer:
      'Open circles can be joined with an invite code, subject to the member limit and any nationality filters the creator set. Some circles may also be limited by tier. Risk and currency context are shown before you commit.',
  },
  {
    question: 'How does the trust score work?',
    answer:
      'The score starts from a baseline and moves with payment behaviour: on-time payments help, recoveries restore some ground, and late or failed payments weigh on it. Tiers and rank are shown on your profile.',
  },
  {
    question: 'Is my money protected?',
    answer:
      'Payments run in a sandbox for this demo experience. There is no deposit protection and no guarantee of payout. Only join a circle when you trust the other members and understand the schedule.',
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              About D&apos;arjo
            </p>
            <h1 className="balance mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              A familiar idea, made easier to see.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              Rotating savings circles exist in many forms around the world:
              trusted groups pool money on a schedule and take turns receiving
              the pot. D&apos;arjo keeps that model, then adds transparent
              cycles, shared status and a record of how people show up.
            </p>
          </div>

          <dl className="mt-12 grid gap-4 border-t border-line pt-8 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                What it is
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink">
                A scheduled, peer-funded savings circle with visible rules and
                statuses.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                What it is not
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink">
                A bank, a deposit product or a guarantee of returns.
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Who it is for
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink">
                Existing groups who want a clearer way to run a familiar
                commitment.
              </dd>
            </div>
          </dl>
        </section>

        <section className="border-y border-line bg-surface-2">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                How we think about it
              </p>
              <h2 className="balance mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Four principles we build around.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {PRINCIPLES.map((principle, index) => (
                <div
                  key={principle.title}
                  className="flex gap-4 rounded-2xl border border-line bg-surface p-5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-sm font-semibold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-ink">
                      {principle.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {principle.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              How the money moves
            </p>
            <h2 className="balance mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              One clear path from contribution to payout.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              There is no separate ledger to reconcile and no hidden step
              between paying in and the pot releasing.
            </p>
            <div className="mt-6 rounded-2xl border border-risky-line bg-risky-soft p-4">
              <p className="text-sm font-semibold text-risky-ink">
                Sandbox notice
              </p>
              <p className="mt-1 text-sm leading-relaxed text-risky-ink/90">
                This demo processes payments in a sandbox. No real funds move,
                and no payout is guaranteed.
              </p>
            </div>
          </div>

          <ol className="flex flex-col gap-3">
            {MONEY_STEPS.map((step, index) => (
              <li
                key={step.title}
                className="flex gap-4 rounded-2xl border border-line bg-surface-2 p-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface font-mono text-sm font-semibold text-muted">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold tracking-tight text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-line bg-surface-2">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                The trust score
              </p>
              <h2 className="balance mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                A record of behaviour, not a promise about the future.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted">
                The score reflects what happened inside D&apos;arjo circles:
                on-time payments, recoveries after a late payment, late
                payments and misses. It is a product signal, not a regulated
                credit rating.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['On-time', 'Recovered', 'Late', 'Failed'].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-6">
              <h3 className="text-base font-semibold tracking-tight text-ink">
                What D&apos;arjo is not
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {NOT_LIST.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted">
                      <svg
                        className="h-3 w-3"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        aria-hidden="true"
                      >
                        <path d="M4 8h8" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-5 py-16 sm:px-8 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            Common questions
          </p>
          <h2 className="balance mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            The details people ask about first.
          </h2>

          <div className="mt-8 divide-y divide-line rounded-2xl border border-line bg-surface">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group p-5 sm:p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink">
                  {faq.question}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line text-muted transition-transform group-open:rotate-45">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M8 3v10M3 8h10" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface-2 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Still have a question?
              </h3>
              <p className="mt-1 text-sm text-muted">
                Send us a note and we will get back to you.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/contact" size="sm">
                Contact us
              </LinkButton>
              <LinkButton href="/signup" variant="outline" size="sm">
                Get started
              </LinkButton>
            </div>
          </div>

          <p className="mt-6 text-sm text-muted">
            Prefer the short version?{' '}
            <Link
              href="/#how-it-works"
              className="font-medium text-accent underline-offset-4 hover:underline"
            >
              See how a circle works
            </Link>
            .
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
