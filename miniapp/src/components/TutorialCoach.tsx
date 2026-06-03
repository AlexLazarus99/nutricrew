import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TutorialStep } from "../lib/tutorials";

function findTutorialTarget(selector: string): Element | null {
  for (const part of selector.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const el = document.querySelector(trimmed);
    if (el) return el;
  }
  return null;
}

type Props = {
  active: boolean;
  step: TutorialStep | undefined;
  stepIndex: number;
  stepCount: number;
  isLast: boolean;
  next: () => void;
  skip: () => void;
};

export function TutorialCoach({
  active,
  step,
  stepIndex,
  stepCount,
  isLast,
  next,
  skip,
}: Props) {
  const { t } = useTranslation();
  const [spot, setSpot] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!active || !step?.target) {
      setSpot(null);
      return;
    }
    const el = findTutorialTarget(step.target);
    if (!el) {
      setSpot(null);
      return;
    }
    const update = () => setSpot(el.getBoundingClientRect());
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [active, step?.target, stepIndex]);

  if (!active || !step) return null;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true">
      <button type="button" className="tutorial-backdrop" onClick={skip} aria-label={t("tutorial.skip")} />
      {spot && (
        <div
          className="tutorial-spotlight"
          style={{
            top: spot.top - 6,
            left: spot.left - 6,
            width: spot.width + 12,
            height: spot.height + 12,
          }}
        />
      )}
      <div className={`tutorial-card ${spot ? "tutorial-card--anchored" : "tutorial-card--center"}`}>
        <div className="tutorial-mascot">{step.emoji ?? "🐣"}</div>
        <p className="tutorial-step-label">
          {t("tutorial.step", { current: stepIndex + 1, total: stepCount })}
        </p>
        <h3 className="tutorial-title">{t(step.titleKey)}</h3>
        <p className="tutorial-body">{t(step.bodyKey)}</p>
        <div className="tutorial-actions">
          <button type="button" className="btn btn-ghost tutorial-skip" onClick={skip}>
            {t("tutorial.skip")}
          </button>
          <button type="button" className="btn btn-primary" onClick={next}>
            {isLast ? t("tutorial.done") : t("tutorial.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
