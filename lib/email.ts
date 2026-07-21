// Absence notification service
// Logs absence events and sends in-app notifications

interface AbsenceNotificationParams {
  userEmail: string;
  sessionTitle: string;
  durationMinutes: number;
  timestamp: string;
}

export async function sendAbsenceNotification({
  userEmail,
  sessionTitle,
  durationMinutes,
  timestamp,
}: AbsenceNotificationParams): Promise<boolean> {
  // Log to console for debugging
  console.warn(
    `[ABSENCE ALERT] User "${userEmail}" away from "${sessionTitle}" for ${durationMinutes} minutes at ${timestamp}`
  );

  // Send browser notification if permission granted
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Focus Alert", {
      body: `You've been away from "${sessionTitle}" for ${durationMinutes} minutes.`,
      icon: "/favicon.ico",
      tag: "absence-alert",
    });
  }

  return true;
}

export function isNotificationConfigured(): boolean {
  return true;
}
