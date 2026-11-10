"use client";

// Helpers for the sign-in and sign-up screens.
//
// After a successful login the session cookie is set by the API call, so the
// browser has to reload a protected page. The Next.js client router can stay
// on the login screen when that happens, so we always fall back to a full
// page load if the soft navigation does not happen.

import { useRouter } from "next/navigation";

type Router = ReturnType<typeof useRouter>;

const FALLBACK = "/studio";

// Reads the ?next= target the proxy adds when it sends a visitor to /login.
export function nextPath(fallback = FALLBACK): string {
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

function isCurrent(path: string) {
  if (typeof window === "undefined") return false;
  return window.location.pathname + window.location.search === path;
}

// Navigates to path after a successful authentication.
export function redirectAfterAuth(router: Router, path: string) {
  router.replace(path);
  router.refresh();
  window.setTimeout(() => {
    if (!isCurrent(path)) window.location.assign(path);
  }, 1000);
}
