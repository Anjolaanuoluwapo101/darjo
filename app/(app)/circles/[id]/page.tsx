"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import PlaceholderPage from "@/components/placeholder-page";

function CircleDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <PlaceholderPage
      title="Circle"
      note={`Circle ${id} — the detail screen is still being built.`}
    />
  );
}

export default function CircleDetailPage() {
  return (
    <Suspense fallback={<p className="px-4 py-10 text-sm text-muted">Loading circle…</p>}>
      <CircleDetail />
    </Suspense>
  );
}
