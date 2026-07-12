/**
 * Browser push notification utilities.
 * Client-side only — no server push, uses periodic checking.
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (Notification.permission !== "granted") return;

  const notification = new Notification(title, {
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: title, // prevents duplicate notifications with same title
    requireInteraction: false,
    ...options,
  });

  // Auto-close after 10 seconds
  setTimeout(() => notification.close(), 10000);
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch {
    return null;
  }
}
