import { getApiBase } from "./apiBase.js";

/** Render free tier cold start can take 30–90s before the first byte. */
const PING_TIMEOUT_MS = 25_000;
const WAKE_MAX_WAIT_MS = 75_000;
const WAKE_POLL_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchPing(): Promise<{ ok: boolean; ready?: boolean } | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
  try {
    const res = await fetch(`${getApiBase()}/ping`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as { ok: boolean; ready?: boolean };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/** Fire-and-forget: wakes Render while Telegram init runs. */
export function wakeApi(): void {
  void fetchPing();
}

/** Poll until Node process is up and DB migrations finished (best effort). */
export async function waitForServerReady(): Promise<boolean> {
  const deadline = Date.now() + WAKE_MAX_WAIT_MS;
  wakeApi();

  while (Date.now() < deadline) {
    const body = await fetchPing();
    if (body?.ok && body.ready !== false) {
      return true;
    }
    await sleep(WAKE_POLL_MS);
    wakeApi();
  }
  return false;
}
