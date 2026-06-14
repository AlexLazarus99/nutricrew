import type { NativeHealthBridge } from "./nativeHealth";

/** Dev-only mock for testing /me/steps/sync-health without a native shell. */
export function installDevHealthBridge() {
  if (!import.meta.env.DEV) return;
  if (window.NutriCrewHealth?.readTodaySteps) return;

  const mockSteps = Number(import.meta.env.VITE_MOCK_HEALTH_STEPS ?? "8432");
  const mockSource =
    (import.meta.env.VITE_MOCK_HEALTH_SOURCE as "apple_health" | "health_connect") ??
    "apple_health";

  const bridge: NativeHealthBridge = {
    isAvailable: () => Promise.resolve(true),
    requestPermission: () => Promise.resolve(true),
    readTodaySteps: () =>
      Promise.resolve({
        steps: Math.max(0, Math.round(mockSteps)),
        source: mockSource,
      }),
  };

  window.NutriCrewHealth = bridge;
  console.info("[NutriCrew] Dev health bridge installed", { steps: mockSteps, source: mockSource });
}
