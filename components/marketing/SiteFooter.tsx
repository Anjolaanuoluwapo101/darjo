import Link from 'next/link';
import Logo from '@/components/brand/Logo';

const PRODUCT_LINKS = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/about', label: 'About D\'arjo' },
  { href: '/contact', label: 'Contact' },
];

const ACCOUNT_LINKS = [
  { href: '/login', label: 'Sign in' },
  { href: '/signup', label: 'Create an account' },
  { href: '/studio', label: 'Studio' },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Logo href="/" size="md" />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              A rotating savings circle for trusted groups. Clear cycles,
              visible pots, and a trust score that follows your on-time
              payments.
            </p>
            <p className="mt-4 text-xs leading-relaxed text-muted-soft">
              D&apos;arjo is a demo experience. It is not a bank, does not accept
              deposits, and does not promise investment returns. Contributions
              are processed in a sandbox.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Product
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Account
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-muted-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© D&apos;arjo. All rights reserved.</p>
          <p>Only join circles with people you trust.</p>
        </div>
      </div>
    </footer>
  );
}
