/* D'arjo service worker: Web Push display and click handling. */
const DEFAULT_URL = '/notifications';
const ICON = '/icons/icon-192.png';
const BADGE = '/icons/icon-192.png';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {
      title: "D'arjo",
      body: event.data ? event.data.text() : 'You have a new update.',
    };
  }

  const title = payload.title || "D'arjo";
  const options = {
    body: payload.body || 'You have a new update.',
    icon: ICON,
    badge: BADGE,
    tag: payload.tag || payload.notificationId || 'darjo',
    renotify: false,
    data: {
      url: payload.url || DEFAULT_URL,
      notificationId: payload.notificationId,
      type: payload.type,
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || DEFAULT_URL;

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clientList) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            try {
              await client.navigate(target);
            } catch {
              // Some browsers refuse cross-origin navigation; focus is still useful.
            }
          }
          return;
        }
      }
      if (self.clients.openWindow) await self.clients.openWindow(target);
    })(),
  );
});
