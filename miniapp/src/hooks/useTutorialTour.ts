import { useCallback, useEffect, useState } from "react";
import {
  TUTORIAL_TOURS,
  completeTutorial,
  isTutorialDone,
  type TutorialTourId,
} from "../lib/tutorials";

export function useTutorialTour(tourId: TutorialTourId, enabled = true) {
  const steps = TUTORIAL_TOURS[tourId];
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!enabled || steps.length === 0 || isTutorialDone(tourId)) return;
    const timer = window.setTimeout(() => setActive(true), 600);
    return () => window.clearTimeout(timer);
  }, [enabled, tourId, steps.length]);

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;

  const next = useCallback(() => {
    if (isLast) {
      completeTutorial(tourId);
      setActive(false);
      return;
    }
    setStepIndex((i) => i + 1);
  }, [isLast, tourId]);

  const skip = useCallback(() => {
    completeTutorial(tourId);
    setActive(false);
  }, [tourId]);

  return {
    active: active && Boolean(step),
    step,
    stepIndex,
    stepCount: steps.length,
    isLast,
    next,
    skip,
  };
}
