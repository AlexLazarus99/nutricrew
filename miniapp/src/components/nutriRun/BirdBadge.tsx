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

function drawWing(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  dir: number,
  angle: number,
  color: string,
) {
  c.save();
  c.translate(x, y);
  c.rotate(angle * dir);
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(dir * w * 0.1, h * 0.15, w * 0.45, h * 0.32, dir * 0.3, 0, TAU);
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
  const flap =
    spec.perk === "classic"
      ? (Math.sin(t * 14) * 0.5 + 0.5) * 0.82 + (Math.sin(t * 22 + 1.1) * 0.5 + 0.5) * 0.38
      : Math.sin(t * 8) * 0.5 + 0.5;
  const wingA = spec.perk === "classic" ? -0.78 + flap * 1.38 : -0.5 + flap * 0.9;
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

  c.fillStyle = spec.tail;
  c.beginPath();
  c.moveTo(-bodyW * 0.65, 0);
  c.lineTo(-bodyW * 1.2, -bodyH * 0.35);
  c.lineTo(-bodyW * 1.15, bodyH * 0.15);
  c.closePath();
  c.fill();

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

  drawWing(c, -bodyW * 0.12, -2, bodyW * 0.8, bodyH * 0.85, -1, wingA, spec.wing);

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

  drawWing(c, bodyW * 0.04, -bodyH * 0.08, bodyW * 0.9, bodyH * 0.95, 1, wingA, spec.wing);

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

  if (spec.perk === "storm" && flap > 0.55) {
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
