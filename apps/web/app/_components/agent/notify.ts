"use client";

// Small, dependency-free notification helpers for the widget: a soft chime
// (synthesized with the Web Audio API, so there's no audio file to ship) and
// browser notifications (permission is requested lazily, on first open). All
// wrapped in try/catch so an unsupported browser or a blocked API never throws
// into the chat flow.

/**
 * Play the pop sound when a message is sent or received. A fresh Audio each call
 * so a quick send→reply pair can overlap without cutting itself off. Resolves
 * `true` if it actually played, `false` if the browser blocked it (autoplay
 * policy, before the visitor has interacted with the page).
 */
export function playChime(): Promise<boolean> {
  try {
    const audio = new Audio("/pop-sound.wav");
    audio.volume = 0.5;
    return audio.play().then(
      () => true,
      () => false,
    );
  } catch {
    return Promise.resolve(false);
  }
}

/** Ask for notification permission once (call it on a user gesture, e.g. open). */
export async function ensureNotifyPermission() {
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "default") await Notification.requestPermission();
  } catch {
    // ignore
  }
}

/** Show a browser notification, if the user has granted permission. */
export function sendBrowserNotification(title: string, body: string) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const notification = new Notification(title, { body: body.slice(0, 160) });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // ignore
  }
}
