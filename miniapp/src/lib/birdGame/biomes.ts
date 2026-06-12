import { drawBiomeParallaxBackdrop } from "./biomeBackdrops";
import type { BiomeId } from "./progression";

type BiomeDrawCtx = {
  width: number;
  height: number;
  elapsed: number;
  worldScroll: number;
  groundY: number;
  floorY: number;
  treeGroundY: number;
  night: number;
};

export function drawBiomeBackdrop(ctx: CanvasRenderingContext2D, biome: BiomeId, c: BiomeDrawCtx): void {
  drawBiomeParallaxBackdrop(ctx, biome, {
    width: c.width,
    height: c.height,
    elapsed: c.elapsed,
    worldScroll: c.worldScroll,
    groundY: c.groundY,
    night: c.night,
  });
}

export function drawBiomeForeground(ctx: CanvasRenderingContext2D, biome: BiomeId, c: BiomeDrawCtx): void {
  const night = 1 - c.night * 0.35;

  if (biome === "meadow" || biome === "forest") {
    ctx.save();
    ctx.globalAlpha = (biome === "forest" ? 0.42 : 0.32) * night;
    ctx.fillStyle = biome === "forest" ? "rgba(27,94,32,0.55)" : "rgba(58,110,95,0.4)";
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < 5; i++) {
        const x = side === 0 ? i * 22 : c.width - i * 22 - 36;
        ctx.beginPath();
        ctx.moveTo(x, c.groundY);
        ctx.quadraticCurveTo(
          x + (side === 0 ? 50 : -50),
          c.groundY - 100 - i * 8,
          x + (side === 0 ? 95 : -95),
          c.groundY,
        );
        ctx.fill();
      }
    }
    ctx.restore();
  }

  if (biome === "jungle" || biome === "forest") {
    ctx.save();
    ctx.globalAlpha = 0.45 * night;
    ctx.strokeStyle = "rgba(56,142,60,0.55)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(c.width * 0.15 + i * 55, 0);
      ctx.quadraticCurveTo(
        c.width * 0.3 + i * 38,
        c.height * 0.32,
        c.width * 0.48 + i * 20,
        c.groundY - 18,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  if (biome === "desert" || biome === "oasis") {
    ctx.save();
    ctx.globalAlpha = 0.28 * night;
    ctx.fillStyle = "rgba(255,224,130,0.35)";
    for (let i = 0; i < 4; i++) {
      const hx = ((i * 90 + c.worldScroll * 0.15) % (c.width + 50)) - 10;
      ctx.beginPath();
      ctx.ellipse(hx, c.groundY - 20 - i * 6, 45, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (biome === "mountains") {
    ctx.save();
    ctx.globalAlpha = 0.35 * night;
    ctx.fillStyle = "rgba(176,190,197,0.4)";
    for (let i = 0; i < 4; i++) {
      const px = ((i * 110 - c.worldScroll * 0.2) % (c.width + 60)) + 10;
      ctx.beginPath();
      ctx.moveTo(px, c.groundY);
      ctx.lineTo(px + 30, c.groundY - 45 - i * 10);
      ctx.lineTo(px + 60, c.groundY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  if (biome === "antarctica") {
    ctx.save();
    ctx.globalAlpha = 0.65 * night;
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    for (let i = 0; i < 24; i++) {
      const sx = (i * 37 + c.elapsed * 0.04) % c.width;
      const sy = (i * 23 + c.elapsed * 0.055) % (c.groundY - 24);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2 + (i % 3) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
