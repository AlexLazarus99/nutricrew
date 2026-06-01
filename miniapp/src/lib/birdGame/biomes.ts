import { biomePalette, type BiomeId, isCityLevel } from "./progression";

type BiomeDrawCtx = {
  width: number;
  height: number;
  elapsed: number;
  groundY: number;
  floorY: number;
  treeGroundY: number;
  seaBlend: number;
  night: number;
};

export function biomeOverridesSea(biome: BiomeId): boolean {
  return (
    biome === "underwater" ||
    biome === "desert" ||
    biome === "oasis" ||
    biome === "antarctica" ||
    biome === "jungle" ||
    biome === "mountains"
  );
}

export function effectiveSeaBlend(biome: BiomeId, scoreBlend: number, level: number): number {
  if (isCityLevel(level)) return 0;
  if (biome === "underwater") return 1;
  if (biomeOverridesSea(biome)) return biome === "oasis" ? 0.35 : 0;
  return scoreBlend;
}

export function drawBiomeBackdrop(ctx: CanvasRenderingContext2D, biome: BiomeId, c: BiomeDrawCtx): void {
  const pal = biomePalette(biome);
  const scroll = (c.elapsed * 0.018) % 240;

  if (biome === "desert" || biome === "oasis") {
    ctx.fillStyle = biome === "desert" ? "rgba(255,193,7,0.22)" : "rgba(129,199,132,0.18)";
    for (let i = -1; i < 6; i++) {
      const dx = i * 180 - scroll;
      ctx.beginPath();
      ctx.moveTo(dx, c.groundY);
      ctx.quadraticCurveTo(dx + 60, c.groundY - 28, dx + 120, c.groundY);
      ctx.quadraticCurveTo(dx + 90, c.groundY - 12, dx + 60, c.groundY);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (biome === "oasis") {
    ctx.fillStyle = "rgba(38,198,218,0.35)";
    ctx.beginPath();
    ctx.ellipse(c.width * 0.72, c.groundY + 8, 70, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#388E3C";
    for (let i = 0; i < 4; i++) {
      const px = c.width * 0.62 + i * 28;
      ctx.fillRect(px, c.groundY - 48, 8, 48);
      ctx.beginPath();
      ctx.arc(px + 4, c.groundY - 52, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (biome === "antarctica") {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    for (let i = 0; i < 5; i++) {
      const ix = ((i * 140 - scroll * 0.5) % (c.width + 100)) - 30;
      ctx.beginPath();
      ctx.moveTo(ix, c.groundY);
      ctx.lineTo(ix + 50, c.groundY - 40 - (i % 2) * 20);
      ctx.lineTo(ix + 100, c.groundY);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (biome === "jungle") {
    ctx.fillStyle = "rgba(27,94,32,0.35)";
    for (let i = 0; i < 8; i++) {
      const jx = (i * 55 + scroll * 0.3) % (c.width + 40);
      ctx.beginPath();
      ctx.moveTo(jx, c.groundY);
      ctx.lineTo(jx + 18, c.groundY - 80 - (i % 3) * 15);
      ctx.lineTo(jx + 36, c.groundY);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (biome === "mountains") {
    ctx.fillStyle = pal.farMountains;
    for (let i = 0; i < 7; i++) {
      const mx = ((i * 110 - scroll * 0.4) % (c.width + 80)) - 20;
      ctx.beginPath();
      ctx.moveTo(mx, c.groundY);
      ctx.lineTo(mx + 55, c.groundY - 70 - (i % 3) * 25);
      ctx.lineTo(mx + 110, c.groundY);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (biome === "underwater") {
    ctx.fillStyle = "rgba(0,188,212,0.12)";
    for (let i = 0; i < 12; i++) {
      const bx = (i * 47 + c.elapsed * 0.02) % c.width;
      const by = c.floorY - 20 - (i * 13) % (c.height * 0.5);
      const br = 3 + (i % 4);
      ctx.globalAlpha = 0.35 + (i % 3) * 0.15;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#00897B";
    for (let i = 0; i < 6; i++) {
      const cx = (i * 90 + 20) % c.width;
      ctx.beginPath();
      ctx.moveTo(cx, c.floorY);
      ctx.quadraticCurveTo(cx + 8, c.floorY - 30, cx + 16, c.floorY);
      ctx.fill();
    }
  }

  if (biome === "desert") {
    ctx.fillStyle = "#558B2F";
    for (let i = 0; i < 5; i++) {
      const cx = (i * 95 + 30) % c.width;
      ctx.fillRect(cx, c.groundY - 36, 10, 36);
      ctx.beginPath();
      ctx.arc(cx + 5, c.groundY - 40, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export function drawBiomeForeground(ctx: CanvasRenderingContext2D, biome: BiomeId, c: BiomeDrawCtx): void {
  if (biome === "jungle") {
    ctx.fillStyle = "rgba(27,94,32,0.55)";
    for (let side = 0; side < 2; side++) {
      for (let i = 0; i < 6; i++) {
        const x = side === 0 ? i * 18 : c.width - i * 18 - 30;
        ctx.beginPath();
        ctx.moveTo(x, c.groundY);
        ctx.quadraticCurveTo(x + (side === 0 ? 40 : -40), c.groundY - 120, x + (side === 0 ? 80 : -80), c.groundY);
        ctx.fill();
      }
    }
    ctx.strokeStyle = "rgba(56,142,60,0.6)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(c.width * 0.2 + i * 60, 0);
      ctx.quadraticCurveTo(c.width * 0.35 + i * 40, c.height * 0.35, c.width * 0.5, c.groundY - 20);
      ctx.stroke();
    }
  }

  if (biome === "underwater") {
    const t = c.elapsed * 0.001;
    ctx.strokeStyle = "rgba(179,229,252,0.25)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      for (let y = 0; y < c.height; y += 8) {
        const x = c.width * (0.15 + i * 0.14) + Math.sin(y * 0.02 + t + i) * 12;
        if (y === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  if (biome === "antarctica") {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    for (let i = 0; i < 20; i++) {
      const sx = (i * 37 + c.elapsed * 0.04) % c.width;
      const sy = (i * 23 + c.elapsed * 0.06) % (c.groundY - 20);
      ctx.fillRect(sx, sy, 2, 2);
    }
  }
}

export function drawDiveSuitBird(
  ctx: CanvasRenderingContext2D,
  r: number,
  flapAnim: number,
): void {
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.35, r * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#0277BD";
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = "#0288D1";
  ctx.beginPath();
  ctx.arc(r * 0.35, -r * 0.15, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(179,229,252,0.65)";
  ctx.beginPath();
  ctx.arc(r * 0.38, -r * 0.15, r * 0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#37474F";
  ctx.fillRect(-r * 0.55, -r * 0.55, r * 0.22, r * 0.35);
  ctx.strokeStyle = "#78909C";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-r * 0.44, -r * 0.2);
  ctx.quadraticCurveTo(-r * 0.75, -r * 0.05, -r * 0.85, r * 0.35);
  ctx.stroke();

  ctx.fillStyle = "#FFD54F";
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, (flapAnim > 0 ? -0.6 : 0.2) * r * 0.3, r * 0.45, r * 0.28, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#FF8F00";
  ctx.beginPath();
  ctx.moveTo(r * 0.9, 0);
  ctx.lineTo(r * 1.35, r * 0.08);
  ctx.lineTo(r * 0.9, r * 0.18);
  ctx.closePath();
  ctx.fill();
}
