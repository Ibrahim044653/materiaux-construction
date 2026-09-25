/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare const self: ServiceWorkerGlobalScope;

// Precache static assets (manifest injected by vite-plugin-pwa)
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// API runtime caching
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/dashboard'),
  new NetworkFirst({
    cacheName: 'api-dashboard',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 300 })],
  })
);
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/products'),
  new StaleWhileRevalidate({
    cacheName: 'api-products',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 3600 })],
  })
);

// ── Push Notifications ────────────────────────────────────────────────────────
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let data: { title?: string; body?: string; url?: string; tag?: string } = {};
  try {
    data = event.data.json() as typeof data;
  } catch {
    data = { title: 'MatériauxPro', body: event.data.text() };
  }

  const title = data.title ?? 'MatériauxPro';
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag ?? 'materiaux-notification',
    data: { url: data.url ?? '/' },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url: string = (event.notification.data as { url?: string })?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(url) && 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
