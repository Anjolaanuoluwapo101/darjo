// GET /api/notifications/stream -> Server-Sent Events.
// Loads a small backlog, then polls the database every 5s and heartbeats every 15s.
import { NextRequest } from 'next/server';
import { fail, requireUser, db } from '@/lib/server';
import { listNotifications, toAppNotification } from '@/lib/notifications';

export const maxDuration = 60;

const HEARTBEAT_MS = 15_000;
const POLL_MS = 5_000;

function frame(id: string, event: string, data: unknown) {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(req: NextRequest) {
  const me = await requireUser();
  if (!me) return fail('UNAUTHENTICATED', 'Please log in.', 401);

  const encoder = new TextEncoder();
  const sent = new Set<string>();
  let timer: ReturnType<typeof setInterval> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let closed = false;
  let busy = false;
  let lastCreatedAt = new Date();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          closed = true;
        }
      };

      const emit = (row: Parameters<typeof toAppNotification>[0]) => {
        if (sent.has(row.id)) return;
        sent.add(row.id);
        send(frame(row.id, 'notification', toAppNotification(row)));
      };

      const stop = () => {
        closed = true;
        if (timer) clearInterval(timer);
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // The consumer already closed the stream.
        }
      };

      req.signal.addEventListener('abort', stop);

      try {
        const lastEventId = req.headers.get('last-event-id');
        if (lastEventId) {
          const last = await db.notification.findFirst({
            where: { id: lastEventId, userId: me.id },
            select: { createdAt: true },
          });
          if (last) {
            lastCreatedAt = last.createdAt;
            sent.add(lastEventId);
          }
        }

        if (!lastEventId) {
          const page = await listNotifications(me.id, { limit: 20 });
          for (const item of [...page.items].reverse()) {
            sent.add(item.id);
            send(
              frame(item.id, 'notification', item),
            );
          }
          const newest = page.items[0];
          if (newest) lastCreatedAt = new Date(newest.createdAt);
        }

        const initialUnread = await db.notification.count({
          where: { userId: me.id, readAt: null },
        });
        send(frame('0', 'unread', { unreadCount: initialUnread }));

        const poll = async () => {
          if (closed || busy) return;
          busy = true;
          try {
            const rows = await db.notification.findMany({
              where: { userId: me.id, createdAt: { gte: lastCreatedAt } },
              orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
              take: 50,
            });
            for (const row of rows) {
              if (row.createdAt > lastCreatedAt) lastCreatedAt = row.createdAt;
              emit(row);
            }
            if (rows.length > 0) {
              const unreadCount = await db.notification.count({
                where: { userId: me.id, readAt: null },
              });
              send(frame('0', 'unread', { unreadCount }));
            }
          } catch (error) {
            console.error('Notification stream poll failed', error);
          } finally {
            busy = false;
          }
        };

        timer = setInterval(poll, POLL_MS);
        heartbeat = setInterval(() => send(': ping\n\n'), HEARTBEAT_MS);
      } catch (error) {
        console.error('Notification stream failed', error);
        stop();
      }
    },
    cancel() {
      closed = true;
      if (timer) clearInterval(timer);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
