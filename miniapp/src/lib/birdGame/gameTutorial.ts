export type TutorialTipId = "trees" | "junk" | "fruit" | "ghost" | "nitro" | "boss";

export type TutorialTip = {
  id: TutorialTipId;
  minLevel: number;
  once: boolean;
};

export const TUTORIAL_TIPS: TutorialTip[] = [
  { id: "trees", minLevel: 1, once: true },
  { id: "junk", minLevel: 5, once: true },
  { id: "fruit", minLevel: 3, once: true },
  { id: "ghost", minLevel: 8, once: true },
  { id: "nitro", minLevel: 12, once: true },
  { id: "boss", minLevel: 50, once: true },
];

export function junkEnabledForLevel(level: number): boolean {
  return level >= 5;
}

export function pickTutorialTip(
  level: number,
  shown: Set<TutorialTipId>,
): TutorialTipId | null {
  for (const tip of TUTORIAL_TIPS) {
    if (level >= tip.minLevel && !shown.has(tip.id)) return tip.id;
  }
  return null;
}
