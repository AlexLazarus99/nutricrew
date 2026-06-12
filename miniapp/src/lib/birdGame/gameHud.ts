import { biomeDisplayName, biomeForLevel, cityDisplayName, cityForLevel, isCityLevel } from "./progression";
import type { GameState } from "./types";

export type ZoneHud = {
  zoneKey: string;
  zoneFallback: string;
  isCity: boolean;
};

export function zoneHudForLevel(level: number): ZoneHud {
  if (isCityLevel(level)) {
    const city = cityForLevel(level);
    return {
      zoneKey: city ? `game.cities.${city}` : "game.zoneCity",
      zoneFallback: city ? cityDisplayName(city) : "City",
      isCity: true,
    };
  }
  const biome = biomeForLevel(level);
  return {
    zoneKey: `game.biomes.${biome}`,
    zoneFallback: biomeDisplayName(biome),
    isCity: false,
  };
}

export function ghostSecondsLeft(state: GameState): number {
  if (state.elapsed >= state.ghostUntil) return 0;
  return Math.ceil((state.ghostUntil - state.elapsed) / 1000);
}

export function nitroActive(state: GameState): boolean {
  return state.elapsed < state.speedBoostUntil;
}

export function bossTreesUntil(state: GameState): number | null {
  const milestone = Math.ceil(state.level / 100) * 100;
  if (milestone <= state.level) return state.animalBoss ? 0 : null;
  const treesNeeded = Math.max(0, (milestone - state.level) * 3);
  return treesNeeded;
}

export function drawCanvasHud(ctx: CanvasRenderingContext2D, state: GameState, zoneLabel: string): void {
  if (state.phase !== "playing") return;

  const w = state.width;
  const pad = 10;
  const barW = 88;
  const barH = 7;

  ctx.save();
  ctx.font = "bold 11px Manrope, sans-serif";

  // Nutrition bar
  const nut = Math.min(100, Math.max(0, state.bird.nutrition));
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(pad, pad, barW, barH);
  const grad = ctx.createLinearGradient(pad, 0, pad + barW, 0);
  grad.addColorStop(0, "#FF8A65");
  grad.addColorStop(0.55, "#AED581");
  grad.addColorStop(1, "#4CAF50");
  ctx.fillStyle = grad;
  ctx.fillRect(pad, pad, (barW * nut) / 100, barH);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.fillText(`${Math.round(nut)}%`, pad + barW + 6, pad + barH - 1);

  // Ghost timer
  const ghostSec = ghostSecondsLeft(state);
  if (ghostSec > 0) {
    ctx.fillStyle = "rgba(103, 58, 183, 0.85)";
    ctx.fillRect(pad, pad + 14, barW, barH);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(pad, pad + 14, (barW * ghostSec) / 10, barH);
    ctx.fillStyle = "#E1BEE7";
    ctx.fillText(`👻 ${ghostSec}s`, pad, pad + 32);
  }

  // Nitro stacks
  if (nitroActive(state) && state.nitroStacks > 0) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#FF6D00";
    ctx.fillText(`🔥×${state.nitroStacks}`, w - pad, pad + barH);
  }

  // Bird boost shield
  if (state.birdBoostHits > 0) {
    ctx.textAlign = "right";
    ctx.fillStyle = "#29B6F6";
    ctx.fillText(`🛡×${state.birdBoostHits}`, w - pad, pad + (nitroActive(state) ? 26 : 14));
  }

  // Zone
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  const zoneText = zoneLabel.slice(0, 18);
  ctx.strokeText(zoneText, w * 0.5, 22);
  ctx.fillText(zoneText, w * 0.5, 22);

  // Boss warning
  if (state.animalBoss) {
    ctx.fillStyle = "#FF5252";
    ctx.font = "bold 12px Manrope, sans-serif";
    ctx.fillText("⚠ BOSS", w * 0.5, 38);
  } else {
    const until = bossTreesUntil(state);
    if (until != null && until <= 9 && until > 0) {
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "10px Manrope, sans-serif";
      ctx.fillText(`BOSS ~${until}`, w * 0.5, 36);
    }
  }

  ctx.restore();
}

export function drawGhostOpponent(ctx: CanvasRenderingContext2D, state: GameState): void {
  const duel = state.ghostDuel;
  if (!duel?.samples.length || state.phase !== "playing") return;

  const bx = state.width * 0.26;
  let sample = duel.samples[0]!;
  for (const s of duel.samples) {
    if (s.t <= state.elapsed) sample = s;
    else break;
  }

  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = "#B388FF";
  ctx.beginPath();
  ctx.ellipse(bx - 28, sample.y, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "#fff";
  ctx.font = "9px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(duel.name.slice(0, 10), bx - 28, sample.y - 18);
  ctx.restore();
}
