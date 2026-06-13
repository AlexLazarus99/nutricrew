import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type Props = {
  title: string;
  hint?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
};

export function EmptyState({ title, hint, icon, actionLabel, actionTo, onAction }: Props) {
  return (
    <div className="card nc-empty">
      {icon ? <div className="nc-empty__icon">{icon}</div> : null}
      <h3 className="nc-empty__title">{title}</h3>
      {hint ? <p className="nc-empty__hint">{hint}</p> : null}
      {actionLabel && actionTo ? (
        <Link to={actionTo} className="btn btn-primary btn-sm">
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction && !actionTo ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
