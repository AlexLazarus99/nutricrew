import type { HealthStepSource } from "./nativeHealth";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const FIT_SCOPE = "https://www.googleapis.com/auth/fitness.activity.read";
const STORAGE_KEY = "nutricrew_google_fit_connected";

type GisTokenResponse = { access_token?: string; error?: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (res: GisTokenResponse) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

function getClientId() {
  return import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID?.trim() ?? "";
}

function localDayMillis() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return { startMs: start.getTime(), endMs: Date.now() };
}

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-gis="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("GIS_LOAD_FAILED")), { once: true });
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.dataset.gis = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("GIS_LOAD_FAILED"));
    document.head.appendChild(s);
  });
}

function requestAccessToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error("GIS_NOT_READY"));
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: FIT_SCOPE,
      callback: (res) => {
        if (res.access_token) resolve(res.access_token);
        else reject(new Error(res.error ?? "GOOGLE_AUTH_FAILED"));
      },
    });
    client.requestAccessToken();
  });
}

async function fetchGoogleFitSteps(token: string): Promise<number> {
  const { startMs, endMs } = localDayMillis();
  const res = await fetch("https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      aggregateBy: [{ dataTypeName: "com.google.step_count.delta" }],
      bucketByTime: { durationMillis: 86400000 },
      startTimeMillis: startMs,
      endTimeMillis: endMs,
    }),
  });
  if (!res.ok) throw new Error("GOOGLE_FIT_FETCH_FAILED");
  const data = (await res.json()) as {
    bucket?: Array<{
      dataset?: Array<{
        point?: Array<{ value?: Array<{ intVal?: number }> }>;
      }>;
    }>;
  };
  let total = 0;
  for (const bucket of data.bucket ?? []) {
    for (const dataset of bucket.dataset ?? []) {
      for (const point of dataset.point ?? []) {
        for (const v of point.value ?? []) {
          total += v.intVal ?? 0;
        }
      }
    }
  }
  return Math.max(0, Math.round(total));
}

export function isGoogleFitConfigured() {
  return Boolean(getClientId());
}

export function isGoogleFitConnected() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setGoogleFitConnected(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* private mode */
  }
}

export async function readGoogleFitSteps(): Promise<{ steps: number; source: HealthStepSource } | null> {
  const clientId = getClientId();
  if (!clientId) return null;
  await loadGis();
  const token = await requestAccessToken(clientId);
  const steps = await fetchGoogleFitSteps(token);
  setGoogleFitConnected(true);
  return { steps, source: "google_fit" };
}
