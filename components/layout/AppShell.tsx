"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getMe, logout } from "@/lib/api-client";
import type { User } from "@/types/api";
import TierBadge from "@/components/ui/TierBadge";

// Nav items shared by the header.
const nav = [
  { href: "/studio", label: "Studio" },
  { href: "/profile", label: "Profile" },
  { href: "/assistant", label: "Assistant" },
];

// Reading the pathname is URL data, so keep it behind Suspense for prerendering.
function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 text-sm">
      {nav.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 transition-colors ${
              active
                ? "bg-surface-2 font-medium text-ink"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
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
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-md flex-wrap items-center gap-3 px-5 py-3 sm:px-6 md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
          <Link href="/studio" className="text-lg font-semibold tracking-tight text-ink">
            D&apos;arjo
          </Link>

          <Suspense fallback={<div className="h-9" />}>
            <NavLinks />
          </Suspense>

          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-muted sm:inline">{user.name}</span>
                <TierBadge tier={user.tier} rank={user.rank} />
              </>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-line px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {error ? (
        <p role="alert" className="bg-risky-soft px-4 py-2 text-center text-sm text-risky-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}
