export type HealthStepSource = "apple_health" | "health_connect" | "google_fit";

export type HealthStepsReading = {
  steps: number;
  source: HealthStepSource;
};

export type NativeHealthBridge = {
  isAvailable?: () => Promise<boolean>;
  requestPermission?: () => Promise<boolean>;
  readTodaySteps?: () => Promise<HealthStepsReading | number>;
};

declare global {
  interface Window {
    NutriCrewHealth?: NativeHealthBridge;
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
      Plugins?: Record<string, {
        checkAvailability?: () => Promise<{ available?: boolean }>;
        requestPermissions?: (opts: unknown) => Promise<unknown>;
        aggregateRecords?: (opts: unknown) => Promise<Record<string, number>>;
        queryHKitSampleType?: (opts: unknown) => Promise<{ resultData?: Array<{ value?: number }> }>;
        isAvailable?: () => Promise<{ available?: boolean }>;
      }>;
    };
  }
}

function localDayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return { start, end: new Date() };
}

async function readFromInjectedBridge(): Promise<HealthStepsReading | null> {
  const bridge = window.NutriCrewHealth;
  if (!bridge?.readTodaySteps) return null;
  try {
    if (bridge.isAvailable && !(await bridge.isAvailable())) return null;
    if (bridge.requestPermission) {
      const ok = await bridge.requestPermission();
      if (!ok) return null;
    }
    const raw = await bridge.readTodaySteps();
    if (typeof raw === "number") {
      const source: HealthStepSource =
        window.Capacitor?.getPlatform?.() === "ios" ? "apple_health" : "health_connect";
      return { steps: Math.max(0, Math.round(raw)), source };
    }
    if (raw && Number.isFinite(raw.steps)) {
      return { steps: Math.max(0, Math.round(raw.steps)), source: raw.source };
    }
  } catch {
    return null;
  }
  return null;
}

async function readFromCapacitorHealthConnect(): Promise<HealthStepsReading | null> {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "android") return null;
  const plugin = cap.Plugins?.HealthConnect;
  if (!plugin?.aggregateRecords) return null;
  try {
    const avail = await plugin.checkAvailability?.();
    if (avail && avail.available === false) return null;
    await plugin.requestPermissions?.({
      read: ["Steps"],
      write: [],
    });
    const { start, end } = localDayRange();
    const agg = await plugin.aggregateRecords({
      type: "Steps",
      start: start.toISOString(),
      end: end.toISOString(),
      metrics: ["COUNT_TOTAL"],
    });
    const steps = Number(agg.COUNT_TOTAL ?? agg.countTotal ?? 0);
    if (!Number.isFinite(steps)) return null;
    return { steps: Math.max(0, Math.round(steps)), source: "health_connect" };
  } catch {
    return null;
  }
}

async function readFromCapacitorHealthKit(): Promise<HealthStepsReading | null> {
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.() || cap.getPlatform?.() !== "ios") return null;
  const plugin =
    cap.Plugins?.CapacitorHealthkit ??
    cap.Plugins?.HealthKit ??
    cap.Plugins?.Health;
  if (!plugin?.queryHKitSampleType && !plugin?.isAvailable) return null;
  try {
    const avail = await plugin.isAvailable?.();
    if (avail && avail.available === false) return null;
    const { start, end } = localDayRange();
    if (plugin.queryHKitSampleType) {
      const res = await plugin.queryHKitSampleType({
        sampleName: "stepCount",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 0,
      });
      const total = (res.resultData ?? []).reduce(
        (sum, row) => sum + (Number(row.value) || 0),
        0,
      );
      return { steps: Math.max(0, Math.round(total)), source: "apple_health" };
    }
  } catch {
    return null;
  }
  return null;
}

export async function readNativeHealthSteps(): Promise<HealthStepsReading | null> {
  const readers = [
    readFromInjectedBridge,
    readFromCapacitorHealthConnect,
    readFromCapacitorHealthKit,
  ];
  for (const read of readers) {
    const result = await read();
    if (result && result.steps >= 0) return result;
  }
  return null;
}

export function detectHealthPlatform(): "ios" | "android" | "other" {
  const tg = (window.Telegram?.WebApp as { platform?: string } | undefined)?.platform?.toLowerCase();
  if (tg === "ios") return "ios";
  if (tg === "android") return "android";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

export function isNativeHealthLikelyAvailable() {
  if (window.NutriCrewHealth?.readTodaySteps) return true;
  const cap = window.Capacitor;
  if (!cap?.isNativePlatform?.()) return false;
  const p = cap.getPlatform?.();
  if (p === "android" && cap.Plugins?.HealthConnect) return true;
  if (p === "ios" && (cap.Plugins?.CapacitorHealthkit || cap.Plugins?.HealthKit)) return true;
  return false;
}
