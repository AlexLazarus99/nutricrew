import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { api, type MeResponse } from "../api/client";

type MeContextValue = {
  me: MeResponse;
  refresh: () => Promise<void>;
};

const MeContext = createContext<MeContextValue | null>(null);

export function MeProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await api.getMe();
    setMe(data);
    setError(null);
  }, []);

  useEffect(() => {
    refresh()
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [refresh]);

  const value = useMemo(
    () => (me ? { me, refresh } : null),
    [me, refresh],
  );

  if (loading) {
    return <p className="loading">{t("common.loading")}</p>;
  }

  if (error && !me) {
    return (
      <section className="card error-card">
        <p>{t("common.error")}</p>
        <p className="muted">{error}</p>
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
