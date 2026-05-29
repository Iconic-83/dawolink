// Custom service worker code injected by @ducanh2912/next-pwa.
// Handles Web Push events for customer order notifications.

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: Record<string, unknown>;
    requireInteraction?: boolean;
  };

  try {
    payload = event.data.json();
  } catch {
    payload = { title: "DawoLink", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body:                payload.body,
      icon:                payload.icon  ?? "/icon-512.png",
      badge:               payload.badge ?? "/logo.png",
      tag:                 payload.tag,
      data:                payload.data ?? {},
      requireInteraction:  payload.requireInteraction ?? false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url: string = (event.notification.data as any)?.url ?? "/shop/orders";

  event.waitUntil(
    (self.clients as any)
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList: WindowClient[]) => {
        // Focus existing tab if already open
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        // Open new tab
        if ((self.clients as any).openWindow) {
          return (self.clients as any).openWindow(url);
        }
      }),
  );
});
