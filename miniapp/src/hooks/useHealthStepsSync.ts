import { useCallback, useEffect, useRef, useState } from "react";
import { healthSyncSupported, syncStepsFromHealthApps } from "../lib/health/syncHealthSteps";

const AUTO_SYNC_MS = 5 * 60 * 1000;
const STORAGE_AUTO = "nutricrew_health_auto_sync";

export function isHealthAutoSyncEnabled() {
  try {
    return localStorage.getItem(STORAGE_AUTO) !== "0";
  } catch {
    return true;
  }
}

export function setHealthAutoSyncEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_AUTO, on ? "1" : "0");
  } catch {
    /* private mode */
  }
}

export function useHealthStepsSync(enabled: boolean, onSynced?: (xpGranted?: number) => void) {
  const [syncing, setSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const busyRef = useRef(false);

  const sync = useCallback(async () => {
    if (!enabled || busyRef.current) return null;
    busyRef.current = true;
    setSyncing(true);
    setLastError(null);
    try {
      const result = await syncStepsFromHealthApps();
      if (result.ok) {
        setLastSyncAt(Date.now());
        if (result.xpGrantedNow && result.xpGrantedNow > 0) {
          onSynced?.(result.xpGrantedNow);
        }
        return result;
      }
      if (
        result.error &&
        result.error !== "APPLE_HEALTH_UNAVAILABLE" &&
        result.error !== "HEALTH_SYNC_UNAVAILABLE"
      ) {
        setLastError(result.error);
      }
      return result;
    } catch (e) {
      setLastError((e as Error).message);
      return null;
    } finally {
      busyRef.current = false;
      setSyncing(false);
    }
  }, [enabled, onSynced]);

  useEffect(() => {
    if (!enabled || !healthSyncSupported() || !isHealthAutoSyncEnabled()) return;
    void sync();
    const id = window.setInterval(() => void sync(), AUTO_SYNC_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, sync]);

  return { sync, syncing, lastError, lastSyncAt };
}
