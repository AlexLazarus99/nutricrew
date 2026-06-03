import { useTranslation } from "react-i18next";

type Props = {
  slow?: boolean;
};

export function NutriCrewSplash({ slow = false }: Props) {
  const { t } = useTranslation();

  return (
    <div className="nutricrew-splash" role="status" aria-live="polite" aria-busy="true">
      <div className="splash-bg" aria-hidden>
        <span className="splash-orb splash-orb-1" />
        <span className="splash-orb splash-orb-2" />
        <span className="splash-orb splash-orb-3" />
        <span className="splash-spark splash-spark-1">✦</span>
        <span className="splash-spark splash-spark-2">★</span>
        <span className="splash-spark splash-spark-3">✦</span>
        <span className="splash-spark splash-spark-4">★</span>
      </div>

      <div className="splash-card">
        <div className="splash-logo-ring" aria-hidden>
          <span className="splash-ring splash-ring-outer" />
          <span className="splash-ring splash-ring-inner" />
        </div>

        <svg
          className="splash-mascot"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <linearGradient id="splash-badge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFE566" />
              <stop offset="45%" stopColor="#FF9F43" />
              <stop offset="100%" stopColor="#FF6B9D" />
            </linearGradient>
            <linearGradient id="splash-leaf" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2ECC71" />
              <stop offset="100%" stopColor="#1ABC9C" />
            </linearGradient>
            <linearGradient id="splash-apple" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF6B6B" />
              <stop offset="100%" stopColor="#EE5A6F" />
            </linearGradient>
            <filter id="splash-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="100" cy="100" r="88" fill="url(#splash-badge)" filter="url(#splash-glow)" />
          <circle cx="100" cy="100" r="78" fill="#FFF8E7" opacity="0.92" />
          <ellipse cx="100" cy="108" rx="52" ry="48" fill="#4ECDC4" />
          <ellipse cx="100" cy="112" rx="44" ry="38" fill="#45B7AA" />
          <path
            d="M68 98 Q100 72 132 98 Q128 118 100 124 Q72 118 68 98 Z"
            fill="#FFF9C4"
          />
          <circle cx="86" cy="100" r="9" fill="#2C3E50" />
          <circle cx="114" cy="100" r="9" fill="#2C3E50" />
          <circle cx="88" cy="98" r="3.5" fill="#FFFFFF" />
          <circle cx="116" cy="98" r="3.5" fill="#FFFFFF" />
          <path
            d="M92 112 Q100 122 108 112"
            stroke="#E74C3C"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="78" cy="108" rx="8" ry="5" fill="#FFB3BA" opacity="0.55" />
          <ellipse cx="122" cy="108" rx="8" ry="5" fill="#FFB3BA" opacity="0.55" />
          <g className="splash-svg-leaf">
            <path
              d="M148 62 C165 58 172 78 158 88 C150 72 148 62 148 62 Z"
              fill="url(#splash-leaf)"
            />
            <path d="M152 72 L158 84" stroke="#1E8449" strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="splash-svg-apple">
            <circle cx="52" cy="78" r="16" fill="url(#splash-apple)" />
            <path d="M52 62 Q54 56 58 54" stroke="#5D4037" strokeWidth="2.5" fill="none" />
            <ellipse cx="58" cy="56" rx="6" ry="3" fill="#81C784" transform="rotate(-25 58 56)" />
          </g>
          <text
            x="100"
            y="168"
            textAnchor="middle"
            fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
            fontWeight="800"
            fontSize="28"
            fill="#2C3E50"
          >
            NC
          </text>
        </svg>

        <h1 className="splash-wordmark">
          <span className="splash-word splash-word-nutri">Nutri</span>
          <span className="splash-word splash-word-crew">Crew</span>
        </h1>
        <p className="splash-tagline">{t("splash.tagline")}</p>
      </div>

      <div className="splash-loader">
        <div className="splash-loader-track" aria-hidden>
          <div className="splash-loader-bar" />
        </div>
        <p className="splash-status">{t("splash.loading")}</p>
        {slow ? <p className="splash-hint">{t("common.loadingSlow")}</p> : null}
      </div>
    </div>
  );
}
