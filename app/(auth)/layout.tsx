import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface-2 px-4 py-10">
      <Link href="/studio" className="mb-6 text-xl font-semibold tracking-tight text-ink">
        D&apos;arjo
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm">
        {children}
      </div>
    </main>
  );
}
