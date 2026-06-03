import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { api, API_ERROR, type MeResponse } from "../api/client";
import { isInsideTelegram, APP_BUILD } from "../lib/apiBase";
import { syncTimezoneOnce } from "../lib/syncTimezone";
import { waitForServerReady, wakeApi } from "../lib/apiWarmup";
import { getTelegramAuthDebug, waitForTelegramInitData } from "../lib/telegramReady";
import { NutriCrewSplash } from "../components/NutriCrewSplash";

type MeContextValue = {
  me: MeResponse;
  refresh: () => Promise<void>;
};

const MeContext = createContext<MeContextValue | null>(null);

function formatMeError(message: string, t: (key: string) => string): string {
  switch (message) {
    case API_ERROR.UNREACHABLE:
      return t("common.apiUnreachable");
    case API_ERROR.TIMEOUT:
    case API_ERROR.STARTING:
      return t("common.apiTimeout");
    case API_ERROR.TELEGRAM_REQUIRED:
      return isInsideTelegram() ? t("common.telegramMenuButtonHint") : t("common.telegramRequired");
    case API_ERROR.INVALID_TELEGRAM_AUTH:
      return t("common.invalidTelegramAuth");
    case API_ERROR.BOT_NOT_CONFIGURED:
      return t("common.botNotConfigured");
    case API_ERROR.BAD_RESPONSE:
      return t("common.apiBadResponse");
    default:
      return message;
  }
}

export function MeProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await api.getMe();
    setMe(data);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSlow(false);
    setError(null);

    const slowTimer = window.setTimeout(() => {
      if (!cancelled) setSlow(true);
    }, 4000);

    void (async () => {
      wakeApi();
      await Promise.all([waitForTelegramInitData(), waitForServerReady()]);

      try {
        await refresh();
        syncTimezoneOnce();
        if (!cancelled) setError(null);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) {
          window.clearTimeout(slowTimer);
          setLoading(false);
          setSlow(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(slowTimer);
    };
  }, [refresh]);

  const value = useMemo(
    () => (me ? { me, refresh } : null),
    [me, refresh],
  );

  if (loading) {
    return <NutriCrewSplash slow={slow} />;
  }

  if (error && !me) {
    return (
      <section className="card error-card">
        <p>{t("common.error")}</p>
        <p className="muted">{formatMeError(error, t)}</p>
        <p className="muted build-stamp">build {APP_BUILD}</p>
        {error === API_ERROR.TELEGRAM_REQUIRED ? (
          <p className="muted build-stamp">{getTelegramAuthDebug()}</p>
        ) : null}
        <button type="button" className="btn btn-secondary" onClick={() => void refresh()}>
          {t("common.retry")}
        </button>
      </section>
    );
  }

  if (!me || !value) {
    return (
      <section className="card error-card">
        <p>{t("common.error")}</p>
        <button type="button" className="btn btn-secondary" onClick={() => void refresh()}>
          {t("common.retry")}
        </button>
      </section>
    );
  }

  return <MeContext.Provider value={value}>{children}</MeContext.Provider>;
}

export function useMe(): MeContextValue {
  const ctx = useContext(MeContext);
  if (!ctx) {
    throw new Error("useMe must be used within MeProvider");
  }
  return ctx;
}

export function useMeOptional(): MeContextValue | null {
  return useContext(MeContext);
}
