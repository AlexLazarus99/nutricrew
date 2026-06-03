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
import { lerpColorStr, sanitizeBiomePalette } from "./colorUtils.js";

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

export function lerpBiomePalette(a: BiomePalette, b: BiomePalette, t: number): BiomePalette {
  const k = Math.max(0, Math.min(1, t));
  return sanitizeBiomePalette({
    skyTop: lerpColorStr(a.skyTop, b.skyTop, k),
    skyMid: lerpColorStr(a.skyMid, b.skyMid, k),
    skyBot: lerpColorStr(a.skyBot, b.skyBot, k),
    landTop: lerpColorStr(a.landTop, b.landTop, k),
    landMid: lerpColorStr(a.landMid, b.landMid, k),
    landBot: lerpColorStr(a.landBot, b.landBot, k),
    landSoil: lerpColorStr(a.landSoil, b.landSoil, k),
    waterTop: lerpColorStr(a.waterTop, b.waterTop, k),
    waterMid: lerpColorStr(a.waterMid, b.waterMid, k),
    waterBot: lerpColorStr(a.waterBot, b.waterBot, k),
    farMountains: lerpColorStr(a.farMountains, b.farMountains, k),
    grass: lerpColorStr(a.grass, b.grass, k),
  });
}

/** City to paint during the nature→city fade (levels 44–50) before isCityLevel is true. */
function approachCityForPos(pos: number, block: number): CityId | null {
  const distToCity = BIOME_LEVEL_SPAN - pos;
  if (pos < BIOME_LEVEL_SPAN && distToCity > 0 && distToCity < ZONE_BLEND_SPAN) {
    return cityForBlock(block);
  }
  return null;
}

export function computeZoneVisual(level: number, score: number): ZoneVisual {
  const pos = cyclePos(level, score);
  const half = ZONE_BLEND_SPAN;
  const block = worldBlockIndex(level);
  const biome = biomeForLevel(level);
  const city = cityForLevel(level) ?? approachCityForPos(pos, block);

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

  const distToNatureWrap = cyclicDistToNatureStart(pos);
  const inCityZone = pos >= BIOME_LEVEL_SPAN;
  /** Биомный кроссфейд только в природной зоне (в городе ломал drawSky из-за rgb-палитры). */
  const nearNatureStart = !inCityZone && distToNatureWrap < half;

  if (nearNatureStart && pos < half && block > 0) {
    biomeDecorBlend = smoothstep(1 - distToNatureWrap / half);
    const fromBiome = biomeForBlock(block - 1);
    const toBiome = biomeForBlock(block);
    prevBiome = fromBiome;
    naturePalette = lerpBiomePalette(biomePalette(fromBiome), biomePalette(toBiome), biomeDecorBlend);
  }

  naturePalette = sanitizeBiomePalette(naturePalette);

  let prevCity: CityId | null = null;
  let cityBlend = 1;
  if (block > 0 && pos >= BIOME_LEVEL_SPAN && pos < BIOME_LEVEL_SPAN + half) {
    prevCity = cityForBlock(block - 1);
    cityBlend = smoothstep((pos - BIOME_LEVEL_SPAN) / half);
  }

  /** Городской вид только когда город уже активен в прогрессии (не при подходе к городу). */
  const visualCity = city != null && (inCityZone ? natureWeight < 0.72 : natureWeight < 0.42);
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
