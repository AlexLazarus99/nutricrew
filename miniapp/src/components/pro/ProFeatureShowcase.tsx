import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const PRO_FEATURE_KEYS = [
  { key: "pro.featureCoach", to: "/coach", icon: "🍑", tone: "coach" },
  { key: "pro.featureAi", to: "/log", icon: "✨", tone: "ai" },
  { key: "pro.featureReports", to: "/report", icon: "📊", tone: "report" },
  { key: "pro.featureTrends90", to: "/trends", icon: "📈", tone: "trends" },
  { key: "pro.featureDeficit", to: "/trends", icon: "⚖️", tone: "deficit" },
  { key: "pro.featureGoals", to: "/pro", icon: "🎯", tone: "goals" },
  { key: "pro.featureShopping", to: "/pro", icon: "🛒", tone: "shop" },
  { key: "pro.featureMealPlan4w", to: "/pro", icon: "📅", tone: "plan" },
  { key: "pro.featurePlateReview", to: "/coach", icon: "🍽", tone: "plate" },
  { key: "pro.featureWearables", to: "/settings", icon: "⌚", tone: "wear" },
  { key: "pro.featureExport", to: "/settings", icon: "📤", tone: "export" },
  { key: "pro.featureReminders", to: "/pro", icon: "🔔", tone: "remind" },
  { key: "pro.featureBird", to: "/game", icon: "🪶", tone: "bird" },
  { key: "pro.featurePartner", to: "/pro", icon: "👥", tone: "partner" },
  { key: "pro.featureChannel", to: "/pro", icon: "📣", tone: "channel" },
  { key: "pro.featureFreeze", to: "/pro", icon: "❄️", tone: "freeze" },
] as const;

type Props = {
  compact?: boolean;
};

export function ProFeatureShowcase({ compact = false }: Props) {
  const { t } = useTranslation();

  return (
    <ul className={`pro-feature-grid${compact ? " pro-feature-grid--compact" : ""}`}>
      {PRO_FEATURE_KEYS.map((item, index) => (
        <li key={item.key} className="pro-feature-grid__item" style={{ animationDelay: `${index * 45}ms` }}>
          <Link to={item.to} className={`pro-feature-card pro-feature-card--${item.tone}`}>
            <span className="pro-feature-card__icon" aria-hidden>
              {item.icon}
            </span>
            <span className="pro-feature-card__label">{t(item.key)}</span>
            <span className="pro-feature-card__shine" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
