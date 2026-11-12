"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getMe, logout } from "@/lib/api-client";
import type { User } from "@/types/api";
import TierBadge from "@/components/ui/TierBadge";
import ThemeToggle from "@/components/ui/ThemeToggle";
import NotificationBell from "@/components/notifications/NotificationBell";

type IconName = "studio" | "payouts" | "profile" | "assistant";

const nav: { href: string; label: string; icon: IconName }[] = [
  { href: "/studio", label: "Studio", icon: "studio" },
  { href: "/payouts", label: "Payouts", icon: "payouts" },
  { href: "/profile", label: "Profile", icon: "profile" },
  { href: "/assistant", label: "Assistant", icon: "assistant" },
];

function NavIcon({ name }: { name: IconName }) {
  const common = {
    className: "h-[18px] w-[18px]",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  if (name === "studio") {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (name === "payouts") {
    return (
      <svg {...common}>
        <rect x="2.5" y="6" width="19" height="13" rx="2.5" />
        <path d="M2.5 10h19" />
        <path d="M16 15h2" />
      </svg>
    );
  }
  if (name === "profile") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 3l1.9 4.6L19 9.5l-4.1 3.1L16 18l-4-2.7L8 18l1.1-5.4L5 9.5l5.1-1.9L12 3Z" />
    </svg>
  );
}

function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {nav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavLinks({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onClose}
            className={`flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-medium transition-colors ${
              active
                ? "bg-primary-soft text-primary"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <NavIcon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getMe().then((result) => {
      if (!active) return;
      if (result.ok) {
        setUser(result.data.user);
        return;
      }
      if (result.error.code === "UNAUTHENTICATED") {
        router.replace("/login");
        return;
      }
      setError(result.error.message);
    });
    return () => {
      active = false;
    };
  }, [router]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    try {
      await logout();
    } catch {
      // Ignore logout errors — still send the user to the login screen.
    }
    // The session cookie changes, so a soft router.replace() can leave the UI
    // stuck (the client router cache keeps the current shell). A full page load
    // guarantees the proxy runs with the cleared cookie and the login page renders.
    window.location.assign("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-2.5 sm:px-6 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
          <Link
            href="/studio"
            className="flex shrink-0 items-center gap-2 text-base font-semibold tracking-tight text-ink"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-surface">
              D
            </span>
            <span>D&apos;arjo</span>
          </Link>

          <Suspense fallback={<div className="h-8" />}>
            <NavLinks />
          </Suspense>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle />
            <NotificationBell />

            <div className="hidden items-center gap-2 md:flex">
              {user ? (
                <div className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-3 pr-1">
                  <span className="max-w-32 truncate text-sm font-medium text-ink">
                    {user.name}
                  </span>
                  <TierBadge tier={user.tier} rank={user.rank} />
                </div>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                Log out
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-label="Menu"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink md:hidden"
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              {menuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-[384px] flex-col border-l border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <span className="flex items-center gap-2 text-base font-semibold tracking-tight text-ink">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-sm font-bold text-surface">
                  D
                </span>
                D&apos;arjo
              </span>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <MobileNavLinks user={user} onClose={() => setMenuOpen(false)} />
            </div>

            {user ? (
              <div className="border-t border-line p-4">
                <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.email}</p>
                  </div>
                  <TierBadge tier={user.tier} rank={user.rank} />
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-strong px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <main className="flex-1">{children}</main>

      {error ? (
        <p role="alert" className="border-t border-error-line bg-error-soft px-4 py-2 text-center text-sm text-error-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
