import { api } from "../api/client";

const queue: Array<{ name: string; props?: Record<string, unknown> }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, 1200);
}

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 20);
  try {
    await api.trackEvents(batch);
  } catch {
    /* non-blocking */
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  queue.push({ name, props });
  scheduleFlush();
}
