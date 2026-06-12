import { loadMusicMuted, saveMusicMuted } from "./birdGame/birdGameAudio";

export type FontSize = "sm" | "md" | "lg";

export type AppPreferences = {
  fontSize: FontSize;
  haptics: boolean;
  reduceMotion: boolean;
  gameMusic: boolean;
};

const STORAGE_KEY = "nutricrew_app_prefs";

const DEFAULTS: AppPreferences = {
  fontSize: "md",
  haptics: true,
  reduceMotion: false,
  gameMusic: !loadMusicMuted(),
};

function readRaw(): Partial<AppPreferences> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<AppPreferences>;
  } catch {
    return {};
  }
}

export function loadAppPreferences(): AppPreferences {
  const raw = readRaw();
  return {
    fontSize: raw.fontSize === "sm" || raw.fontSize === "lg" ? raw.fontSize : DEFAULTS.fontSize,
    haptics: typeof raw.haptics === "boolean" ? raw.haptics : DEFAULTS.haptics,
    reduceMotion: typeof raw.reduceMotion === "boolean" ? raw.reduceMotion : DEFAULTS.reduceMotion,
    gameMusic: typeof raw.gameMusic === "boolean" ? raw.gameMusic : DEFAULTS.gameMusic,
  };
}

export function saveAppPreferences(prefs: AppPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode */
  }
  saveMusicMuted(!prefs.gameMusic);
}

export function patchAppPreferences(patch: Partial<AppPreferences>): AppPreferences {
  const next = { ...loadAppPreferences(), ...patch };
  saveAppPreferences(next);
  return next;
}

export function isHapticsEnabled(): boolean {
  return loadAppPreferences().haptics;
}
