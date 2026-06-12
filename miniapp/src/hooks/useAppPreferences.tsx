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
  fontSizePreview: FontSize | null;
  effectiveFontSize: FontSize;
  fontSizeDirty: boolean;
  setFontSizePreview: (fontSize: FontSize) => void;
  confirmFontSize: () => void;
  cancelFontSizePreview: () => void;
  setFontSize: (fontSize: FontSize) => void;
  setHaptics: (haptics: boolean) => void;
  setReduceMotion: (reduceMotion: boolean) => void;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<AppPreferences>(() => loadAppPreferences());
  const [fontSizePreview, setFontSizePreviewState] = useState<FontSize | null>(null);

  const update = useCallback((patch: Partial<AppPreferences>) => {
    setPrefs(patchAppPreferences(patch));
  }, []);

  const setFontSizePreview = useCallback((fontSize: FontSize) => {
    setFontSizePreviewState(fontSize);
  }, []);

  const cancelFontSizePreview = useCallback(() => {
    setFontSizePreviewState(null);
  }, []);

  const confirmFontSize = useCallback(() => {
    if (fontSizePreview !== null && fontSizePreview !== prefs.fontSize) {
      update({ fontSize: fontSizePreview });
    }
    setFontSizePreviewState(null);
  }, [fontSizePreview, prefs.fontSize, update]);

  const effectiveFontSize = fontSizePreview ?? prefs.fontSize;
  const fontSizeDirty = fontSizePreview !== null && fontSizePreview !== prefs.fontSize;

  const value = useMemo<AppPreferencesContextValue>(
    () => ({
      prefs,
      fontSizePreview,
      effectiveFontSize,
      fontSizeDirty,
      setFontSizePreview,
      confirmFontSize,
      cancelFontSizePreview,
      setFontSize: (fontSize) => {
        setFontSizePreviewState(null);
        update({ fontSize });
      },
      setHaptics: (haptics) => update({ haptics }),
      setReduceMotion: (reduceMotion) => update({ reduceMotion }),
    }),
    [
      prefs,
      fontSizePreview,
      effectiveFontSize,
      fontSizeDirty,
      setFontSizePreview,
      confirmFontSize,
      cancelFontSizePreview,
      update,
    ],
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
