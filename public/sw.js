// Admin dashboard service worker — exists solely to receive Web Push
// notifications for new orders and show them even when no tab has the
// dashboard open. Not a full offline/caching service worker on purpose;
// adding one later should extend this file rather than replace it.

self.addEventListener('push', (event) => {
  let payload = { title: 'DWOM Admin', body: 'You have a new notification.', data: {} };
  try {
    if (event.data) payload = event.data.json();
  } catch (err) {
    // Malformed payload shouldn't crash the worker — fall back to a generic notice.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/favicon.png',
      badge: '/favicon.png',
      data: payload.data || {},
      tag: payload.data?.orderId ? `order-${payload.data.orderId}` : undefined,
    })
  );
});

// Clicking the notification focuses an already-open dashboard tab if one
// exists, navigating it to the order; otherwise opens a new one.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
