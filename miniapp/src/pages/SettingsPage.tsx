import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { trackEvent } from "../lib/analytics";

export function SettingsPage() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportData() {
    setBusy("export");
    setError(null);
    setMessage(null);
    try {
      trackEvent("settings_export");
      const data = await api.exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nutricrew-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage(t("settings.exportDone"));
    } catch (e) {
      setError((e as Error).message);
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
    <section className="stack">
      <div className="card">
        <h2>{t("settings.title")}</h2>
        <p className="muted">{t("settings.subtitle")}</p>
      </div>

      <div className="card">
        <h3>{t("settings.dataTitle")}</h3>
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
      </div>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
    </section>
  );
}
