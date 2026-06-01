import { type CityId, cityDisplayName, cityPalette } from "./progression";

export type CityDrawCtx = {
  width: number;
  height: number;
  elapsed: number;
  worldScroll: number;
  /** линия земли — низ зданий и достопримечательностей */
  groundY: number;
  /** нижняя граница экрана / пол */
  floorY: number;
  night: number;
};

function buildingFill(night: number, base: string, hi: string): string {
  return night > 0.45 ? hi : base;
}

/** Асфальт и тротуар на уровне пола */
export function drawCityGround(ctx: CanvasRenderingContext2D, city: CityId, c: CityDrawCtx): void {
  const pal = cityPalette(city);
  const { width: w, height: h, groundY, floorY } = c;

  const g = ctx.createLinearGradient(0, groundY, 0, h);
  g.addColorStop(0, pal.groundTop);
  g.addColorStop(0.35, pal.groundMid);
  g.addColorStop(1, pal.groundBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, groundY, w, h - groundY);

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(0, groundY, w, 3);
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, groundY + 8);
    ctx.lineTo(x + 24, groundY + 8);
    ctx.stroke();
  }

  ctx.fillStyle = pal.groundBot;
  ctx.fillRect(0, floorY - 4, w, h - floorY + 4);
}

function drawRectBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  gy: number,
  bw: number,
  bh: number,
  fill: string,
  night: number,
): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, gy - bh, bw, bh);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(x + 2, gy - bh + 2, bw - 4, Math.min(8, bh * 0.08));
  if (night > 0.35) {
    ctx.fillStyle = `rgba(255,235,59,${0.25 + night * 0.35})`;
    const cols = Math.max(1, Math.floor(bw / 10));
    const rows = Math.max(2, Math.floor(bh / 14));
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if ((row + col) % 2 === 0) {
          ctx.fillRect(x + 4 + col * 10, gy - bh + 8 + row * 14, 5, 7);
        }
      }
    }
  }
}

function drawSkylineLayer(
  ctx: CanvasRenderingContext2D,
  c: CityDrawCtx,
  city: CityId,
  layerOffset: number,
  alpha: number,
  heightScale: number,
): void {
  const pal = cityPalette(city);
  const fill = buildingFill(c.night, pal.building, pal.buildingHi);
  const gy = Math.round(c.groundY);
  ctx.globalAlpha = alpha;

  let bx = -layerOffset;
  while (bx < c.width + 40) {
    const ix = Math.floor(bx);
    const bw = 22 + ((ix * 7) % 28);
    const bh = Math.floor((38 + ((ix * 13) % 90)) * heightScale);
    drawRectBuilding(ctx, ix, gy, bw, bh, fill, c.night);
    bx += bw + 6 + ((ix * 3) % 12);
  }
  ctx.globalAlpha = 1;
}

function landmarkHeight(c: CityDrawCtx): number {
  return Math.min(250, (c.groundY - 18) * 0.84);
}

function drawLandmarkShadow(ctx: CanvasRenderingContext2D, cx: number, gy: number, spread: number): void {
  const g = ctx.createRadialGradient(cx, gy + 2, 2, cx, gy + 2, spread);
  g.addColorStop(0, "rgba(0,0,0,0.22)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, gy + 3, spread, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawParisTreeRow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  gy: number,
  treeH: number,
): void {
  const step = Math.max(14, (x1 - x0) / 5);
  for (let x = x0; x <= x1; x += step) {
    ctx.fillStyle = "#33691E";
    ctx.beginPath();
    ctx.moveTo(x, gy - treeH);
    ctx.lineTo(x - treeH * 0.34, gy - treeH * 0.2);
    ctx.lineTo(x + treeH * 0.34, gy - treeH * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5D4037";
    ctx.fillRect(x - 1.5, gy - treeH * 0.2, 3, treeH * 0.2);
  }
}

function drawParisGreenLawns(
  ctx: CanvasRenderingContext2D,
  cx: number,
  gy: number,
  h: number,
  side: "left" | "right",
): void {
  const sign = side === "left" ? -1 : 1;
  const xStart = cx + sign * h * 0.34;
  const xEnd = cx + sign * h * 1.05;
  const left = Math.min(xStart, xEnd);
  const width = Math.abs(xEnd - xStart);

  const lawn = ctx.createLinearGradient(left, gy - h * 0.04, left, gy);
  lawn.addColorStop(0, "#689F38");
  lawn.addColorStop(0.45, "#558B2F");
  lawn.addColorStop(1, "#33691E");
  ctx.fillStyle = lawn;
  ctx.fillRect(left, gy - h * 0.035, width, h * 0.035);

  ctx.fillStyle = "rgba(255,255,255,0.14)";
  const pathY = gy - h * 0.012;
  ctx.fillRect(left + width * 0.18, pathY, width * 0.64, h * 0.006);

  const treeY = gy - h * 0.035;
  drawParisTreeRow(ctx, left + width * 0.08, left + width * 0.92, treeY, h * 0.055);
}

function drawArcDeTriomphe(ctx: CanvasRenderingContext2D, ax: number, gy: number, h: number): void {
  const aw = h * 0.34;
  const ah = h * 0.28;

  drawLandmarkShadow(ctx, ax, gy, aw * 0.55);

  const stone = ctx.createLinearGradient(ax, gy - ah, ax, gy);
  stone.addColorStop(0, "#D7CBB8");
  stone.addColorStop(0.45, "#B8AA94");
  stone.addColorStop(1, "#8D8070");

  ctx.fillStyle = stone;
  ctx.fillRect(ax - aw * 0.5, gy - ah, aw, ah);

  ctx.fillStyle = "#6D6358";
  ctx.fillRect(ax - aw * 0.44, gy - ah * 0.92, aw * 0.88, ah * 0.1);
  ctx.fillRect(ax - aw * 0.38, gy - ah * 0.18, aw * 0.76, ah * 0.12);

  ctx.fillStyle = "#2A2520";
  ctx.beginPath();
  ctx.moveTo(ax - aw * 0.17, gy);
  ctx.lineTo(ax - aw * 0.13, gy - ah * 0.58);
  ctx.quadraticCurveTo(ax, gy - ah * 0.72, ax + aw * 0.13, gy - ah * 0.58);
  ctx.lineTo(ax + aw * 0.17, gy);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = stone;
  ctx.fillRect(ax - aw * 0.5, gy - ah, aw * 0.11, ah);
  ctx.fillRect(ax + aw * 0.39, gy - ah, aw * 0.11, ah);

  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  for (const ox of [-0.34, 0.34]) {
    ctx.beginPath();
    ctx.moveTo(ax + aw * ox, gy - ah * 0.95);
    ctx.lineTo(ax + aw * ox, gy - ah * 0.2);
    ctx.stroke();
  }

  ctx.fillStyle = "#FDD835";
  ctx.beginPath();
  ctx.moveTo(ax, gy - ah * 1.02);
  ctx.lineTo(ax - aw * 0.045, gy - ah * 0.94);
  ctx.lineTo(ax + aw * 0.045, gy - ah * 0.94);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#33691E";
  ctx.fillRect(ax - aw * 0.62, gy - h * 0.02, aw * 1.24, h * 0.02);
}

function drawEiffel(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const baseW = h * 0.5;

  const legX = (t: number, side: -1 | 1): number => {
    const splay = (1 - t) ** 1.65 * baseW * 0.52;
    const pinch = t > 0.355 ? (t - 0.355) ** 1.2 * baseW * 0.44 : 0;
    return cx + side * Math.max(baseW * 0.018, splay - pinch);
  };
  const legY = (t: number): number => gy - h * t;

  const ironLight = ctx.createLinearGradient(cx - baseW, gy - h, cx + baseW * 0.2, gy);
  ironLight.addColorStop(0, "#C9BCA8");
  ironLight.addColorStop(0.35, "#9A8E7E");
  ironLight.addColorStop(0.65, "#73695E");
  ironLight.addColorStop(1, "#4A433C");

  const ironShade = ctx.createLinearGradient(cx + baseW * 0.1, gy - h, cx - baseW, gy);
  ironShade.addColorStop(0, "#8A7D6E");
  ironShade.addColorStop(1, "#3E3832");

  ctx.fillStyle = "#4E7A38";
  ctx.beginPath();
  ctx.moveTo(cx - baseW * 0.56, gy);
  ctx.lineTo(cx - baseW * 0.48, gy - h * 0.018);
  ctx.lineTo(cx + baseW * 0.48, gy - h * 0.018);
  ctx.lineTo(cx + baseW * 0.56, gy);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = ironLight;
  ctx.fillStyle = ironShade;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.lineWidth = 4.2;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(legX(0, side), legY(0));
    ctx.bezierCurveTo(
      legX(0.06, side), legY(0.06),
      legX(0.12, side), legY(0.12),
      legX(0.176, side), legY(0.176),
    );
    ctx.bezierCurveTo(
      legX(0.26, side), legY(0.26),
      legX(0.32, side), legY(0.32),
      legX(0.355, side), legY(0.355),
    );
    ctx.bezierCurveTo(
      legX(0.58, side), legY(0.58),
      legX(0.74, side), legY(0.74),
      legX(0.852, side), legY(0.852),
    );
    ctx.lineTo(cx + side * baseW * 0.016, legY(0.93));
    ctx.stroke();
  }

  ctx.lineWidth = 2.2;
  ctx.strokeStyle = ironShade;
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(legX(0, side) - side * baseW * 0.04, legY(0));
    ctx.lineTo(legX(0.176, side) - side * baseW * 0.02, legY(0.176));
    ctx.stroke();
  }

  ctx.lineWidth = 2.8;
  ctx.strokeStyle = ironLight;
  ctx.beginPath();
  ctx.moveTo(cx - baseW * 0.5, gy);
  ctx.bezierCurveTo(cx - baseW * 0.22, gy - h * 0.11, cx + baseW * 0.22, gy - h * 0.11, cx + baseW * 0.5, gy);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - baseW * 0.5, gy);
  ctx.quadraticCurveTo(cx, gy - h * 0.165, cx + baseW * 0.5, gy);
  ctx.stroke();

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = ironLight;
  for (let i = 0; i < 9; i += 1) {
    const t0 = 0.02 + i * 0.017;
    const t1 = t0 + 0.024;
    ctx.beginPath();
    ctx.moveTo(legX(t0, -1), legY(t0));
    ctx.lineTo(legX(t1, 1), legY(t1));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legX(t0, 1), legY(t0));
    ctx.lineTo(legX(t1, -1), legY(t1));
    ctx.stroke();
  }
  for (let i = 0; i < 7; i += 1) {
    const t0 = 0.19 + i * 0.022;
    const t1 = t0 + 0.026;
    ctx.beginPath();
    ctx.moveTo(legX(t0, -1), legY(t0));
    ctx.lineTo(legX(t1, 1), legY(t1));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legX(t0, 1), legY(t0));
    ctx.lineTo(legX(t1, -1), legY(t1));
    ctx.stroke();
  }
  for (let i = 0; i < 5; i += 1) {
    const t0 = 0.38 + i * 0.09;
    const t1 = t0 + 0.05;
    ctx.beginPath();
    ctx.moveTo(legX(t0, -1), legY(t0));
    ctx.lineTo(legX(t1, 1), legY(t1));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(legX(t0, 1), legY(t0));
    ctx.lineTo(legX(t1, -1), legY(t1));
    ctx.stroke();
  }

  const platforms = [
    { t: 0.176, half: baseW * 0.46, deck: 10, rail: 11 },
    { t: 0.355, half: baseW * 0.31, deck: 8, rail: 9 },
    { t: 0.852, half: baseW * 0.11, deck: 5, rail: 6 },
  ];
  for (const p of platforms) {
    const y = legY(p.t);
    ctx.fillStyle = "#3E3832";
    ctx.fillRect(cx - p.half, y - p.deck * 0.5, p.half * 2, p.deck);
    ctx.fillStyle = "#B0A090";
    ctx.fillRect(cx - p.half, y - p.deck * 0.5 - 2.5, p.half * 2, 2.5);
    ctx.strokeStyle = "#2E2924";
    ctx.lineWidth = 0.9;
    for (let rx = cx - p.half + 5; rx < cx + p.half - 3; rx += 9) {
      ctx.beginPath();
      ctx.moveTo(rx, y - p.deck * 0.5 - 2.5);
      ctx.lineTo(rx, y - p.deck * 0.5 - p.rail);
      ctx.stroke();
    }
    if (p.t < 0.4) {
      ctx.fillStyle = "rgba(90,80,70,0.55)";
      ctx.fillRect(cx - p.half * 0.22, y - p.deck * 0.5 - 1, p.half * 0.44, p.deck * 0.85);
    }
  }

  ctx.fillStyle = ironShade;
  ctx.beginPath();
  ctx.moveTo(cx, legY(1.02));
  ctx.lineTo(cx - baseW * 0.038, legY(0.93));
  ctx.lineTo(cx + baseW * 0.038, legY(0.93));
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, legY(1.08));
  ctx.lineTo(cx - baseW * 0.018, legY(1.02));
  ctx.lineTo(cx + baseW * 0.018, legY(1.02));
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#2E2924";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(cx, legY(1.08));
  ctx.lineTo(cx, legY(1.12));
  ctx.stroke();
  ctx.fillStyle = "#D32F2F";
  ctx.beginPath();
  ctx.arc(cx, legY(1.1), 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawParisLandmark(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  drawParisGreenLawns(ctx, cx, gy, h, "right");
  drawArcDeTriomphe(ctx, cx - h * 0.92, gy, h * 0.72);
  drawParisGreenLawns(ctx, cx, gy, h, "left");
  drawLandmarkShadow(ctx, cx, gy, h * 0.58);
  drawEiffel(ctx, cx, gy, h);
}

function drawSagrada(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const stone = ctx.createLinearGradient(cx, gy - h, cx, gy);
  stone.addColorStop(0, "#FFF8E1");
  stone.addColorStop(0.5, "#ECEFF1");
  stone.addColorStop(1, "#BCAAA4");
  ctx.fillStyle = stone;
  ctx.fillRect(cx - h * 0.38, gy - h * 0.44, h * 0.76, h * 0.44);
  const spires: Array<{ ox: number; ht: number; w: number; cap: string }> = [
    { ox: -0.3, ht: 0.98, w: 0.075, cap: "#66BB6A" },
    { ox: -0.14, ht: 1.14, w: 0.085, cap: "#42A5F5" },
    { ox: 0, ht: 1.32, w: 0.1, cap: "#FFD54F" },
    { ox: 0.14, ht: 1.1, w: 0.085, cap: "#EF5350" },
    { ox: 0.3, ht: 0.95, w: 0.075, cap: "#AB47BC" },
  ];
  for (const s of spires) {
    const sx = cx + h * s.ox;
    const sh = h * s.ht;
    ctx.fillStyle = stone;
    ctx.fillRect(sx - h * s.w * 0.5, gy - sh, h * s.w, sh * 0.8);
    ctx.beginPath();
    ctx.moveTo(sx - h * s.w * 0.58, gy - sh * 0.8);
    ctx.lineTo(sx, gy - sh);
    ctx.lineTo(sx + h * s.w * 0.58, gy - sh * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = s.cap;
    ctx.beginPath();
    ctx.moveTo(sx - h * s.w * 0.35, gy - sh * 0.82);
    ctx.lineTo(sx, gy - sh * 0.95);
    ctx.lineTo(sx + h * s.w * 0.35, gy - sh * 0.82);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.moveTo(cx - h * 0.34 + i * h * 0.12, gy - h * 0.44);
    ctx.lineTo(cx - h * 0.34 + i * h * 0.12, gy - h * 0.08);
    ctx.stroke();
  }
}

function drawCologneCathedral(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const stone = ctx.createLinearGradient(cx, gy - h, cx, gy);
  stone.addColorStop(0, "#9E9E9E");
  stone.addColorStop(1, "#616161");
  ctx.fillStyle = stone;
  ctx.fillRect(cx - h * 0.34, gy - h * 0.54, h * 0.68, h * 0.54);
  for (const side of [-0.24, 0.24]) {
    ctx.beginPath();
    ctx.moveTo(cx + h * side - h * 0.08, gy - h * 0.54);
    ctx.lineTo(cx + h * side, gy - h * 1.08);
    ctx.lineTo(cx + h * side + h * 0.08, gy - h * 0.54);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    for (let i = 0; i < 5; i += 1) {
      ctx.fillRect(cx + h * side - h * 0.045, gy - h * (0.6 + i * 0.09), h * 0.09, h * 0.05);
    }
    ctx.fillStyle = stone;
  }
  ctx.beginPath();
  ctx.moveTo(cx - h * 0.14, gy - h * 0.54);
  ctx.lineTo(cx, gy - h * 0.82);
  ctx.lineTo(cx + h * 0.14, gy - h * 0.54);
  ctx.fill();
}

function drawGoldenGate(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const red = ctx.createLinearGradient(cx - h, gy - h, cx + h, gy);
  red.addColorStop(0, "#B71C1C");
  red.addColorStop(0.5, "#D84315");
  red.addColorStop(1, "#BF360C");
  ctx.strokeStyle = red;
  ctx.fillStyle = red;
  ctx.lineWidth = 4.5;
  const span = h * 1.15;
  ctx.beginPath();
  ctx.moveTo(cx - span * 0.5, gy);
  ctx.quadraticCurveTo(cx, gy - h * 0.95, cx + span * 0.5, gy);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(cx - span * 0.24, gy - h * 0.42);
  ctx.lineTo(cx - span * 0.24, gy);
  ctx.moveTo(cx + span * 0.24, gy - h * 0.42);
  ctx.lineTo(cx + span * 0.24, gy);
  ctx.stroke();
  ctx.fillRect(cx - span * 0.52, gy - h * 0.06, span * 1.04, h * 0.06);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i += 1) {
    const x = cx + i * span * 0.08;
    ctx.beginPath();
    ctx.moveTo(x, gy - h * 0.38);
    ctx.quadraticCurveTo(x + span * 0.02, gy - h * 0.55, x, gy - h * 0.72);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(176,190,197,0.55)";
  ctx.fillRect(cx - span * 0.54, gy - h * 0.02, span * 0.08, h * 0.12);
  ctx.fillRect(cx + span * 0.46, gy - h * 0.02, span * 0.08, h * 0.12);
}

function drawOperaHouse(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const base = ctx.createLinearGradient(cx, gy - h * 0.15, cx, gy);
  base.addColorStop(0, "#ECEFF1");
  base.addColorStop(1, "#B0BEC5");
  ctx.fillStyle = base;
  ctx.fillRect(cx - h * 0.58, gy - h * 0.14, h * 1.16, h * 0.14);
  const shells = [-0.38, -0.12, 0.14, 0.38];
  shells.forEach((o, i) => {
    const shell = ctx.createLinearGradient(cx + h * o, gy - h * 0.7, cx + h * o, gy);
    shell.addColorStop(0, "#FFFFFF");
    shell.addColorStop(0.55, "#F5F5F5");
    shell.addColorStop(1, "#CFD8DC");
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.moveTo(cx + h * o - h * 0.11, gy - h * 0.14);
    ctx.quadraticCurveTo(cx + h * o, gy - h * (0.68 + (i % 2) * 0.1), cx + h * o + h * 0.11, gy - h * 0.14);
    ctx.quadraticCurveTo(cx + h * o, gy - h * 0.32, cx + h * o - h * 0.11, gy - h * 0.14);
    ctx.fill();
    ctx.strokeStyle = "rgba(144,164,174,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  ctx.fillStyle = "rgba(79,195,247,0.35)";
  ctx.fillRect(cx - h * 0.62, gy - h * 0.04, h * 1.24, h * 0.05);
}

function drawPyramids(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const sand = ctx.createLinearGradient(cx - h, gy - h, cx + h, gy);
  sand.addColorStop(0, "#FFE082");
  sand.addColorStop(0.5, "#FFCA28");
  sand.addColorStop(1, "#FFB300");
  ctx.fillStyle = sand;
  const pyramids: Array<[number, number]> = [
    [-0.34, 1],
    [0.02, 0.74],
    [0.3, 0.52],
  ];
  for (const [ox, sc] of pyramids) {
    const ph = h * sc;
    const pw = ph * 0.98;
    ctx.beginPath();
    ctx.moveTo(cx + h * ox - pw * 0.5, gy);
    ctx.lineTo(cx + h * ox, gy - ph);
    ctx.lineTo(cx + h * ox + pw * 0.5, gy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(141,110,99,0.35)";
    ctx.lineWidth = 1.2;
    for (let i = 1; i < 6; i += 1) {
      ctx.beginPath();
      ctx.moveTo(cx + h * ox - pw * 0.5 + i * pw * 0.09, gy - ph * 0.04 * i);
      ctx.lineTo(cx + h * ox + pw * 0.5 - i * pw * 0.09, gy - ph * 0.04 * i);
      ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(255,213,79,0.25)";
  ctx.fillRect(cx - h * 0.55, gy - 2, h * 1.1, 4);
}

function drawColosseum(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const travertine = ctx.createLinearGradient(cx - h * 0.4, gy - h, cx + h * 0.4, gy);
  travertine.addColorStop(0, "#FFCCBC");
  travertine.addColorStop(0.5, "#FFAB91");
  travertine.addColorStop(1, "#D84315");
  ctx.fillStyle = travertine;
  ctx.beginPath();
  ctx.ellipse(cx, gy - h * 0.2, h * 0.44, h * 0.24, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(cx - h * 0.44, gy - h * 0.2, h * 0.88, h * 0.2);
  ctx.fillStyle = "rgba(78,52,46,0.28)";
  for (let row = 0; row < 4; row += 1) {
    for (let i = 0; i < 9; i += 1) {
      const ax = cx - h * 0.36 + i * h * 0.09;
      const ay = gy - h * (0.34 + row * 0.09);
      ctx.beginPath();
      ctx.arc(ax, ay, h * 0.026, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTvTower(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const shaft = ctx.createLinearGradient(cx - 8, gy - h, cx + 8, gy);
  shaft.addColorStop(0, "#B0BEC5");
  shaft.addColorStop(0.5, "#ECEFF1");
  shaft.addColorStop(1, "#78909C");
  ctx.strokeStyle = shaft;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, gy);
  ctx.lineTo(cx, gy - h);
  ctx.stroke();
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? "#E53935" : "#FFFFFF";
    ctx.fillRect(cx - 5, gy - h * (0.15 + i * 0.08), 10, h * 0.04);
  }
  const sphere = ctx.createRadialGradient(cx - h * 0.04, gy - h * 0.7, 2, cx, gy - h * 0.68, h * 0.16);
  sphere.addColorStop(0, "#ECEFF1");
  sphere.addColorStop(0.7, "#90A4AE");
  sphere.addColorStop(1, "#546E7A");
  ctx.fillStyle = sphere;
  ctx.beginPath();
  ctx.arc(cx, gy - h * 0.68, h * 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#455A64";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - h * 0.15, gy - h * 0.68);
  ctx.lineTo(cx + h * 0.15, gy - h * 0.68);
  ctx.stroke();
  ctx.fillStyle = "#37474F";
  ctx.fillRect(cx - h * 0.045, gy - h * 1.08, h * 0.09, h * 0.14);
}

function drawHallgrimskirkja(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const concrete = ctx.createLinearGradient(cx, gy - h, cx, gy);
  concrete.addColorStop(0, "#FAFAFA");
  concrete.addColorStop(1, "#CFD8DC");
  ctx.fillStyle = concrete;
  const peaks: Array<[number, number]> = [
    [-0.22, 0.92],
    [0, 1.18],
    [0.22, 0.86],
  ];
  for (const [ox, ht] of peaks) {
    ctx.beginPath();
    ctx.moveTo(cx + h * ox - h * 0.09, gy);
    ctx.lineTo(cx + h * ox, gy - h * ht);
    ctx.lineTo(cx + h * ox + h * 0.09, gy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(cx - h * 0.3, gy - h * 0.38, h * 0.6, h * 0.38);
  ctx.fillStyle = "#455A64";
  ctx.fillRect(cx - h * 0.04, gy - h * 0.55, h * 0.08, h * 0.17);
}

function drawIndiaGate(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const sandstone = ctx.createLinearGradient(cx, gy - h, cx, gy);
  sandstone.addColorStop(0, "#FFCCBC");
  sandstone.addColorStop(1, "#FF8A65");
  ctx.fillStyle = sandstone;
  ctx.fillRect(cx - h * 0.34, gy - h * 0.6, h * 0.68, h * 0.6);
  ctx.clearRect(cx - h * 0.2, gy - h * 0.5, h * 0.4, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(cx - h * 0.38, gy - h * 0.6);
  ctx.lineTo(cx, gy - h * 0.86);
  ctx.lineTo(cx + h * 0.38, gy - h * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#BF360C";
  ctx.fillRect(cx - h * 0.045, gy - h * 0.86, h * 0.09, h * 0.26);
}

function drawEmpireState(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const artDeco = ctx.createLinearGradient(cx - h * 0.2, gy - h, cx + h * 0.2, gy);
  artDeco.addColorStop(0, "#B0BEC5");
  artDeco.addColorStop(0.5, "#ECEFF1");
  artDeco.addColorStop(1, "#78909C");
  ctx.fillStyle = artDeco;
  const bw = h * 0.3;
  ctx.fillRect(cx - bw * 0.5, gy - h, bw, h);
  const tiers = [1, 0.82, 0.64, 0.46, 0.3];
  tiers.forEach((t, i) => {
    ctx.fillRect(cx - bw * 0.5 * t, gy - h * t, bw * t, h * 0.055);
    if (i < tiers.length - 1) {
      ctx.fillStyle = "rgba(69,90,100,0.35)";
      ctx.fillRect(cx - bw * 0.5 * tiers[i + 1], gy - h * tiers[i + 1], bw * tiers[i + 1], h * 0.035);
      ctx.fillStyle = artDeco;
    }
  });
  ctx.beginPath();
  ctx.moveTo(cx - bw * 0.24, gy - h);
  ctx.lineTo(cx, gy - h * 1.2);
  ctx.lineTo(cx + bw * 0.24, gy - h);
  ctx.fill();
  ctx.fillStyle = "#FFD54F";
  ctx.fillRect(cx - bw * 0.07, gy - h * 1.24, bw * 0.14, h * 0.09);
}

function drawAlmudena(ctx: CanvasRenderingContext2D, cx: number, gy: number, h: number): void {
  const stone = ctx.createLinearGradient(cx, gy - h, cx, gy);
  stone.addColorStop(0, "#ECEFF1");
  stone.addColorStop(1, "#90A4AE");
  ctx.fillStyle = stone;
  ctx.fillRect(cx - h * 0.3, gy - h * 0.48, h * 0.6, h * 0.48);
  const dome = ctx.createRadialGradient(cx, gy - h * 0.72, 4, cx, gy - h * 0.72, h * 0.32);
  dome.addColorStop(0, "#78909C");
  dome.addColorStop(1, "#455A64");
  ctx.fillStyle = dome;
  ctx.beginPath();
  ctx.moveTo(cx - h * 0.32, gy - h * 0.48);
  ctx.lineTo(cx, gy - h * 0.98);
  ctx.lineTo(cx + h * 0.32, gy - h * 0.48);
  ctx.fill();
  ctx.fillStyle = "#FFD54F";
  ctx.fillRect(cx - h * 0.065, gy - h * 0.98, h * 0.13, h * 0.2);
}

/** Крупная достопримечательность на переднем плане (рисуется поверх зданий-препятствий). */
export function drawCityLandmarkForeground(
  ctx: CanvasRenderingContext2D,
  city: CityId,
  c: CityDrawCtx,
  cx: number,
): void {
  const h = landmarkHeight(c);
  const gy = c.groundY;
  const pad = city === "paris" ? h * 1.25 : h * 0.65;
  if (cx < -pad || cx > c.width + pad) return;

  ctx.save();
  drawLandmarkShadow(ctx, cx, gy, h * 0.55);

  if (c.night > 0.35) {
    ctx.shadowColor = "rgba(255,235,59,0.35)";
    ctx.shadowBlur = 18;
  }

  switch (city) {
    case "paris":
      drawParisLandmark(ctx, cx, gy, h);
      break;
    case "barcelona":
      drawSagrada(ctx, cx, gy, h * 0.95);
      break;
    case "cologne":
      drawCologneCathedral(ctx, cx, gy, h * 0.92);
      break;
    case "san_francisco":
      drawGoldenGate(ctx, cx, gy, h * 0.88);
      break;
    case "sydney":
      drawOperaHouse(ctx, cx, gy, h * 0.82);
      break;
    case "cairo":
      drawPyramids(ctx, cx - h * 0.28, gy, h * 0.78);
      break;
    case "rome":
      drawColosseum(ctx, cx, gy, h * 0.72);
      break;
    case "berlin":
      drawTvTower(ctx, cx, gy, h);
      break;
    case "reykjavik":
      drawHallgrimskirkja(ctx, cx, gy, h * 0.9);
      break;
    case "new_delhi":
      drawIndiaGate(ctx, cx, gy, h * 0.8);
      break;
    case "new_york":
      drawEmpireState(ctx, cx, gy, h);
      break;
    case "madrid":
      drawAlmudena(ctx, cx, gy, h * 0.85);
      break;
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255,255,255,${0.82 + c.night * 0.15})`;
  ctx.font = "bold 13px Manrope, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(cityDisplayName(city), cx, gy - h * 1.02);
  ctx.restore();
}

/** Препятствие-дом вместо дерева на городских уровнях */
export function drawCityObstacleBuilding(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  width: number,
  height: number,
  city: CityId,
  night: number,
): void {
  const pal = cityPalette(city);
  const fill = buildingFill(night, pal.buildingHi, pal.building);
  drawRectBuilding(ctx, x, groundY, width, height, fill, night);
  ctx.fillStyle = pal.accent;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(x + width * 0.08, groundY - height * 0.85, width * 0.84, height * 0.08);
  ctx.globalAlpha = 1;
}

export function drawCityscape(ctx: CanvasRenderingContext2D, city: CityId, c: CityDrawCtx): void {
  drawSkylineLayer(ctx, c, city, 0, 0.28, 0.48);
  drawSkylineLayer(ctx, c, city, 18, 0.42, 0.62);
  drawSkylineLayer(ctx, c, city, 36, 0.58, 0.78);
}

export function drawCitySky(
  ctx: CanvasRenderingContext2D,
  city: CityId,
  w: number,
  h: number,
  night: number,
  warm: number,
): void {
  const pal = cityPalette(city);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  const blend = (day: string, n: number) => {
    const [r1, g1, b1] = hex(day);
    const nr = Math.round(r1 * (1 - n) + 13 * n);
    const ng = Math.round(g1 * (1 - n) + 27 * n);
    const nb = Math.round(b1 * (1 - n) + 62 * n);
    return `rgb(${nr},${ng},${nb})`;
  };
  g.addColorStop(0, blend(pal.skyTop, night * 0.85 + warm * 0.2));
  g.addColorStop(0.5, blend(pal.skyMid, night * 0.8 + warm * 0.15));
  g.addColorStop(1, blend(pal.skyBot, night * 0.75 + warm * 0.1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function hex(color: string): [number, number, number] {
  const h = color.startsWith("#") ? color.slice(1) : color;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
