import { useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "nutricrew_step_tracking";

export function isStepTrackingEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setStepTrackingEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    /* private mode */
  }
}

/** Rough step estimate from device motion while the mini app is open. */
export function useMotionSteps(enabled: boolean, onSteps: (delta: number) => void) {
  const lastStepAt = useRef(0);
  const smoothMag = useRef(10);
  const pending = useRef(0);

  const flush = useCallback(() => {
    if (pending.current <= 0) return;
    const delta = pending.current;
    pending.current = 0;
    onSteps(delta);
  }, [onSteps]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      const x = acc?.x;
      const y = acc?.y;
      const z = acc?.z;
      if (x == null || y == null || z == null) return;
      const mag = Math.sqrt(x * x + y * y + z * z);
      smoothMag.current = smoothMag.current * 0.85 + mag * 0.15;
      const now = Date.now();
      if (mag > 11.2 && smoothMag.current > 10.5 && now - lastStepAt.current > 380) {
        lastStepAt.current = now;
        pending.current += 1;
      }
    };

    window.addEventListener("devicemotion", handler, { passive: true });
    const interval = window.setInterval(flush, 12000);
    return () => {
      window.removeEventListener("devicemotion", handler);
      window.clearInterval(interval);
      flush();
    };
  }, [enabled, flush]);

  useEffect(() => {
    if (!enabled) return;
    const onHide = () => flush();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, [enabled, flush]);
}
