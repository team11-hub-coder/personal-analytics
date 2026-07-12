// Alert sound generator using Web Audio API
const audioCtx = typeof window !== "undefined" ? new AudioContext() : null;

export function playAlertSound(type: "warning" | "danger" | "critical") {
  if (!audioCtx) return;

  // Resume if suspended (browser autoplay policy)
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === "warning") {
    // Gentle chime — two short beeps
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(600, audioCtx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
  } else if (type === "danger") {
    // Louder alarm — urgent triple beep
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.6);
  } else {
    // Critical — aggressive rapid-fire alarm, max volume
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(900, audioCtx.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(900, audioCtx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.2);
    oscillator.frequency.setValueAtTime(900, audioCtx.currentTime + 0.25);
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.3);
    oscillator.frequency.setValueAtTime(900, audioCtx.currentTime + 0.35);
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.4);
    gainNode.gain.setValueAtTime(0.7, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.6);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function sendNotification(title: string, body: string, tag?: string) {
  if (Notification.permission !== "granted") return;

  new Notification(title, {
    body,
    tag,
    icon: "/favicon.ico",
  });
}
