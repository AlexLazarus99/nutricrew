import { useId } from "react";
import { Link } from "react-router-dom";

export type HomeGradientTone = "trends" | "pro";

type Props = {
  to: string;
  tone: HomeGradientTone;
  label: string;
  hint?: string;
};

function TrendsIcon() {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;

  return (
    <span className="home-gradient-cta__icon" aria-hidden>
      <span className="home-gradient-cta__icon-ring" />
      <span className="home-gradient-cta__icon-glow" />
      <svg className="home-gradient-cta__svg" viewBox="0 0 64 64">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b2ebf2" />
            <stop offset="100%" stopColor="#4dd0e1" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="44" height="44" rx="14" fill={g("bg")} />
        <path
          className="home-gradient-cta__trend-line"
          d="M16 42 L28 30 L38 34 L48 18"
          fill="none"
          stroke="#0277bd"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle className="home-gradient-cta__trend-dot" cx="48" cy="18" r="3.5" fill="#00acc1" />
        <circle className="home-gradient-cta__spark home-gradient-cta__spark--1" cx="20" cy="20" r="2.2" fill="#80deea" />
        <circle className="home-gradient-cta__spark home-gradient-cta__spark--2" cx="44" cy="44" r="1.8" fill="#4db6ac" />
      </svg>
    </span>
  );
}

function ProIcon() {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;

  return (
    <span className="home-gradient-cta__icon" aria-hidden>
      <span className="home-gradient-cta__icon-ring" />
      <span className="home-gradient-cta__icon-glow" />
      <svg className="home-gradient-cta__svg" viewBox="0 0 64 64">
        <defs>
          <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e1bee7" />
            <stop offset="100%" stopColor="#b39ddb" />
          </linearGradient>
          <linearGradient id={`${uid}-crown`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff59d" />
            <stop offset="50%" stopColor="#ffd54f" />
            <stop offset="100%" stopColor="#ff8f00" />
          </linearGradient>
        </defs>
        <rect x="10" y="10" width="44" height="44" rx="14" fill={g("bg")} />
        <path
          className="home-gradient-cta__crown"
          d="M18 38 h28 v4 H18 Z M20 38 L24 24 l8 8 8-10 8 14"
          fill={g("crown")}
        />
        <circle className="home-gradient-cta__spark home-gradient-cta__spark--1" cx="46" cy="18" r="2.5" fill="#f48fb1" />
        <circle className="home-gradient-cta__spark home-gradient-cta__spark--2" cx="16" cy="22" r="2" fill="#ce93d8" />
        <circle className="home-gradient-cta__spark home-gradient-cta__spark--3" cx="50" cy="42" r="1.6" fill="#fff59d" />
      </svg>
    </span>
  );
}

export function HomeGradientLinkCta({ to, tone, label, hint }: Props) {
  const rootClass = ["home-gradient-cta", `home-gradient-cta--${tone}`].join(" ");

  return (
    <Link to={to} className={rootClass}>
      <span className="home-gradient-cta__aurora" aria-hidden />
      <span className="home-gradient-cta__shimmer" aria-hidden />
      <span className="home-gradient-cta__bubbles" aria-hidden>
        <span className="home-gradient-cta__bubble home-gradient-cta__bubble--1" />
        <span className="home-gradient-cta__bubble home-gradient-cta__bubble--2" />
        <span className="home-gradient-cta__bubble home-gradient-cta__bubble--3" />
      </span>
      <span className="home-gradient-cta__body">
        {tone === "trends" ? <TrendsIcon /> : <ProIcon />}
        <span className="home-gradient-cta__copy">
          <strong className="home-gradient-cta__label">{label}</strong>
          {hint ? <span className="home-gradient-cta__hint">{hint}</span> : null}
        </span>
        <span className="home-gradient-cta__chevron" aria-hidden>
          →
        </span>
      </span>
    </Link>
  );
}
