export type BirdId = "classic" | "ember" | "frost" | "neon" | "royal" | "storm";

export type BirdSkillKey =
  | "balanced"
  | "junkBurn"
  | "slowMo"
  | "nitroPlus"
  | "royalGhost"
  | "stormBoss";

export type BirdCatalogEntry = {
  id: BirdId;
  accent: string;
  glow: string;
  skills: BirdSkillKey[];
};

export const BIRD_UI: Record<BirdId, BirdCatalogEntry> = {
  classic: {
    id: "classic",
    accent: "#F9A825",
    glow: "#FFD54F",
    skills: ["balanced"],
  },
  ember: {
    id: "ember",
    accent: "#FF5722",
    glow: "#FFAB40",
    skills: ["junkBurn"],
  },
  frost: {
    id: "frost",
    accent: "#29B6F6",
    glow: "#B3E5FC",
    skills: ["slowMo"],
  },
  neon: {
    id: "neon",
    accent: "#E040FB",
    glow: "#EA80FC",
    skills: ["nitroPlus"],
  },
  royal: {
    id: "royal",
    accent: "#AB47BC",
    glow: "#E1BEE7",
    skills: ["royalGhost"],
  },
  storm: {
    id: "storm",
    accent: "#5C6BC0",
    glow: "#9FA8DA",
    skills: ["stormBoss"],
  },
};

export function isBirdId(id: string): id is BirdId {
  return id in BIRD_UI;
}

export const DEFAULT_BIRD_ID: BirdId = "classic";
