/** Six macro-worlds — structure inspired by classic mini-runner adventures; original names & art. */
export type WorldTheme = {
  id: string;
  nameKey: string;
  defaultName: string;
  accent: string;
  skyTop: string;
  skyBottom: string;
  haze: string;
  ground: string;
  foliage: string;
  landTop: string;
  landMid: string;
  landBot: string;
  landSoil: string;
  grass: string;
  night: number;
  regularLevels: number;
  isBonus?: boolean;
};

export const PIP_WORLDS: WorldTheme[] = [
  {
    id: "brook",
    nameKey: "nutriRun.worlds.brook",
    defaultName: "Crystal Brook",
    accent: "#4FC3F7",
    skyTop: "#E1F5FE",
    skyBottom: "#81D4FA",
    haze: "rgba(129,212,250,0.45)",
    ground: "#66BB6A",
    foliage: "#2E7D32",
    landTop: "#7CB342",
    landMid: "#558B2F",
    landBot: "#33691E",
    landSoil: "#4E342E",
    grass: "#8BC34A",
    night: 0,
    regularLevels: 8,
  },
  {
    id: "tunnel",
    nameKey: "nutriRun.worlds.tunnel",
    defaultName: "Root Tunnel",
    accent: "#FFB74D",
    skyTop: "#3E2723",
    skyBottom: "#5D4037",
    haze: "rgba(93,64,55,0.5)",
    ground: "#6D4C41",
    foliage: "#4E342E",
    landTop: "#8D6E63",
    landMid: "#6D4C41",
    landBot: "#5D4037",
    landSoil: "#3E2723",
    grass: "#689F38",
    night: 0.35,
    regularLevels: 8,
  },
  {
    id: "marsh",
    nameKey: "nutriRun.worlds.marsh",
    defaultName: "Fog Marsh",
    accent: "#26A69A",
    skyTop: "#E0F2F1",
    skyBottom: "#80CBC4",
    haze: "rgba(128,203,196,0.5)",
    ground: "#558B2F",
    foliage: "#33691E",
    landTop: "#689F38",
    landMid: "#558B2F",
    landBot: "#33691E",
    landSoil: "#3E2723",
    grass: "#9CCC65",
    night: 0.1,
    regularLevels: 8,
  },
  {
    id: "heartwood",
    nameKey: "nutriRun.worlds.heartwood",
    defaultName: "Old Heartwood",
    accent: "#A1887F",
    skyTop: "#4E342E",
    skyBottom: "#6D4C41",
    haze: "rgba(78,52,46,0.55)",
    ground: "#5D4037",
    foliage: "#3E2723",
    landTop: "#795548",
    landMid: "#5D4037",
    landBot: "#4E342E",
    landSoil: "#3E2723",
    grass: "#558B2F",
    night: 0.25,
    regularLevels: 8,
  },
  {
    id: "canopy",
    nameKey: "nutriRun.worlds.canopy",
    defaultName: "Canopy Garden",
    accent: "#AB47BC",
    skyTop: "#F3E5F5",
    skyBottom: "#CE93D8",
    haze: "rgba(206,147,216,0.4)",
    ground: "#43A047",
    foliage: "#7B1FA2",
    landTop: "#8BC34A",
    landMid: "#689F38",
    landBot: "#558B2F",
    landSoil: "#4E342E",
    grass: "#AED581",
    night: 0,
    regularLevels: 8,
  },
  {
    id: "glade",
    nameKey: "nutriRun.worlds.glade",
    defaultName: "Star Glade",
    accent: "#FFD54F",
    skyTop: "#0D1642",
    skyBottom: "#283593",
    haze: "rgba(57,73,171,0.55)",
    ground: "#7E57C2",
    foliage: "#5E35B1",
    landTop: "#9575CD",
    landMid: "#7E57C2",
    landBot: "#5E35B1",
    landSoil: "#4527A0",
    grass: "#B39DDB",
    night: 0.85,
    regularLevels: 2,
    isBonus: true,
  },
];

export function stageCount(world: number): number {
  const w = PIP_WORLDS[world];
  if (!w) return 9;
  return w.regularLevels + 1;
}

export function isBossStage(world: number, stage: number): boolean {
  const w = PIP_WORLDS[world];
  if (!w) return false;
  return stage === w.regularLevels + 1;
}

export function levelTarget(world: number, stage: number, isBoss: boolean): number {
  if (isBoss) return 320 + world * 80;
  return 120 + world * 70 + stage * 55;
}

export function stageDifficulty(world: number, stage: number): number {
  const boss = isBossStage(world, stage) ? 0.25 : 0;
  return 1 + world * 0.1 + (stage - 1) * 0.07 + boss;
}

export function moteGoal(world: number, stage: number): number {
  return 6 + world + Math.floor(stage / 2);
}
