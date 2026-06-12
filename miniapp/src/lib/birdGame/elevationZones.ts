/** In-run elevation segments: valley → mountain climb → dungeon → scuba depth. */

export type ElevationKind = "ground" | "climb" | "dungeon" | "scuba";

export type ElevationState = {
  kind: ElevationKind;
  nextKind: ElevationKind;
  /** 0..1 progress inside the stable part of the segment */
  segmentProgress: number;
  /** 0..1 blend toward nextKind at segment boundaries */
  blend: number;
  /** Floor rises (px) — bird must fly higher */
  floorLift: number;
  /** Ceiling lowers (px) — dungeon squeeze */
  ceilingDrop: number;
  /** 0..1 forced underwater immersion */
  scubaDepth: number;
  /** Effective kind for gameplay (accounts for blend) */
  activeKind: ElevationKind;
};

export type ElevationInput = {
  score: number;
  canvasH: number;
  isCity: boolean;
  worldScroll: number;
  elapsed: number;
};

const ORDER: ElevationKind[] = ["ground", "climb", "dungeon", "scuba"];
const SEGMENT_LEN = 11;
const BLEND_LEN = 4;

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

type OffsetPack = { floorLift: number; ceilingDrop: number; scubaDepth: number };

function offsetsFor(kind: ElevationKind, progress: number, canvasH: number): OffsetPack {
  const h = canvasH;
  switch (kind) {
    case "climb":
      return {
        floorLift: lerp(18, Math.min(72, h * 0.14), smoothstep(progress)),
        ceilingDrop: lerp(0, 12, smoothstep(progress)),
        scubaDepth: 0,
      };
    case "dungeon":
      return {
        floorLift: lerp(0, 8, smoothstep(progress)),
        ceilingDrop: lerp(28, Math.min(88, h * 0.2), smoothstep(progress)),
        scubaDepth: 0,
      };
    case "scuba":
      return {
        floorLift: 0,
        ceilingDrop: 0,
        scubaDepth: lerp(0.55, 1, smoothstep(progress)),
      };
    default:
      return { floorLift: 0, ceilingDrop: 0, scubaDepth: 0 };
  }
}

function lerpOffsets(a: OffsetPack, b: OffsetPack, t: number): OffsetPack {
  const k = smoothstep(t);
  return {
    floorLift: lerp(a.floorLift, b.floorLift, k),
    ceilingDrop: lerp(a.ceilingDrop, b.ceilingDrop, k),
    scubaDepth: lerp(a.scubaDepth, b.scubaDepth, k),
  };
}

const NEUTRAL: ElevationState = {
  kind: "ground",
  nextKind: "ground",
  segmentProgress: 0,
  blend: 0,
  floorLift: 0,
  ceilingDrop: 0,
  scubaDepth: 0,
  activeKind: "ground",
};

export function computeElevation(input: ElevationInput): ElevationState {
  if (input.isCity || input.canvasH < 80) return NEUTRAL;

  const block = SEGMENT_LEN + BLEND_LEN;
  const cycleLen = ORDER.length * block;
  const pos = ((input.score % cycleLen) + cycleLen) % cycleLen;
  const segIdx = Math.floor(pos / block);
  const local = pos % block;

  const kind = ORDER[segIdx]!;
  const nextKind = ORDER[(segIdx + 1) % ORDER.length]!;
  const segmentProgress = Math.min(1, local / SEGMENT_LEN);
  const blend = local >= SEGMENT_LEN ? (local - SEGMENT_LEN) / BLEND_LEN : 0;

  const from = offsetsFor(kind, segmentProgress, input.canvasH);
  const to = offsetsFor(nextKind, 0, input.canvasH);
  const merged = blend > 0 ? lerpOffsets(from, to, blend) : from;

  const activeKind: ElevationKind = blend > 0.5 ? nextKind : kind;

  return {
    kind,
    nextKind,
    segmentProgress,
    blend: smoothstep(blend),
    floorLift: merged.floorLift,
    ceilingDrop: merged.ceilingDrop,
    scubaDepth: merged.scubaDepth,
    activeKind,
  };
}

export function elevationDisplayName(kind: ElevationKind): string {
  switch (kind) {
    case "climb":
      return "Mountain";
    case "dungeon":
      return "Dungeon";
    case "scuba":
      return "Scuba";
    default:
      return "Valley";
  }
}

export type ElevationDrawCtx = {
  width: number;
  height: number;
  elapsed: number;
  worldScroll: number;
  floorY: number;
  ceilingY: number;
  groundY: number;
  elev: ElevationState;
  night: number;
};

/** Rocky ascending path during climb segments. */
function drawClimbSlope(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx): void {
  const w = c.width;
  const base = c.floorY + 6;
  const scroll = c.worldScroll * 0.22;
  const maxLift = Math.max(1, c.height * 0.14);
  const strength = Math.min(1, c.elev.floorLift / maxLift);
  if (strength < 0.06) return;

  ctx.save();
  ctx.globalAlpha = Math.min(1, strength * 1.1);

  const rockG = ctx.createLinearGradient(0, base - 50, 0, base + 8);
  rockG.addColorStop(0, "#8B9DA8");
  rockG.addColorStop(0.45, "#64748B");
  rockG.addColorStop(1, "#475569");
  ctx.fillStyle = rockG;
  ctx.beginPath();
  ctx.moveTo(0, base + 10);
  for (let x = 0; x <= w; x += 10) {
    const rise = Math.sin((x + scroll) * 0.018) * 8 + ((x + scroll) % 220) * 0.06;
    ctx.lineTo(x, base - rise);
  }
  ctx.lineTo(w, c.height);
  ctx.lineTo(0, c.height);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  for (let i = 0; i < 4; i++) {
    const sx = ((i * 140 - scroll * 0.5) % (w + 60)) - 20;
    const sy = base - 22 - (i % 3) * 10 - Math.sin((sx + scroll) * 0.02) * 6;
    ctx.beginPath();
    ctx.ellipse(sx + 18, sy, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Teal depth vignette for scuba segments. */
function drawScubaDepth(ctx: CanvasRenderingContext2D, c: ElevationDrawCtx): void {
  if (c.elev.scubaDepth < 0.08) return;
  const d = c.elev.scubaDepth;
  ctx.save();
  const g = ctx.createLinearGradient(0, 0, 0, c.height);
  g.addColorStop(0, `rgba(0,96,120,${0.08 * d})`);
  g.addColorStop(0.5, `rgba(0,131,143,${0.14 * d})`);
  g.addColorStop(1, `rgba(0,77,96,${0.22 * d})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);

  const t = c.elapsed * 0.001;
  ctx.globalAlpha = d * 0.35;
  ctx.strokeStyle = "rgba(179,229,252,0.3)";
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    for (let y = 0; y < c.height; y += 10) {
      const x = c.width * (0.12 + i * 0.22) + Math.sin(y * 0.018 + t + i) * 10;
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function drawElevationDecor(
  ctx: CanvasRenderingContext2D,
  c: ElevationDrawCtx,
  drawDungeon?: (ctx: CanvasRenderingContext2D, c: ElevationDrawCtx) => void,
): void {
  if (c.elev.activeKind === "ground" && c.elev.blend < 0.02 && c.elev.scubaDepth < 0.05) return;
  if (drawDungeon) drawDungeon(ctx, c);
  drawClimbSlope(ctx, c);
  drawScubaDepth(ctx, c);
}

export function elevationHudKey(kind: ElevationKind): string {
  return `game.elevations.${kind}`;
}

export function inDungeonElevation(elev: ElevationState): boolean {
  return elev.activeKind === "dungeon";
}
