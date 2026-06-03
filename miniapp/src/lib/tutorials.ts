export type TutorialStep = {
  titleKey: string;
  bodyKey: string;
  emoji?: string;
  /** CSS selector to highlight; omit for centered card */
  target?: string;
};

export type TutorialTourId = "welcome" | "log" | "game" | "team" | "progress";

const STORAGE_PREFIX = "nutricrew-tutorial-v1-";

export function isTutorialDone(tourId: TutorialTourId): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${tourId}`) === "done";
  } catch {
    return true;
  }
}

export function completeTutorial(tourId: TutorialTourId): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${tourId}`, "done");
  } catch {
    /* ignore */
  }
}

export function resetTutorial(tourId: TutorialTourId): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${tourId}`);
  } catch {
    /* ignore */
  }
}

export const TUTORIAL_TOURS: Record<TutorialTourId, TutorialStep[]> = {
  welcome: [
    { emoji: "👋", titleKey: "tutorial.welcome.title", bodyKey: "tutorial.welcome.body" },
    {
      emoji: "⭐",
      titleKey: "tutorial.progress.title",
      bodyKey: "tutorial.progress.body",
      target: "[data-tutorial='progress-card']",
    },
    {
      emoji: "📋",
      titleKey: "tutorial.quests.title",
      bodyKey: "tutorial.quests.body",
      target: "[data-tutorial='quests-panel']",
    },
    {
      emoji: "📸",
      titleKey: "tutorial.log.title",
      bodyKey: "tutorial.log.body",
      target: "[data-tutorial='nav-log']",
    },
    {
      emoji: "🤝",
      titleKey: "tutorial.team.title",
      bodyKey: "tutorial.team.body",
      target: "[data-tutorial='nav-team'], [data-tutorial='home-hero']",
    },
    {
      emoji: "🐦",
      titleKey: "tutorial.game.title",
      bodyKey: "tutorial.game.body",
      target: "[data-tutorial='nav-game']",
    },
  ],
  log: [
    { emoji: "📷", titleKey: "tutorial.logPhoto.title", bodyKey: "tutorial.logPhoto.body" },
    {
      emoji: "✅",
      titleKey: "tutorial.logSubmit.title",
      bodyKey: "tutorial.logSubmit.body",
      target: "[data-tutorial='log-submit']",
    },
  ],
  game: [
    { emoji: "🐦", titleKey: "tutorial.bird.title", bodyKey: "tutorial.bird.body" },
    {
      emoji: "🎁",
      titleKey: "tutorial.birdBonus.title",
      bodyKey: "tutorial.birdBonus.body",
      target: "[data-tutorial='game-canvas']",
    },
  ],
  team: [
    {
      emoji: "👥",
      titleKey: "tutorial.teamPage.title",
      bodyKey: "tutorial.teamPage.body",
      target: "[data-tutorial='team-invite']",
    },
  ],
  progress: [
    {
      emoji: "📈",
      titleKey: "tutorial.levels.title",
      bodyKey: "tutorial.levels.body",
      target: "[data-tutorial='progress-card']",
    },
  ],
};
