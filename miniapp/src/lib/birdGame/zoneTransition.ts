import {
  BIOME_LEVEL_SPAN,
  WORLD_CYCLE,
  biomeForBlock,
  biomeForLevel,
  biomePalette,
  cityForBlock,
  cityForLevel,
  worldBlockIndex,
  type BiomeId,
  type BiomePalette,
  type CityId,
} from "./progression";

/** Половина окна перехода в позициях цикла (уровень ≈ каждые 3 очка). */
export const ZONE_BLEND_SPAN = 7;

export type ZoneVisual = {
  /** 1 — природа, 0 — город. */
  natureWeight: number;
  naturePalette: BiomePalette;
  biome: BiomeId;
  prevBiome: BiomeId | null;
  biomeDecorBlend: number;
  city: CityId | null;
  prevCity: CityId | null;
  cityBlend: number;
  visualCity: boolean;
  inTransition: boolean;
};

function smoothstep(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

function wrapCyclePos(pos: number): number {
  const w = WORLD_CYCLE;
  let p = pos % w;
  if (p < 0) p += w;
  return p;
}

/** Непрерывная позиция в цикле мира [0, WORLD_CYCLE). */
export function cyclePos(level: number, score: number): number {
  const frac = (score % 3) / 3;
  return wrapCyclePos(level - 1 + frac);
}

function cyclicDistToNatureStart(pos: number): number {
  return Math.min(pos, WORLD_CYCLE - pos);
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function lerpRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

function lerpColor(a: string, b: string, t: number): string {
  const [r, g, bl] = lerpRgb(parseHex(a), parseHex(b), t);
  return `rgb(${r},${g},${bl})`;
}

export function lerpBiomePalette(a: BiomePalette, b: BiomePalette, t: number): BiomePalette {
  const k = Math.max(0, Math.min(1, t));
  return {
    skyTop: lerpColor(a.skyTop, b.skyTop, k),
    skyMid: lerpColor(a.skyMid, b.skyMid, k),
    skyBot: lerpColor(a.skyBot, b.skyBot, k),
    landTop: lerpColor(a.landTop, b.landTop, k),
    landMid: lerpColor(a.landMid, b.landMid, k),
    landBot: lerpColor(a.landBot, b.landBot, k),
    landSoil: lerpColor(a.landSoil, b.landSoil, k),
    waterTop: lerpColor(a.waterTop, b.waterTop, k),
    waterMid: lerpColor(a.waterMid, b.waterMid, k),
    waterBot: lerpColor(a.waterBot, b.waterBot, k),
    farMountains: lerpColor(a.farMountains, b.farMountains, k),
    grass: lerpColor(a.grass, b.grass, k),
  };
}

export function computeZoneVisual(level: number, score: number): ZoneVisual {
  const pos = cyclePos(level, score);
  const half = ZONE_BLEND_SPAN;
  const block = worldBlockIndex(level);
  const biome = biomeForLevel(level);
  const city = cityForLevel(level);

  let natureWeight = 1;

  if (pos < BIOME_LEVEL_SPAN) {
    const distToCity = BIOME_LEVEL_SPAN - pos;
    if (distToCity < half) {
      natureWeight = smoothstep(distToCity / half);
    }
  } else {
    const distToNature = cyclicDistToNatureStart(pos);
    if (distToNature < half) {
      natureWeight = smoothstep(1 - distToNature / half);
    } else {
      natureWeight = 0;
    }
  }

  let prevBiome: BiomeId | null = null;
  let biomeDecorBlend = 0;
  let naturePalette = biomePalette(biome);

  const nearNatureStart = cyclicDistToNatureStart(pos) < half;
  const inCityZone = pos >= BIOME_LEVEL_SPAN;

  if (nearNatureStart && (inCityZone || (pos < half && block > 0))) {
    const dist = cyclicDistToNatureStart(pos);
    biomeDecorBlend = smoothstep(1 - dist / half);
    const fromBiome = inCityZone ? biomeForBlock(block) : biomeForBlock(block - 1);
    const toBiome = inCityZone ? biomeForBlock(block + 1) : biomeForBlock(block);
    prevBiome = fromBiome;
    naturePalette = lerpBiomePalette(biomePalette(fromBiome), biomePalette(toBiome), biomeDecorBlend);
  }

  let prevCity: CityId | null = null;
  let cityBlend = 1;
  if (block > 0 && pos >= BIOME_LEVEL_SPAN && pos < BIOME_LEVEL_SPAN + half) {
    prevCity = cityForBlock(block - 1);
    cityBlend = smoothstep((pos - BIOME_LEVEL_SPAN) / half);
  }

  /** Городской вид только когда город уже активен в прогрессии (не при подходе к городу). */
  const visualCity = city != null && natureWeight < 0.42;
  const inTransition =
    city != null && natureWeight > 0.04 && natureWeight < 0.96;

  return {
    natureWeight,
    naturePalette,
    biome,
    prevBiome,
    biomeDecorBlend,
    city,
    prevCity,
    cityBlend,
    visualCity,
    inTransition,
  };
}
