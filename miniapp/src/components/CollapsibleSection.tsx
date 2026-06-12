import { ReactNode, useCallback, useState } from "react";

type Props = {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  storageKey?: string;
  className?: string;
  children: ReactNode;
};

function readStoredOpen(storageKey: string | undefined, defaultOpen: boolean): boolean {
  if (!storageKey) return defaultOpen;
  try {
    const value = localStorage.getItem(storageKey);
    if (value === "1") return true;
    if (value === "0") return false;
  } catch {
    /* ignore */
  }
  return defaultOpen;
}

export function CollapsibleSection({
  title,
  summary,
  defaultOpen = false,
  storageKey,
  className,
  children,
}: Props) {
  const [open, setOpen] = useState(() => readStoredOpen(storageKey, defaultOpen));

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, next ? "1" : "0");
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  }, [storageKey]);

  return (
    <div className={`collapsible-section${className ? ` ${className}` : ""}`}>
      <button
        type="button"
        className="collapsible-section__head"
        onClick={toggle}
        aria-expanded={open}
      >
        <span className="collapsible-section__title">{title}</span>
        {!open && summary ? (
          <span className="collapsible-section__summary muted small">{summary}</span>
        ) : null}
        <span className="collapsible-section__chevron" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open ? <div className="collapsible-section__body">{children}</div> : null}
    </div>
  );
}
