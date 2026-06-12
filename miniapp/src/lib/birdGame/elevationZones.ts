/** In-run elevation segments: valley → mountain climb → dungeon. */

export type ElevationKind = "ground" | "climb" | "dungeon";

export type ElevationState = {
  kind: ElevationKind;
  nextKind: ElevationKind;
  segmentProgress: number;
  blend: number;
  floorLift: number;
  ceilingDrop: number;
  activeKind: ElevationKind;
};

export type ElevationInput = {
  score: number;
  canvasH: number;
  isCity: boolean;
  worldScroll: number;
  elapsed: number;
};

const ORDER: ElevationKind[] = ["ground", "climb", "dungeon"];
const SEGMENT_LEN = 11;
const BLEND_LEN = 4;

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

type OffsetPack = { floorLift: number; ceilingDrop: number };

function offsetsFor(kind: ElevationKind, progress: number, canvasH: number): OffsetPack {
  const h = canvasH;
  switch (kind) {
    case "climb":
      return {
        floorLift: lerp(18, Math.min(72, h * 0.14), smoothstep(progress)),
        ceilingDrop: lerp(0, 12, smoothstep(progress)),
      };
    case "dungeon":
      return {
        floorLift: lerp(0, 8, smoothstep(progress)),
        ceilingDrop: lerp(28, Math.min(88, h * 0.2), smoothstep(progress)),
      };
    default:
      return { floorLift: 0, ceilingDrop: 0 };
  }
}

function lerpOffsets(a: OffsetPack, b: OffsetPack, t: number): OffsetPack {
  const k = smoothstep(t);
  return {
    floorLift: lerp(a.floorLift, b.floorLift, k),
    ceilingDrop: lerp(a.ceilingDrop, b.ceilingDrop, k),
  };
}

const NEUTRAL: ElevationState = {
  kind: "ground",
  nextKind: "ground",
  segmentProgress: 0,
  blend: 0,
  floorLift: 0,
  ceilingDrop: 0,
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
    activeKind,
  };
}

export function elevationDisplayName(kind: ElevationKind): string {
  switch (kind) {
    case "climb":
      return "Mountain";
    case "dungeon":
      return "Dungeon";
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
  ctx.restore();
}

export function drawElevationDecor(
  ctx: CanvasRenderingContext2D,
  c: ElevationDrawCtx,
  drawDungeon?: (ctx: CanvasRenderingContext2D, c: ElevationDrawCtx) => void,
): void {
  if (c.elev.activeKind === "ground" && c.elev.blend < 0.02) return;
  if (drawDungeon) drawDungeon(ctx, c);
  drawClimbSlope(ctx, c);
}

export function elevationHudKey(kind: ElevationKind): string {
  return `game.elevations.${kind}`;
}

export function inDungeonElevation(elev: ElevationState): boolean {
  return elev.activeKind === "dungeon";
}
