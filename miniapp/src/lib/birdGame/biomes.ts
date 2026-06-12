import { drawBiomeParallaxBackdrop } from "./biomeBackdrops";
import { drawFramingTrunk, drawMossyLog, drawPurpleFlowers, phash } from "./painterly";
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
  const isGreen = biome === "meadow" || biome === "forest" || biome === "jungle" || biome === "oasis";

  if (isGreen) {
    ctx.save();
    ctx.globalAlpha = 0.85 * night;
    drawFramingTrunk(ctx, 8, c.groundY, 55, c.height * 0.55, "left");
    drawFramingTrunk(ctx, c.width - 8, c.groundY, 48, c.height * 0.5, "right");
    ctx.restore();
  }

  if (biome === "meadow" || biome === "forest" || biome === "jungle") {
    ctx.save();
    ctx.globalAlpha = 0.38 * night;
    for (let i = 0; i < 4; i++) {
      const lx = ((i * 90 + c.worldScroll * 0.25) % (c.width * 0.5)) + 60;
      if (phash(i) > 0.4) drawMossyLog(ctx, lx, c.groundY - 4, 55 + i * 8, 9);
    }
    ctx.restore();
  }

  if (biome === "meadow" || biome === "forest") {
    ctx.save();
    ctx.globalAlpha = 0.7 * night;
    for (let i = 0; i < 4; i++) {
      const fx = c.width * (0.3 + i * 0.18) + Math.sin(c.elapsed * 0.001 + i) * 10;
      drawPurpleFlowers(ctx, fx, c.groundY - 6, 1, 3 + (i % 2));
    }
    ctx.restore();
  }

  if (biome === "jungle" || biome === "forest") {
    ctx.save();
    ctx.globalAlpha = 0.4 * night;
    ctx.strokeStyle = "rgba(76,175,80,0.5)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    for (let i = 0; i < 4; i++) {
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
