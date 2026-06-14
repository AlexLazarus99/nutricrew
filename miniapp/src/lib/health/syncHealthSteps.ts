import { api } from "../../api/client";
import { detectHealthPlatform, isNativeHealthLikelyAvailable, readNativeHealthSteps } from "./nativeHealth";
import { isGoogleFitConfigured, readGoogleFitSteps } from "./googleFit";

export type HealthSyncOutcome = {
  ok: boolean;
  steps?: number;
  source?: string;
  xpGrantedNow?: number;
  error?: string;
  method?: "native" | "google_fit";
};

export async function syncStepsFromHealthApps(): Promise<HealthSyncOutcome> {
  if (isNativeHealthLikelyAvailable()) {
    const native = await readNativeHealthSteps();
    if (native) {
      const res = await api.syncHealthSteps(native.steps, native.source);
      return {
        ok: true,
        steps: res.steps,
        source: res.healthSource ?? native.source,
        xpGrantedNow: res.stepsXpGrantedNow,
        method: "native",
      };
    }
  }

  const platform = detectHealthPlatform();
  if (platform === "android" && isGoogleFitConfigured()) {
    try {
      const fit = await readGoogleFitSteps();
      if (fit) {
        const res = await api.syncHealthSteps(fit.steps, fit.source);
        return {
          ok: true,
          steps: res.steps,
          source: res.healthSource ?? fit.source,
          xpGrantedNow: res.stepsXpGrantedNow,
          method: "google_fit",
        };
      }
    } catch (e) {
      return { ok: false, error: (e as Error).message, method: "google_fit" };
    }
  }

  if (platform === "ios") {
    if (window.NutriCrewHealth?.readTodaySteps) {
      const native = await readNativeHealthSteps();
      if (native) {
        const res = await api.syncHealthSteps(native.steps, native.source);
        return {
          ok: true,
          steps: res.steps,
          source: res.healthSource ?? native.source,
          xpGrantedNow: res.stepsXpGrantedNow,
          method: "native",
        };
      }
      return { ok: false, error: "HEALTH_PERMISSION_DENIED" };
    }
    const native = await readNativeHealthSteps();
    if (native) {
      const res = await api.syncHealthSteps(native.steps, native.source);
      return {
        ok: true,
        steps: res.steps,
        source: res.healthSource ?? native.source,
        xpGrantedNow: res.stepsXpGrantedNow,
        method: "native",
      };
    }
    if (isGoogleFitConfigured()) {
      try {
        const fit = await readGoogleFitSteps();
        if (fit) {
          const res = await api.syncHealthSteps(fit.steps, fit.source);
          return {
            ok: true,
            steps: res.steps,
            source: res.healthSource ?? fit.source,
            xpGrantedNow: res.stepsXpGrantedNow,
            method: "google_fit",
          };
        }
      } catch (e) {
        return { ok: false, error: (e as Error).message, method: "google_fit" };
      }
    }
    return { ok: false, error: "APPLE_HEALTH_UNAVAILABLE" };
  }

  if (isGoogleFitConfigured()) {
    try {
      const fit = await readGoogleFitSteps();
      if (fit) {
        const res = await api.syncHealthSteps(fit.steps, fit.source);
        return {
          ok: true,
          steps: res.steps,
          source: res.healthSource ?? fit.source,
          xpGrantedNow: res.stepsXpGrantedNow,
          method: "google_fit",
        };
      }
    } catch (e) {
      return { ok: false, error: (e as Error).message, method: "google_fit" };
    }
  }

  return { ok: false, error: "HEALTH_SYNC_UNAVAILABLE" };
}

export function healthSyncSupported() {
  return isNativeHealthLikelyAvailable() || isGoogleFitConfigured() || detectHealthPlatform() !== "other";
}
