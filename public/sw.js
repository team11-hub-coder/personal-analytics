// Service worker for handling notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes("/reminders") && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open reminders page
      if (clients.openWindow) {
        return clients.openWindow("/reminders");
      }
    })
  );
});
