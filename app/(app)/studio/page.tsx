import Link from "next/link";
import PlaceholderPage from "@/components/placeholder-page";

export default function StudioPage() {
  return (
    <div>
      <PlaceholderPage
        title="Studio"
        note="The circle browser is still being built. The app shell, auth and data layer are in place."
      />
      <div className="mx-auto flex w-full max-w-3xl flex-wrap gap-3 px-4 pb-10">
        <Link
          href="/circles/new"
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Create a circle
        </Link>
        <Link
          href="/join"
          className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
        >
          Join a circle
        </Link>
      </div>
    </div>
  );
}
