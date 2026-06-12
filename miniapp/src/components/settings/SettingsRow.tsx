import type { ReactNode } from "react";

type Props = {
  label: string;
  hint?: string;
  children: ReactNode;
};

export function SettingsRow({ label, hint, children }: Props) {
  return (
    <div className="settings-row">
      <div className="settings-row__text">
        <span className="settings-row__label">{label}</span>
        {hint && <span className="settings-row__hint muted small">{hint}</span>}
      </div>
      <div className="settings-row__control">{children}</div>
    </div>
  );
}
