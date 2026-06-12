/** Six macro-worlds — structure inspired by classic mini-runner adventures; original names & art. */
export type WorldTheme = {
  id: string;
  nameKey: string;
  defaultName: string;
  accent: string;
  skyTop: string;
  skyBottom: string;
  ground: string;
  foliage: string;
  /** Regular levels before boss */
  regularLevels: number;
  isBonus?: boolean;
};

export const PIP_WORLDS: WorldTheme[] = [
  {
    id: "brook",
    nameKey: "nutriRun.worlds.brook",
    defaultName: "Crystal Brook",
    accent: "#4FC3F7",
    skyTop: "#B3E5FC",
    skyBottom: "#81D4FA",
    ground: "#66BB6A",
    foliage: "#2E7D32",
    regularLevels: 8,
  },
  {
    id: "tunnel",
    nameKey: "nutriRun.worlds.tunnel",
    defaultName: "Root Tunnel",
    accent: "#A1887F",
    skyTop: "#5D4037",
    skyBottom: "#8D6E63",
    ground: "#6D4C41",
    foliage: "#4E342E",
    regularLevels: 8,
  },
  {
    id: "marsh",
    nameKey: "nutriRun.worlds.marsh",
    defaultName: "Fog Marsh",
    accent: "#26A69A",
    skyTop: "#B2DFDB",
    skyBottom: "#80CBC4",
    ground: "#558B2F",
    foliage: "#33691E",
    regularLevels: 8,
  },
  {
    id: "heartwood",
    nameKey: "nutriRun.worlds.heartwood",
    defaultName: "Old Heartwood",
    accent: "#8D6E63",
    skyTop: "#4E342E",
    skyBottom: "#6D4C41",
    ground: "#5D4037",
    foliage: "#3E2723",
    regularLevels: 8,
  },
  {
    id: "canopy",
    nameKey: "nutriRun.worlds.canopy",
    defaultName: "Canopy Garden",
    accent: "#AB47BC",
    skyTop: "#E1BEE7",
    skyBottom: "#CE93D8",
    ground: "#43A047",
    foliage: "#7B1FA2",
    regularLevels: 8,
  },
  {
    id: "glade",
    nameKey: "nutriRun.worlds.glade",
    defaultName: "Star Glade",
    accent: "#FFD54F",
    skyTop: "#1A237E",
    skyBottom: "#3949AB",
    ground: "#7E57C2",
    foliage: "#5E35B1",
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
