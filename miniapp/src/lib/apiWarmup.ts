import { getApiBase } from "./apiBase.js";

const PING_TIMEOUT_MS = 12_000;
const WAKE_MAX_WAIT_MS = 50_000;
const WAKE_POLL_MS = 1200;

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

/** Poll until Node process is up and DB migrations finished. */
export async function waitForServerReady(): Promise<void> {
  const deadline = Date.now() + WAKE_MAX_WAIT_MS;
  wakeApi();

  while (Date.now() < deadline) {
    const body = await fetchPing();
    if (body?.ok && body.ready !== false) {
      return;
    }
    await sleep(WAKE_POLL_MS);
    wakeApi();
  }
}
