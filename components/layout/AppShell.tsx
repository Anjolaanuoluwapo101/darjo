"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getMe, logout } from "@/lib/api-client";
import type { User } from "@/types/api";
import TierBadge from "@/components/ui/TierBadge";
import NotificationBell from "@/components/notifications/NotificationBell";

const nav = [
  { href: "/studio", label: "Studio" },
  { href: "/payouts", label: "Payouts" },
  { href: "/profile", label: "Profile" },
  { href: "/assistant", label: "Assistant" },
];

function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-1 border-b-2 border-transparent px-3 py-2 transition-colors ${
              active
                ? "border-white text-white"
                : "text-blue-100 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileNavLinks({ user, onClose }: { user: User | null; onClose: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 pt-2 pb-3">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onClose}
            className={`flex min-h-11 items-center gap-2 border-r-2 border-transparent px-4 py-3 text-sm transition-colors ${
              active
                ? "border-[#003087] bg-gray-50 font-medium text-[#003087]"
                : "text-gray-700 hover:bg-gray-50 hover:text-[#001c64]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="mt-2 flex items-center gap-3 border-t border-gray-200 px-4 pt-2">
        {user ? (
          <>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#001c64]">{user.name}</span>
              <TierBadge tier={user.tier} rank={user.rank} />
            </div>
          </>
        ) : null}
      </div>
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

  async function handleLogout() {
    await logout();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-[#003087] bg-[#001c64]">
        <div className="mx-auto flex w-full max-w-md flex-wrap items-center justify-between px-4 py-1.5 sm:px-6 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl md:py-2">
          <Link href="/studio" className="shrink-0 text-base font-semibold tracking-tight text-white">
            D&apos;arjo
          </Link>

          {/* Desktop nav links */}
          <Suspense fallback={<div className="h-8" />}>
            <NavLinks />
          </Suspense>

          <div className="ml-auto flex items-center gap-2">
            {/* Desktop-only: bell + user + logout */}
            <div className="hidden md:flex items-center gap-2">
              <NotificationBell />
              {user ? (
                <>
                  <span className="text-sm text-blue-100">{user.name}</span>
                  <TierBadge tier={user.tier} rank={user.rank} />
                </>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-11 rounded-lg border border-white/20 px-3 text-xs text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#001c64]"
              >
                Log out
              </button>
            </div>

            {/* Mobile-only: hamburger */}
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-label="Menu"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:hidden"
            >
              <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
              {menuOpen ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-xs bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 translate-x-0">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
                <span className="text-base font-semibold tracking-tight text-[#001c64]">D&apos;arjo</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0]"
                >
                  <span className="sr-only">Close menu</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <MobileNavLinks user={user} onClose={() => setMenuOpen(false)} />
              {user ? (
                <div className="border-t border-gray-200 mt-3 pt-3 px-4">
                  <button
                    type="button"
                    onClick={handleLogout}
                    onClickCapture={() => setMenuOpen(false)}
                    className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#001c64] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070e0]"
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {error ? (
        <p role="alert" className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-[#7a5200]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
