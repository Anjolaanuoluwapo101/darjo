'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getNotifications, markNotificationsRead } from '@/lib/api-client';
import {
  disablePush,
  enablePush,
  getPushState,
  registerServiceWorker,
  type PushState,
} from '@/lib/push-client';
import type { AppNotification } from '@/types/api';

type NotificationContextValue = {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pushState: PushState;
  pushBusy: boolean;
  markRead: (ids: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  reload: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

function sortNewestFirst(items: AppNotification[]) {
  return [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pushState, setPushState] = useState<PushState>('default');
  const [pushBusy, setPushBusy] = useState(false);

  const reload = useCallback(async () => {
    const result = await getNotifications({ limit: 20 });
    if (!result.ok) {
      setError(result.error.message);
      setLoading(false);
      return;
    }
    setItems(sortNewestFirst(result.data.items));
    setUnreadCount(result.data.unreadCount);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function boot() {
      await registerServiceWorker();
      if (!active) return;
      setPushState(await getPushState());
      await reload();
    }

    boot();
    return () => {
      active = false;
    };
  }, [reload]);

  useEffect(() => {
    if (USE_MOCKS || typeof window === 'undefined' || !('EventSource' in window)) return;
    const source = new EventSource('/api/notifications/stream');

    source.addEventListener('notification', (event) => {
      try {
        const next = JSON.parse((event as MessageEvent<string>).data) as AppNotification;
        setItems((current) => {
          if (current.some((item) => item.id === next.id)) return current;
          return sortNewestFirst([next, ...current]).slice(0, 50);
        });
        if (!next.readAt) setUnreadCount((count) => count + 1);
      } catch {
        // Ignore malformed frames; the next poll will reconcile.
      }
    });

    source.addEventListener('unread', (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent<string>).data) as {
          unreadCount?: number;
        };
        if (typeof payload.unreadCount === 'number') setUnreadCount(payload.unreadCount);
      } catch {
        // Ignore malformed frames.
      }
    });

    return () => source.close();
  }, []);

  const markRead = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const now = new Date().toISOString();
    setItems((current) =>
      current.map((item) => (ids.includes(item.id) && !item.readAt ? { ...item, readAt: now } : item)),
    );
    setUnreadCount((count) => Math.max(count - ids.length, 0));
    const result = await markNotificationsRead({ ids });
    if (!result.ok) setError(result.error.message);
  }, []);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((current) =>
      current.map((item) => (item.readAt ? item : { ...item, readAt: now })),
    );
    setUnreadCount(0);
    const result = await markNotificationsRead({ all: true });
    if (!result.ok) setError(result.error.message);
  }, []);

  const enableNotifications = useCallback(async () => {
    setPushBusy(true);
    const next = await enablePush();
    setPushState(next);
    setPushBusy(false);
  }, []);

  const disableNotifications = useCallback(async () => {
    setPushBusy(true);
    const next = await disablePush();
    setPushState(next);
    setPushBusy(false);
  }, []);

  const value = useMemo(
    () => ({
      items,
      unreadCount,
      loading,
      error,
      pushState,
      pushBusy,
      markRead,
      markAllRead,
      enableNotifications,
      disableNotifications,
      reload,
    }),
    [
      items,
      unreadCount,
      loading,
      error,
      pushState,
      pushBusy,
      markRead,
      markAllRead,
      enableNotifications,
      disableNotifications,
      reload,
    ],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used inside NotificationProvider');
  return context;
}
