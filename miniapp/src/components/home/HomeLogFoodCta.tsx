import { useId } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LOG_CAMERA_LIVE_PATH } from "../../lib/logCameraPath";

type Props = {
  label: string;
};

function HomeFoodPhotoIcon() {
  const uid = useId().replace(/:/g, "");
  const g = (name: string) => `url(#${uid}-${name})`;

  return (
    <span className="home-log-food-cta__icon" aria-hidden>
      <span className="home-log-food-cta__icon-ring" />
      <span className="home-log-food-cta__icon-glow" />
      <svg className="home-log-food-cta__svg" viewBox="0 0 96 96">
        <defs>
          <linearGradient id={`${uid}-sky`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fff8e7" />
            <stop offset="100%" stopColor="#ffe0b2" />
          </linearGradient>
          <linearGradient id={`${uid}-cam`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#5c6bc0" />
            <stop offset="100%" stopColor="#283593" />
          </linearGradient>
          <linearGradient id={`${uid}-lens`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#81d4fa" />
            <stop offset="55%" stopColor="#29b6f6" />
            <stop offset="100%" stopColor="#1565c0" />
          </linearGradient>
          <linearGradient id={`${uid}-plate`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fffaf5" />
            <stop offset="100%" stopColor="#e8ddd2" />
          </linearGradient>
          <linearGradient id={`${uid}-salad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c8e6c9" />
            <stop offset="100%" stopColor="#66bb6a" />
          </linearGradient>
          <linearGradient id={`${uid}-tomato`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff8a65" />
            <stop offset="100%" stopColor="#e53935" />
          </linearGradient>
          <radialGradient id={`${uid}-flash`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffde7" />
            <stop offset="100%" stopColor="#ffeb3b" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="48" cy="78" rx="28" ry="6" fill="#000" opacity="0.08" />

        <g className="home-log-food-cta__plate">
          <ellipse cx="30" cy="62" rx="18" ry="5" fill={g("plate")} />
          <path d="M16 58 Q30 48 44 58" fill={g("salad")} />
          <circle cx="24" cy="54" r="4.5" fill={g("tomato")} />
          <circle cx="34" cy="52" r="3.8" fill="#ffca28" />
          <ellipse cx="28" cy="50" rx="5" ry="2.5" fill="#81c784" transform="rotate(-18 28 50)" />
        </g>

        <g className="home-log-food-cta__camera">
          <rect x="38" y="30" width="44" height="32" rx="7" fill={g("cam")} />
          <rect x="52" y="22" width="18" height="10" rx="3" fill="#3949ab" />
          <circle cx="60" cy="46" r="13" fill={g("lens")} />
          <circle cx="60" cy="46" r="7" fill="#0d47a1" opacity="0.45" />
          <circle cx="56" cy="42" r="2.5" fill="#fff" opacity="0.75" />
          <circle className="home-log-food-cta__flash-bulb" cx="74" cy="36" r="4.5" fill="#fff59d" />
          <circle className="home-log-food-cta__flash-ray" cx="74" cy="36" r="10" fill={g("flash")} opacity="0.55" />
        </g>

        <g className="home-log-food-cta__sparkles">
          <text x="18" y="28" fontSize="14" className="home-log-food-cta__xp">+XP</text>
          <circle className="home-log-food-cta__spark home-log-food-cta__spark--1" cx="82" cy="22" r="2.5" fill="#ffeb3b" />
          <circle className="home-log-food-cta__spark home-log-food-cta__spark--2" cx="14" cy="40" r="2" fill="#ff80ab" />
          <circle className="home-log-food-cta__spark home-log-food-cta__spark--3" cx="88" cy="58" r="1.8" fill="#69f0ae" />
        </g>
      </svg>
    </span>
  );
}

export function HomeLogFoodCta({ label }: Props) {
  const { t } = useTranslation();

  return (
    <Link to={LOG_CAMERA_LIVE_PATH} className="home-log-food-cta" data-tutorial="home-log-cta">
      <span className="home-log-food-cta__aurora" aria-hidden />
      <span className="home-log-food-cta__shimmer" aria-hidden />
      <span className="home-log-food-cta__body">
        <HomeFoodPhotoIcon />
        <span className="home-log-food-cta__label">{label}</span>
        <span className="home-log-food-cta__hint">{t("home.logCtaHint")}</span>
      </span>
    </Link>
  );
}
