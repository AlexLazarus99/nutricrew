import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function FoodSectionNav() {
  const { t } = useTranslation();

  return (
    <nav className="food-section-nav food-section-nav--3" aria-label={t("diary.sectionNav")}>
      <NavLink to="/log" end>
        {t("diary.tabLog")}
      </NavLink>
      <NavLink to="/diary">{t("diary.tabDiary")}</NavLink>
      <NavLink to="/steps">{t("diary.tabSteps")}</NavLink>
    </nav>
  );
}
