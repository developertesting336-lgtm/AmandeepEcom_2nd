// Service Worker for Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for incoming push notifications from backend
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {
    title: "New Notification",
    message: "You have a new update!",
    icon: "/logo.png",
    badge: "/logo.png",
    url: "/",
  };

  try {
    const data = event.data.json();
    payload = {
      title: data.title || payload.title,
      message: data.message || data.body || payload.message,
      icon: data.icon || payload.icon,
      badge: data.badge || payload.badge,
      url: data.url || data.link || payload.url,
      ...data,
    };
  } catch (err) {
    // If payload is plain text string
    payload.message = event.data.text();
  }

  const notificationOptions = {
    body: payload.message,
    icon: payload.icon,
    badge: payload.badge,
    data: {
      url: payload.url,
    },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, notificationOptions)
  );
});

// Handle clicking on a notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this app
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          if (client.url !== targetUrl && "navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});