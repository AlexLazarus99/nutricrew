import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, API_ERROR } from "../api/client";
import { trackEvent } from "../lib/analytics";
import { waitForServerReady, wakeApi } from "../lib/apiWarmup";
import { useTelegram } from "../hooks/useTelegram";
import { useMe } from "../hooks/useMe";
import { useAppPreferences } from "../hooks/useAppPreferences";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { SettingsRow } from "../components/settings/SettingsRow";
import { SettingsSegment } from "../components/settings/SettingsSegment";
import { SettingsToggle } from "../components/settings/SettingsToggle";
import { APP_BUILD } from "../lib/apiBase";

export function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useTelegram();
  const { me } = useMe();
  const {
    prefs,
    effectiveFontSize,
    fontSizeDirty,
    setFontSizePreview,
    confirmFontSize,
    cancelFontSizePreview,
    setHaptics,
    setReduceMotion,
  } = useAppPreferences();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fontSaved, setFontSaved] = useState(false);

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || me.user.firstName || "";
  const username = user?.username;
  const photoUrl = user?.photo_url;
  const nickname = username ? `@${username}` : displayName || t("settings.guest");

  useEffect(() => {
    return () => {
      cancelFontSizePreview();
    };
  }, [cancelFontSizePreview]);

  function handleFontSizeChange(size: typeof effectiveFontSize) {
    setFontSaved(false);
    setFontSizePreview(size);
  }

  function handleFontSizeConfirm() {
    confirmFontSize();
    setFontSaved(true);
    window.setTimeout(() => setFontSaved(false), 2200);
  }

  async function importWearableSample() {
    setBusy("wearable");
    setError(null);
    try {
      await api.importWearable("apple_health_json", {
        steps: 8432,
        activeCalories: 420,
        weightKg: me.weightKg ?? undefined,
      });
      setMessage(t("settings.wearableImported", { defaultValue: "Wearable data imported" }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function logWeight() {
    const raw = window.prompt(t("settings.weightPrompt", { defaultValue: "Weight (kg)" }));
    if (!raw) return;
    const kg = Number(raw);
    if (!Number.isFinite(kg)) return;
    setBusy("weight");
    try {
      await api.addWeightLog(kg);
      setMessage(t("settings.weightSaved", { defaultValue: "Weight saved" }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function exportData() {
    setBusy("export");
    setError(null);
    setMessage(null);
    try {
      wakeApi();
      const ready = await waitForServerReady();
      if (!ready) {
        setError(t("settings.exportServerBusy"));
        return;
      }
      trackEvent("settings_export");
      const data = await api.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const filename = `nutricrew-export-${Date.now()}.json`;
      const file = new File([blob], filename, { type: "application/json" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: filename });
      } else {
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setMessage(t("settings.exportDone"));
    } catch (e) {
      const code = (e as Error).message;
      if (
        code === API_ERROR.UNREACHABLE ||
        code === API_ERROR.TIMEOUT ||
        code === API_ERROR.STARTING
      ) {
        setError(t("settings.exportServerBusy"));
      } else if (code === "EXPORT_FAILED") {
        setError(t("settings.exportFailed"));
      } else {
        setError(code);
      }
    } finally {
      setBusy(null);
    }
  }

  async function deleteAccount() {
    if (!window.confirm(t("settings.deleteConfirm"))) return;
    setBusy("delete");
    setError(null);
    try {
      trackEvent("settings_delete");
      await api.deleteMyAccount();
      window.Telegram?.WebApp?.close();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  return (
    <section className="stack settings-page">
      <div className="card settings-profile-card">
        <div className="settings-profile-card__avatar">
          {photoUrl ? (
            <img src={photoUrl} alt="" width={64} height={64} decoding="async" />
          ) : (
            <span>{displayName.trim().charAt(0).toUpperCase() || "?"}</span>
          )}
        </div>
        <div>
          <h2>{displayName || t("settings.guest")}</h2>
          <p className="muted">{nickname}</p>
        </div>
      </div>

      <div className="card">
        <h3>{t("settings.appearanceTitle")}</h3>
        <SettingsRow label={t("settings.language")} hint={t("settings.languageHint")}>
          <LanguageSwitcher compact />
        </SettingsRow>
        <SettingsRow label={t("settings.fontSize")} hint={t("settings.fontSizeHint")}>
          <SettingsSegment
            value={effectiveFontSize}
            ariaLabel={t("settings.fontSize")}
            options={[
              { value: "sm", label: t("settings.fontSizeSm") },
              { value: "md", label: t("settings.fontSizeMd") },
              { value: "lg", label: t("settings.fontSizeLg") },
            ]}
            onChange={handleFontSizeChange}
          />
        </SettingsRow>

        <div className="settings-font-preview" data-font-scale={effectiveFontSize}>
          <p className="settings-font-preview__label muted small">{t("settings.fontSizePreview")}</p>
          <p className="settings-font-preview__title">{t("settings.fontSizePreviewTitle")}</p>
          <p className="settings-font-preview__body">{t("settings.fontSizePreviewBody")}</p>
        </div>

        {fontSizeDirty && (
          <div className="settings-font-confirm">
            <button type="button" className="btn btn-primary btn-block" onClick={handleFontSizeConfirm}>
              {t("settings.fontSizeOk")}
            </button>
          </div>
        )}
        {fontSaved && <p className="success settings-font-saved">{t("settings.fontSizeSaved")}</p>}
      </div>

      <div className="card">
        <h3>{t("settings.experienceTitle")}</h3>
        <SettingsRow label={t("settings.haptics")} hint={t("settings.hapticsHint")}>
          <SettingsToggle checked={prefs.haptics} onChange={setHaptics} label={t("settings.haptics")} />
        </SettingsRow>
        <SettingsRow label={t("settings.reduceMotion")} hint={t("settings.reduceMotionHint")}>
          <SettingsToggle
            checked={prefs.reduceMotion}
            onChange={setReduceMotion}
            label={t("settings.reduceMotion")}
          />
        </SettingsRow>
      </div>

      <div className="card">
        <h3>{t("settings.wellnessTitle", { defaultValue: "Wellness" })}</h3>
        <button type="button" className="btn btn-secondary btn-block" disabled={busy !== null} onClick={() => void logWeight()}>
          {t("settings.logWeight", { defaultValue: "Log weight" })}
        </button>
        <button type="button" className="btn btn-secondary btn-block" disabled={busy !== null} onClick={() => void importWearableSample()}>
          {t("settings.importWearable", { defaultValue: "Import Apple Health (demo)" })}
        </button>
      </div>

      <div className="card">
        <h3>{t("settings.dataTitle")}</h3>
        <p className="muted small">{t("settings.subtitle")}</p>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          disabled={busy !== null}
          onClick={() => void exportData()}
        >
          {busy === "export" ? t("common.loading") : t("settings.exportBtn")}
        </button>
        <button
          type="button"
          className="btn btn-danger btn-block"
          disabled={busy !== null}
          onClick={() => void deleteAccount()}
        >
          {busy === "delete" ? t("common.loading") : t("settings.deleteBtn")}
        </button>
      </div>

      <div className="card">
        <h3>{t("settings.legalTitle")}</h3>
        <Link to="/privacy" className="btn btn-secondary btn-block">
          {t("settings.privacyLink")}
        </Link>
        <Link to="/terms" className="btn btn-secondary btn-block">
          {t("settings.termsLink")}
        </Link>
        <p className="muted small build-stamp">build {APP_BUILD}</p>
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
