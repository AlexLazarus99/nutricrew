import type { ReactNode } from "react";

type Size = "default" | "compact" | "pill";
type Variant = "pro" | "channel";

type Props = {
  busy?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
  size?: Size;
  variant?: Variant;
  className?: string;
};

/** Apple-style gradient CTA with ambient glow and shimmer. */
export function ProSubscribeButton({
  busy,
  disabled,
  onClick,
  children,
  size = "default",
  variant = "pro",
  className,
}: Props) {
  const shellClass = [
    "pro-cta-shell",
    `pro-cta-shell--${size}`,
    variant !== "pro" ? `pro-cta-shell--${variant}` : "",
    busy ? "pro-cta-shell--busy" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      <span className="pro-cta-aurora" aria-hidden="true" />
      <span className="pro-cta-glow" aria-hidden="true" />
      <span className="pro-cta-orbit" aria-hidden="true" />
      <span className="pro-cta-wave" aria-hidden="true" />
      <button
        type="button"
        className="pro-cta"
        disabled={disabled || busy}
        onClick={onClick}
      >
        <span className="pro-cta__shine" aria-hidden="true" />
        <span className="pro-cta__label">{children}</span>
      </button>
    </div>
  );
}
