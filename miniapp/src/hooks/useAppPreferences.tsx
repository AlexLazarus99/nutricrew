import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  loadAppPreferences,
  patchAppPreferences,
  type AppPreferences,
  type FontSize,
} from "../lib/appPreferences";

type AppPreferencesContextValue = {
  prefs: AppPreferences;
  setFontSize: (fontSize: FontSize) => void;
  setHaptics: (haptics: boolean) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
  setGameMusic: (gameMusic: boolean) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppPreferences>(() => loadAppPreferences());

  const update = useCallback((patch: Partial<AppPreferences>) => {
    setPrefs(patchAppPreferences(patch));
  }, []);

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      prefs,
      setFontSize: (fontSize) => update({ fontSize }),
      setHaptics: (haptics) => update({ haptics }),
      setReduceMotion: (reduceMotion) => update({ reduceMotion }),
      setGameMusic: (gameMusic) => update({ gameMusic }),
    }),
    [prefs, update],
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences(): AppPreferencesContextValue {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }
  return ctx;
}
