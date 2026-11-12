'use client';

import { useEffect, useState } from 'react';
import ChatPanel from '@/components/agent/ChatPanel';
import CircleDetailsDrawer from '@/components/agent/CircleDetailsDrawer';
import { friendlyError } from '@/components/forms/errorMessages';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import LinkButton from '@/components/ui/LinkButton';
import Notice from '@/components/ui/Notice';
import Skeleton from '@/components/ui/Skeleton';
import { listCircles } from '@/lib/api-client';
import type { CircleSummary } from '@/types/api';

export default function AssistantPage() {
  const [circles, setCircles] = useState<CircleSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await listCircles({ mine: true });
      if (!active) return;

      if (!result.ok) {
        setError(friendlyError(result.error.code, result.error.message));
        setLoading(false);
        return;
      }

      setCircles(result.data.circles);
      setSelectedId((current) => current || result.data.circles[0]?.id || '');
      setLoading(false);
    }

    load();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  const selected = circles.find((circle) => circle.id === selectedId);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Assistant"
          title="Ask about your money circle"
          description="The assistant reads your circles, payments and payouts for you."
        />

        {loading ? (
          <div role="status" aria-live="polite">
            <span className="sr-only">Loading circles...</span>
            <Skeleton className="h-11 rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-start gap-4">
            <Notice
              variant="error"
              title="Could not load your circles"
              className="w-full"
            >
              {error}
            </Notice>
            <Button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              Try again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {circles.length === 0 ? (
              <EmptyState
                title="No circles yet"
                description="Join a circle in the Studio, then come back to ask about it."
                action={
                  <LinkButton href="/studio" variant="outline" size="sm">
                    Find one in the Studio
                  </LinkButton>
                }
              />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="assistant-circle"
                    className="text-sm font-semibold uppercase tracking-wide text-muted"
                  >
                    Circle
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailsOpen(true)}
                    disabled={!selected}
                  >
                    Circle details
                  </Button>
                </div>
                <select
                  id="assistant-circle"
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                >
                  {circles.map((circle) => (
                    <option key={circle.id} value={circle.id}>
                      {circle.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <ChatPanel
              circleId={selectedId || undefined}
              circleName={selected?.name}
            />

            <CircleDetailsDrawer
              circle={detailsOpen ? (selected ?? null) : null}
              onClose={() => setDetailsOpen(false)}
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
