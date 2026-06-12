/** Босс каждые 100, биом — блоки по 50 природных уровней, город — отдельные блоки по 12. */

export const BOSS_INTERVAL = 100;
export const BIOME_LEVEL_SPAN = 50;
export const CITY_LEVEL_SPAN = 12;
export const WORLD_CYCLE = BIOME_LEVEL_SPAN + CITY_LEVEL_SPAN;

export type BossKind =
  | "boar"
  | "bear"
  | "crocodile"
  | "tiger"
  | "wolf"
  | "lion"
  | "eagle"
  | "snake";

export const BOSS_KINDS: BossKind[] = [
  "boar",
  "bear",
  "crocodile",
  "tiger",
  "wolf",
  "lion",
  "eagle",
  "snake",
];

export type BiomeId =
  | "meadow"
  | "desert"
  | "oasis"
  | "antarctica"
  | "jungle"
  | "mountains"
  | "forest";

export const BIOME_IDS: BiomeId[] = [
  "meadow",
  "desert",
  "oasis",
  "antarctica",
  "jungle",
  "mountains",
  "forest",
];

export type CityId =
  | "paris"
  | "madrid"
  | "berlin"
  | "barcelona"
  | "cologne"
  | "new_york"
  | "san_francisco"
  | "sydney"
  | "new_delhi"
  | "cairo"
  | "reykjavik"
  | "rome";

export const CITY_IDS: CityId[] = [
  "paris",
  "madrid",
  "berlin",
  "barcelona",
  "cologne",
  "new_york",
  "san_francisco",
  "sydney",
  "new_delhi",
  "cairo",
  "reykjavik",
  "rome",
];

export type BiomePalette = {
  skyTop: string;
  skyMid: string;
  skyBot: string;
  landTop: string;
  landMid: string;
  landBot: string;
  landSoil: string;
  waterTop: string;
  waterMid: string;
  waterBot: string;
  farMountains: string;
  grass: string;
};

export type CityPalette = {
  skyTop: string;
  skyMid: string;
  skyBot: string;
  groundTop: string;
  groundMid: string;
  groundBot: string;
  building: string;
  buildingHi: string;
  accent: string;
};

const BIOME_PALETTES: Record<BiomeId, BiomePalette> = {
  meadow: {
    skyTop: "#6BB5C8",
    skyMid: "#8ECAD8",
    skyBot: "#B8E0E8",
    landTop: "#7CB342",
    landMid: "#689F38",
    landBot: "#558B2F",
    landSoil: "#5D4A3A",
    waterTop: "#4DA8B8",
    waterMid: "#2E8C9E",
    waterBot: "#1A5F73",
    farMountains: "rgba(50,105,95,0.48)",
    grass: "#8BC34A",
  },
  desert: {
    skyTop: "#FFE082",
    skyMid: "#FFCC80",
    skyBot: "#FFB74D",
    landTop: "#FFF176",
    landMid: "#FDD835",
    landBot: "#F9A825",
    landSoil: "#E65100",
    waterTop: "#4DD0E1",
    waterMid: "#26C6DA",
    waterBot: "#00838F",
    farMountains: "rgba(191,54,12,0.28)",
    grass: "#827717",
  },
  oasis: {
    skyTop: "#81D4FA",
    skyMid: "#B3E5FC",
    skyBot: "#FFE082",
    landTop: "#AED581",
    landMid: "#9CCC65",
    landBot: "#DCE775",
    landSoil: "#8D6E63",
    waterTop: "#26C6DA",
    waterMid: "#00ACC1",
    waterBot: "#006064",
    farMountains: "rgba(76,175,80,0.25)",
    grass: "#558B2F",
  },
  antarctica: {
    skyTop: "#E1F5FE",
    skyMid: "#B3E5FC",
    skyBot: "#81D4FA",
    landTop: "#FAFAFA",
    landMid: "#ECEFF1",
    landBot: "#CFD8DC",
    landSoil: "#90A4AE",
    waterTop: "#B3E5FC",
    waterMid: "#4FC3F7",
    waterBot: "#0277BD",
    farMountains: "rgba(176,190,197,0.55)",
    grass: "#B0BEC5",
  },
  jungle: {
    skyTop: "#33691E",
    skyMid: "#558B2F",
    skyBot: "#689F38",
    landTop: "#2E7D32",
    landMid: "#388E3C",
    landBot: "#1B5E20",
    landSoil: "#3E2723",
    waterTop: "#00897B",
    waterMid: "#00695C",
    waterBot: "#004D40",
    farMountains: "rgba(27,94,32,0.45)",
    grass: "#1B5E20",
  },
  mountains: {
    skyTop: "#90CAF9",
    skyMid: "#BBDEFB",
    skyBot: "#E3F2FD",
    landTop: "#78909C",
    landMid: "#607D8B",
    landBot: "#546E7A",
    landSoil: "#455A64",
    waterTop: "#4FC3F7",
    waterMid: "#0288D1",
    waterBot: "#01579B",
    farMountains: "rgba(69,90,100,0.5)",
    grass: "#689F38",
  },
  forest: {
    skyTop: "#5A9AAA",
    skyMid: "#7AB8C0",
    skyBot: "#A0D4D8",
    landTop: "#558B2F",
    landMid: "#4A7C42",
    landBot: "#33691E",
    landSoil: "#4E342E",
    waterTop: "#4A7C42",
    waterMid: "#3D6B38",
    waterBot: "#2E5A30",
    farMountains: "rgba(35,70,60,0.52)",
    grass: "#7CB342",
  },
};

const CITY_PALETTES: Record<CityId, CityPalette> = {
  paris: {
    skyTop: "#B3E5FC",
    skyMid: "#E1F5FE",
    skyBot: "#FFF8E1",
    groundTop: "#78909C",
    groundMid: "#607D8B",
    groundBot: "#455A64",
    building: "#37474F",
    buildingHi: "#546E7A",
    accent: "#8D6E63",
  },
  madrid: {
    skyTop: "#FFE0B2",
    skyMid: "#FFCC80",
    skyBot: "#FFF3E0",
    groundTop: "#8D6E63",
    groundMid: "#6D4C41",
    groundBot: "#4E342E",
    building: "#5D4037",
    buildingHi: "#795548",
    accent: "#BF360C",
  },
  berlin: {
    skyTop: "#CFD8DC",
    skyMid: "#ECEFF1",
    skyBot: "#FAFAFA",
    groundTop: "#757575",
    groundMid: "#616161",
    groundBot: "#424242",
    building: "#455A64",
    buildingHi: "#607D8B",
    accent: "#FF5252",
  },
  barcelona: {
    skyTop: "#81D4FA",
    skyMid: "#B3E5FC",
    skyBot: "#FFF9C4",
    groundTop: "#90A4AE",
    groundMid: "#78909C",
    groundBot: "#546E7A",
    building: "#546E7A",
    buildingHi: "#78909C",
    accent: "#FFB300",
  },
  cologne: {
    skyTop: "#BBDEFB",
    skyMid: "#E3F2FD",
    skyBot: "#ECEFF1",
    groundTop: "#78909C",
    groundMid: "#607D8B",
    groundBot: "#455A64",
    building: "#455A64",
    buildingHi: "#607D8B",
    accent: "#8D6E63",
  },
  new_york: {
    skyTop: "#90CAF9",
    skyMid: "#BBDEFB",
    skyBot: "#E3F2FD",
    groundTop: "#616161",
    groundMid: "#424242",
    groundBot: "#212121",
    building: "#263238",
    buildingHi: "#37474F",
    accent: "#FFD54F",
  },
  san_francisco: {
    skyTop: "#B3E5FC",
    skyMid: "#E1F5FE",
    skyBot: "#FFFDE7",
    groundTop: "#78909C",
    groundMid: "#607D8B",
    groundBot: "#455A64",
    building: "#455A64",
    buildingHi: "#607D8B",
    accent: "#C62828",
  },
  sydney: {
    skyTop: "#81D4FA",
    skyMid: "#4FC3F7",
    skyBot: "#E0F7FA",
    groundTop: "#8D6E63",
    groundMid: "#6D4C41",
    groundBot: "#4E342E",
    building: "#37474F",
    buildingHi: "#546E7A",
    accent: "#FFF176",
  },
  new_delhi: {
    skyTop: "#FFCC80",
    skyMid: "#FFE0B2",
    skyBot: "#FFF3E0",
    groundTop: "#A1887F",
    groundMid: "#8D6E63",
    groundBot: "#6D4C41",
    building: "#5D4037",
    buildingHi: "#795548",
    accent: "#FF7043",
  },
  cairo: {
    skyTop: "#FFE082",
    skyMid: "#FFCC80",
    skyBot: "#FFF8E1",
    groundTop: "#D7CCC8",
    groundMid: "#BCAAA4",
    groundBot: "#A1887F",
    building: "#8D6E63",
    buildingHi: "#A1887F",
    accent: "#FFB74D",
  },
  reykjavik: {
    skyTop: "#B0BEC5",
    skyMid: "#CFD8DC",
    skyBot: "#ECEFF1",
    groundTop: "#90A4AE",
    groundMid: "#78909C",
    groundBot: "#607D8B",
    building: "#546E7A",
    buildingHi: "#78909C",
    accent: "#4FC3F7",
  },
  rome: {
    skyTop: "#FFCC80",
    skyMid: "#FFE0B2",
    skyBot: "#FFF3E0",
    groundTop: "#A1887F",
    groundMid: "#8D6E63",
    groundBot: "#6D4C41",
    building: "#6D4C41",
    buildingHi: "#8D6E63",
    accent: "#D84315",
  },
};

export type BossSpec = {
  kind: BossKind;
  label: string;
  headX: number;
  headY: number;
  mouthForward: number;
};

export function isCityLevel(level: number): boolean {
  const pos = (level - 1) % WORLD_CYCLE;
  return pos >= BIOME_LEVEL_SPAN;
}

export function natureLevelsBefore(level: number): number {
  const progress = level - 1;
  const fullCycles = Math.floor(progress / WORLD_CYCLE);
  const rem = progress % WORLD_CYCLE;
  return fullCycles * BIOME_LEVEL_SPAN + Math.min(rem, BIOME_LEVEL_SPAN);
}

export function bossMilestoneForLevel(level: number): number {
  if (level < BOSS_INTERVAL) return 0;
  return Math.floor(level / BOSS_INTERVAL) * BOSS_INTERVAL;
}

export function bossKindForMilestone(milestone: number): BossKind {
  const tier = Math.max(0, milestone / BOSS_INTERVAL - 1);
  return BOSS_KINDS[tier % BOSS_KINDS.length];
}

export function bossSpec(kind: BossKind): BossSpec {
  const specs: Record<BossKind, BossSpec> = {
    boar: { kind, label: "BOAR", headX: 0.76, headY: 0.24, mouthForward: 0.08 },
    bear: { kind, label: "BEAR", headX: 0.72, headY: 0.2, mouthForward: 0.1 },
    crocodile: { kind, label: "CROC", headX: 0.82, headY: 0.28, mouthForward: 0.12 },
    tiger: { kind, label: "TIGER", headX: 0.74, headY: 0.22, mouthForward: 0.09 },
    wolf: { kind, label: "WOLF", headX: 0.78, headY: 0.21, mouthForward: 0.08 },
    lion: { kind, label: "LION", headX: 0.73, headY: 0.2, mouthForward: 0.09 },
    eagle: { kind, label: "EAGLE", headX: 0.7, headY: 0.18, mouthForward: 0.11 },
    snake: { kind, label: "SNAKE", headX: 0.84, headY: 0.3, mouthForward: 0.14 },
  };
  return specs[kind];
}

export function biomeForLevel(level: number): BiomeId {
  if (isCityLevel(level)) return "meadow";
  const idx = Math.floor(natureLevelsBefore(level) / BIOME_LEVEL_SPAN) % BIOME_IDS.length;
  return BIOME_IDS[idx];
}

export function worldBlockIndex(level: number): number {
  return Math.floor(Math.max(0, level - 1) / WORLD_CYCLE);
}

export function biomeForBlock(blockIndex: number): BiomeId {
  const n = BIOME_IDS.length;
  const idx = ((blockIndex % n) + n) % n;
  return BIOME_IDS[idx];
}

export function cityForBlock(blockIndex: number): CityId {
  const n = CITY_IDS.length;
  const idx = ((blockIndex % n) + n) % n;
  return CITY_IDS[idx];
}

export function cityForLevel(level: number): CityId | null {
  if (!isCityLevel(level)) return null;
  return cityForBlock(worldBlockIndex(level));
}

export function biomePalette(biome: BiomeId): BiomePalette {
  return BIOME_PALETTES[biome];
}

export function cityPalette(city: CityId): CityPalette {
  return CITY_PALETTES[city];
}

export function cityDisplayName(city: CityId): string {
  const names: Record<CityId, string> = {
    paris: "Paris",
    madrid: "Madrid",
    berlin: "Berlin",
    barcelona: "Barcelona",
    cologne: "Köln",
    new_york: "New York",
    san_francisco: "San Francisco",
    sydney: "Sydney",
    new_delhi: "New Delhi",
    cairo: "Cairo",
    reykjavik: "Reykjavík",
    rome: "Rome",
  };
  return names[city];
}

export function biomeDisplayName(biome: BiomeId): string {
  const names: Record<BiomeId, string> = {
    meadow: "Meadow",
    desert: "Desert",
    oasis: "Oasis",
    antarctica: "Antarctica",
    jungle: "Jungle",
    mountains: "Mountains",
    forest: "Deep Forest",
  };
  return names[biome];
}
