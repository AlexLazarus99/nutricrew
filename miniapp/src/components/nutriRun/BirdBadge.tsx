import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;

type BirdId = "classic" | "ember" | "frost" | "neon" | "royal" | "storm";

type Props = {
  birdId: string;
  size?: number;
  className?: string;
};

const SPECS: Record<
  BirdId,
  { top: string; bot: string; wing: string; tail: string; beak: string; beakLower?: string; perk: string }
> = {
  classic: { top: "#ffd4b8", bot: "#ffab91", wing: "#ff8a65", tail: "#ff7043", beak: "#ffeb3b", beakLower: "#ffc107", perk: "classic" },
  ember: { top: "#ffccbc", bot: "#e64a19", wing: "#ff7043", tail: "#bf360c", beak: "#ffca28", perk: "ember" },
  frost: { top: "#e1f5fe", bot: "#4fc3f7", wing: "#81d4fa", tail: "#0288d1", beak: "#ffd54f", perk: "frost" },
  neon: { top: "#f8bbd0", bot: "#26c6da", wing: "#ea80fc", tail: "#00bcd4", beak: "#ffeb3b", perk: "neon" },
  royal: { top: "#fff9c4", bot: "#9575cd", wing: "#ffd54f", tail: "#7e57c2", beak: "#ffb300", perk: "royal" },
  storm: { top: "#fff59d", bot: "#5e35b1", wing: "#ffee58", tail: "#4527a0", beak: "#ffca28", perk: "storm" },
};

function smoothstep(a: number, b: number, t: number) {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
}

function wingBeatWave(cycle: number) {
  if (cycle < 0.27) return smoothstep(0, 1, cycle / 0.27);
  return 1 - smoothstep(0, 1, (cycle - 0.27) / 0.73);
}

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + amt)));
  g = Math.max(0, Math.min(255, Math.round(g + amt)));
  b = Math.max(0, Math.min(255, Math.round(b + amt)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function drawWingFeather(
  c: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  angle: number,
  length: number,
  width: number,
  color: string,
  alpha: number,
) {
  c.save();
  c.translate(ox, oy);
  c.rotate(angle);
  c.globalAlpha *= alpha;
  const rootW = width * 0.34;
  const midW = width * 0.44;
  const tipW = width * 0.05;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(length * 0.12, -rootW * 0.55);
  c.quadraticCurveTo(length * 0.48, -midW, length * 0.94, -tipW);
  c.lineTo(length, tipW * 0.65);
  c.quadraticCurveTo(length * 0.52, midW * 0.78, length * 0.16, rootW * 0.48);
  c.quadraticCurveTo(length * 0.05, rootW * 0.22, 0, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = shade(color, -32);
  c.lineWidth = Math.max(0.45, width * 0.055);
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(length * 0.97, tipW * 0.12);
  c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.2)";
  c.lineWidth = Math.max(0.35, width * 0.04);
  c.beginPath();
  c.moveTo(length * 0.18, -rootW * 0.18);
  c.quadraticCurveTo(length * 0.62, -midW * 0.52, length * 0.9, -tipW * 0.45);
  c.stroke();
  c.restore();
}

function drawBirdTail(
  c: CanvasRenderingContext2D,
  bodyW: number,
  bodyH: number,
  color: string,
  flapAmt: number,
) {
  const count = 9;
  const mid = (count - 1) / 2;
  const rootX = -bodyW * 0.56;
  const rootY = bodyH * 0.04;
  const fanOpen = 0.38 + (1 - flapAmt) * 0.16;
  c.fillStyle = shade(color, 10);
  c.beginPath();
  c.moveTo(rootX + bodyW * 0.06, rootY - bodyH * 0.06);
  c.quadraticCurveTo(rootX - bodyW * 0.28, rootY - bodyH * 0.12, rootX - bodyW * 0.42, rootY);
  c.quadraticCurveTo(rootX - bodyW * 0.28, rootY + bodyH * 0.12, rootX + bodyW * 0.06, rootY + bodyH * 0.08);
  c.closePath();
  c.fill();
  for (let i = 0; i < count; i++) {
    const off = i - mid;
    const norm = off / mid;
    const centerBoost = 1 - Math.abs(norm) * 0.28;
    const len = bodyW * (0.62 + centerBoost * 0.32);
    const ang = Math.PI + norm * fanOpen + 0.06;
    const fw = bodyH * (0.09 + centerBoost * 0.08);
    drawWingFeather(
      c,
      rootX + norm * bodyW * 0.035,
      rootY + Math.abs(norm) * bodyH * 0.02,
      ang,
      len,
      fw,
      shade(color, -10 + Math.abs(off) * 4),
      0.95,
    );
  }
}

function drawWing(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dir: number,
  flapAmt: number,
  color: string,
  wingAmp = 1.12,
  isBack = false,
) {
  const smoothFlap = smoothstep(0, 1, flapAmt);
  const beat = 1 - smoothFlap;
  c.save();
  c.translate(x, y);
  const downA = 0.52 * wingAmp;
  const upA = -0.92 * wingAmp;
  const a = -((1 - smoothFlap) * downA + smoothFlap * upA) * dir;
  c.rotate(a);
  const spread = 0.62 + beat * 0.38;
  const span = w * spread;
  const depth = h * (0.48 + beat * 0.16);
  c.globalAlpha = isBack ? 0.82 : 1;
  c.fillStyle = shade(color, 8);
  c.beginPath();
  c.ellipse(dir * w * 0.06, h * 0.02, w * 0.14, h * 0.12, dir * 0.3, 0, TAU);
  c.fill();
  const covertCount = isBack ? 4 : 5;
  for (let i = 0; i < covertCount; i++) {
    const t = covertCount > 1 ? i / (covertCount - 1) : 0;
    const ang = dir * (0.08 + t * 0.34) + dir * beat * 0.08;
    const len = span * (0.32 + t * 0.2);
    const fw = depth * (0.62 - t * 0.18);
    drawWingFeather(c, dir * w * 0.01, h * 0.08 + t * h * 0.04, ang, len, fw, shade(color, -8), 0.9);
  }
  const primCount = isBack ? 6 : 8;
  for (let i = 0; i < primCount; i++) {
    const t = primCount > 1 ? i / (primCount - 1) : 0;
    const ang = dir * (0.38 + t * 0.74) + dir * (0.12 + beat * 0.1);
    const len = span * (0.55 + t * 0.53);
    const fw = depth * (0.48 - t * 0.26);
    drawWingFeather(
      c,
      dir * w * 0.03,
      h * 0.02 + t * h * 0.07,
      ang,
      len,
      fw,
      i % 2 ? color : shade(color, -12),
      isBack ? 0.92 : 1,
    );
  }
  c.fillStyle = shade(color, 12);
  c.beginPath();
  c.moveTo(0, h * 0.02);
  c.quadraticCurveTo(dir * w * 0.18, -h * 0.12, dir * w * 0.28, h * 0.04);
  c.quadraticCurveTo(dir * w * 0.1, h * 0.18, 0, h * 0.12);
  c.closePath();
  c.fill();
  c.restore();
}

function drawBirdBody(
  c: CanvasRenderingContext2D,
  spec: (typeof SPECS)[BirdId],
  t: number,
  cx: number,
  cy: number,
  scale: number,
) {
  const flapAmt = wingBeatWave((t * 4.0) % 1);
  const wingAmp = spec.perk === "classic" ? 1.55 : 1.12;
  const r = 28 * scale;
  const bodyW = r * 1.15;
  const bodyH = r;

  c.save();
  c.translate(cx, cy);
  c.rotate(Math.sin(t * 1.4) * 0.06);

  c.globalAlpha = 0.15;
  c.fillStyle = "#000";
  c.beginPath();
  c.ellipse(4, bodyH * 0.9, bodyW * 0.9, bodyH * 0.28, 0, 0, TAU);
  c.fill();
  c.globalAlpha = 1;

  if (spec.perk === "neon") {
    c.globalAlpha = 0.25 + 0.15 * Math.sin(t * 6);
    c.strokeStyle = "#ea80fc";
    c.lineWidth = 3 * scale;
    c.beginPath();
    c.arc(0, 0, bodyW * 1.2, 0, TAU);
    c.stroke();
    c.strokeStyle = "#26c6da";
    c.beginPath();
    c.arc(0, 0, bodyW * 1.35, 0, TAU);
    c.stroke();
    c.globalAlpha = 1;
  }

  drawBirdTail(c, bodyW, bodyH, spec.tail, flapAmt);

  if (spec.perk === "classic") {
    c.globalAlpha = 0.2 + 0.12 * Math.sin(t * 8);
    c.fillStyle = "#ffe0b2";
    c.beginPath();
    c.ellipse(0, 0, bodyW * 1.05, bodyH * 1.02, 0, 0, TAU);
    c.fill();
    c.globalAlpha = 1;
  }

  if (spec.perk === "ember") {
    c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 10);
    for (let i = 0; i < 4; i++) {
      const fy = Math.sin(t * 12 + i) * bodyH * 0.15;
      c.fillStyle = ["#ff7043", "#ffca28", "#ff5722"][i % 3];
      c.beginPath();
      c.ellipse(-bodyW * (1.05 + i * 0.07), fy, bodyW * 0.1, bodyH * 0.18, -0.3, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
  }

  drawWing(c, -bodyW * 0.12, -2, bodyW * 0.8, bodyH * 0.85, -1, flapAmt * 0.94 + 0.03, spec.wing, wingAmp, true);

  const grad = c.createLinearGradient(0, -bodyH, 0, bodyH);
  grad.addColorStop(0, spec.top);
  grad.addColorStop(1, spec.bot);
  c.fillStyle = grad;
  c.beginPath();
  c.ellipse(0, 0, bodyW, bodyH, 0, 0, TAU);
  c.fill();

  c.fillStyle = "rgba(255,255,255,0.45)";
  c.beginPath();
  c.ellipse(bodyW * 0.1, bodyH * 0.22, bodyW * 0.55, bodyH * 0.45, 0, 0, TAU);
  c.fill();

  drawWing(c, bodyW * 0.04, -bodyH * 0.08, bodyW * 0.9, bodyH * 0.95, 1, flapAmt, spec.wing, wingAmp);

  if (spec.perk === "royal") {
    c.fillStyle = "#ffd54f";
    const crownY = -bodyH * 0.82;
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(i * bodyW * 0.14, crownY + bodyH * 0.1);
      c.lineTo(i * bodyW * 0.14 - bodyW * 0.05, crownY - bodyH * 0.15);
      c.lineTo(i * bodyW * 0.14 + bodyW * 0.05, crownY - bodyH * 0.15);
      c.fill();
    }
    c.fillRect(-bodyW * 0.3, crownY + bodyH * 0.08, bodyW * 0.6, bodyH * 0.08);
  }

  if (spec.perk === "frost") {
    c.strokeStyle = "#e1f5fe";
    c.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const a = t * 1.6 + (i * TAU) / 5;
      const sx = Math.cos(a) * bodyW * 0.7;
      const sy = Math.sin(a) * bodyH * 0.5;
      c.beginPath();
      c.moveTo(sx, sy);
      c.lineTo(sx * 1.2, sy * 1.2);
      c.stroke();
    }
  }

  if (spec.perk === "storm" && flapAmt < 0.45) {
    c.strokeStyle = "#ffee58";
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-bodyW * 0.2, -bodyH * 0.1);
    c.lineTo(-bodyW * 0.55, -bodyH * 0.35);
    c.lineTo(-bodyW * 0.4, 0);
    c.lineTo(-bodyW * 0.85, bodyH * 0.15);
    c.stroke();
  }

  const eyeX = bodyW * 0.48;
  const eyeY = -bodyH * 0.15;
  const eyeR = r * 0.24;
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(eyeX, eyeY, eyeR, 0, TAU);
  c.fill();
  c.fillStyle = spec.perk === "royal" ? "#4a148c" : "#1a2a33";
  c.beginPath();
  c.arc(eyeX + eyeR * 0.15, eyeY, eyeR * 0.5, 0, TAU);
  c.fill();

  c.fillStyle = spec.beak;
  c.beginPath();
  c.moveTo(bodyW * 0.82, -bodyH * 0.04);
  c.lineTo(bodyW * 1.2, bodyH * 0.02);
  c.lineTo(bodyW * 0.84, bodyH * 0.1);
  c.closePath();
  c.fill();
  c.fillStyle = spec.beakLower ?? "#ffc107";
  c.beginPath();
  c.moveTo(bodyW * 0.82, bodyH * 0.06);
  c.lineTo(bodyW * 1.18, bodyH * 0.08);
  c.lineTo(bodyW * 0.84, bodyH * 0.16);
  c.closePath();
  c.fill();

  c.restore();
}

export function BirdBadge({ birdId, size = 120, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spec = SPECS[birdId as BirdId] ?? SPECS.classic;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let frame = 0;
    let raf = 0;
    const loop = () => {
      const t = frame / 60;
      ctx.clearRect(0, 0, size, size);

      const bg = ctx.createRadialGradient(size / 2, size / 2, 8, size / 2, size / 2, size * 0.52);
      bg.addColorStop(0, "rgba(255,255,255,0.12)");
      bg.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.48, 0, TAU);
      ctx.fill();

      const scale = size / 120;
      drawBirdBody(ctx, spec, t, size / 2, size / 2 + 4, scale);

      frame++;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [birdId, size, spec]);

  return (
    <canvas
      ref={canvasRef}
      className={className ? `bird-badge ${className}` : "bird-badge"}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
