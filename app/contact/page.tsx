import type { Metadata } from 'next';
import Link from 'next/link';
import ContactForm from '@/components/marketing/ContactForm';
import SiteFooter from '@/components/marketing/SiteFooter';
import SiteHeader from '@/components/marketing/SiteHeader';
import Notice from '@/components/ui/Notice';

export const metadata: Metadata = {
  title: "Contact D'arjo",
  description:
    "Ask a question about circles, payments, payouts or account safety. Send a note to the D'arjo team.",
};

const BEFORE_SENDING = [
  'Include the circle name or invite code when your question is about a specific circle.',
  'For payment questions, share the cycle number and what you expected to happen.',
  'Never send your password, one-time codes or full card details.',
];

export default function ContactPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              Contact
            </p>
            <h1 className="balance mt-4 text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
              Tell us what is not working.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">
              Questions about a circle, a payment, a payout or your account all
              start here. The more context you include, the faster we can help.
            </p>
          </div>

          <div className="mt-12 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
              <div className="rounded-2xl border border-line bg-surface-2 p-5">
                <h2 className="text-base font-semibold tracking-tight text-ink">
                  Before you send
                </h2>
                <ul className="mt-4 flex flex-col gap-3">
                  {BEFORE_SENDING.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-muted">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted">
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 8.5 6.2 11.5 13 4.5" />
                        </svg>
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <Notice variant="warning" title="Account safety">
                D&apos;arjo will never ask for your password, a one-time code or
                your full card number. If someone does, stop and report it here.
              </Notice>

              <div className="text-sm leading-relaxed text-muted">
                Looking for the rules first?{' '}
                <Link
                  href="/about"
                  className="font-medium text-accent underline-offset-4 hover:underline"
                >
                  Read how circles and scores work
                </Link>
                .
              </div>
            </aside>

            <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
              <h2 className="text-xl font-semibold tracking-tight text-ink">
                Send a message
              </h2>
              <p className="mt-1 text-sm text-muted">
                Fields marked required help us reply to the right place.
              </p>
              <div className="mt-6">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
