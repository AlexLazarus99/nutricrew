export type BirdId = "classic" | "ember" | "frost" | "neon" | "royal" | "storm";

export type BirdTrialDef = {
  id: string;
  birdId: BirdId;
  requiredLevel: number;
  rewardStars: number;
};

export type BirdDef = {
  id: BirdId;
  starPrice: number;
  invoiceStars: number;
  /** Lifetime XP cost (optional alternative to Stars) */
  xpPrice: number | null;
  /** Only Telegram Stars / in-app star balance — no XP unlock */
  starsOnly: boolean;
  free: boolean;
  sortOrder: number;
};

export const BIRD_CATALOG: BirdDef[] = [
  { id: "classic", starPrice: 0, invoiceStars: 0, xpPrice: null, starsOnly: false, free: true, sortOrder: 0 },
  { id: "ember", starPrice: 120, invoiceStars: 99, xpPrice: 5100, starsOnly: false, free: false, sortOrder: 1 },
  { id: "frost", starPrice: 150, invoiceStars: 129, xpPrice: 7250, starsOnly: false, free: false, sortOrder: 2 },
  { id: "neon", starPrice: 200, invoiceStars: 169, xpPrice: null, starsOnly: true, free: false, sortOrder: 3 },
  { id: "royal", starPrice: 280, invoiceStars: 229, xpPrice: null, starsOnly: true, free: false, sortOrder: 4 },
  { id: "storm", starPrice: 350, invoiceStars: 289, xpPrice: null, starsOnly: true, free: false, sortOrder: 5 },
];

export const BIRD_TRIALS: BirdTrialDef[] = [
  { id: "trial_ember_inferno", birdId: "ember", requiredLevel: 15, rewardStars: 25 },
  { id: "trial_frost_depths", birdId: "frost", requiredLevel: 22, rewardStars: 30 },
  { id: "trial_neon_pulse", birdId: "neon", requiredLevel: 28, rewardStars: 35 },
  { id: "trial_royal_gate", birdId: "royal", requiredLevel: 35, rewardStars: 40 },
  { id: "trial_storm_crown", birdId: "storm", requiredLevel: 42, rewardStars: 50 },
];

const BIRD_BY_ID = new Map(BIRD_CATALOG.map((b) => [b.id, b]));
const TRIAL_BY_ID = new Map(BIRD_TRIALS.map((t) => [t.id, t]));

export function getBirdDef(id: string): BirdDef | undefined {
  return BIRD_BY_ID.get(id as BirdId);
}

export function getTrialDef(id: string): BirdTrialDef | undefined {
  return TRIAL_BY_ID.get(id);
}

export function isBirdId(id: string): id is BirdId {
  return BIRD_BY_ID.has(id as BirdId);
}

export function trialsForBird(birdId: BirdId): BirdTrialDef[] {
  return BIRD_TRIALS.filter((t) => t.birdId === birdId);
}
