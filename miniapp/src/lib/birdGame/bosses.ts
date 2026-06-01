import { bossSpec, type BossKind } from "./progression";
import type { AnimalBoss } from "./types";

export const BOAR_DEFEAT_VIEW_MS = 1500;

export type BossBiteIntent = {
  tracking: boolean;
  inRange: boolean;
  angle: number;
  lunge: number;
  jawOpen: number;
};

export function bossHeadAnchor(
  boss: AnimalBoss,
  ground: number,
): { x: number; y: number; w: number; h: number } {
  const spec = bossSpec(boss.kind);
  const { x, width: w, height: h } = boss;
  return { x: x + w * spec.headX, y: ground - h + h * spec.headY, w, h };
}

export function computeBossBiteIntent(
  birdX: number,
  birdY: number,
  boss: AnimalBoss,
  ground: number,
): BossBiteIntent {
  const head = bossHeadAnchor(boss, ground);
  const distX = head.x - birdX;
  const distY = birdY - head.y;
  const tracking =
    distX > -boss.width * 0.25 && distX < boss.width * 1.45 && Math.abs(distY) < boss.height * 0.58;
  const inRange = tracking && distX < boss.width * 0.98 && Math.abs(distY) < boss.height * 0.4;
  const angle = Math.atan2(distY, distX);
  const biteWave = boss.bitePhase > 0 ? Math.sin(boss.bitePhase * Math.PI) : 0;
  const lunge = biteWave * boss.width * 0.15;
  const jawOpen = biteWave * boss.height * 0.095;
  return { tracking, inRange, angle, lunge, jawOpen };
}

function drawBiteMouth(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  intent: BossBiteIntent,
  boss: AnimalBoss,
): void {
  const jawGap = intent.jawOpen;
  const eyePulse = intent.inRange && boss.bitePhase > 0 ? 1.18 : 1;
  ctx.fillStyle = intent.inRange ? "#FF1744" : "#1a1a1a";
  ctx.beginPath();
  ctx.arc(-w * 0.05, -h * 0.03, w * 0.018 * eyePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.04, -h * 0.04, w * 0.015 * eyePulse, 0, Math.PI * 2);
  ctx.fill();

  if (jawGap > h * 0.008) {
    ctx.fillStyle = "#FF8A80";
    ctx.beginPath();
    ctx.ellipse(w * 0.22, h * 0.04, w * 0.1, jawGap * 0.55 + h * 0.02, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FF5252";
    ctx.beginPath();
    ctx.ellipse(w * 0.24, h * 0.05 + jawGap * 0.15, w * 0.06, jawGap * 0.35, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "#3E2723";
  ctx.lineWidth = Math.max(2, w * 0.006);
  ctx.beginPath();
  ctx.moveTo(w * 0.06, h * 0.04 - jawGap * 0.2);
  ctx.quadraticCurveTo(w * 0.12, h * 0.1 + jawGap * 0.15, w * 0.18, h * 0.05 + jawGap * 0.25);
  ctx.stroke();

  if (jawGap > h * 0.02 && boss.bitePhase > 0.35 && boss.bitePhase < 0.82) {
    const chompAlpha = Math.sin((boss.bitePhase - 0.35) * Math.PI * 1.8);
    ctx.globalAlpha = chompAlpha * 0.92;
    ctx.fillStyle = "#FFEB3B";
    ctx.font = `900 ${Math.max(14, w * 0.045)}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("CHOMP!", w * 0.28, -h * 0.16);
    ctx.globalAlpha = 1;
  }
}

function drawBossHead(
  ctx: CanvasRenderingContext2D,
  boss: AnimalBoss,
  ground: number,
  intent: BossBiteIntent,
  drawFace: (w: number, h: number, jawGap: number) => void,
): void {
  const head = bossHeadAnchor(boss, ground);
  const { width: w, height: h } = boss;
  const lungeX = Math.cos(intent.angle) * intent.lunge;
  const lungeY = Math.sin(intent.angle) * intent.lunge * 0.65;
  const trackTilt = intent.tracking
    ? Math.max(-0.42, Math.min(0.42, intent.angle + 0.15))
    : 0.12;

  ctx.save();
  ctx.translate(head.x + lungeX, head.y + lungeY);
  ctx.rotate(trackTilt);
  drawFace(w, h, intent.jawOpen);
  drawBiteMouth(ctx, w, h, intent, boss);
  ctx.restore();
}

function drawBoarBody(ctx: CanvasRenderingContext2D, x: number, topY: number, w: number, h: number, ground: number, cx: number): void {
  const bodyGrad = ctx.createLinearGradient(cx, topY, cx, ground);
  bodyGrad.addColorStop(0, "#8D6E63");
  bodyGrad.addColorStop(0.35, "#6D4C41");
  bodyGrad.addColorStop(1, "#4E342E");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, ground - 6);
  ctx.quadraticCurveTo(x + w * 0.02, topY + h * 0.35, x + w * 0.18, topY + h * 0.12);
  ctx.quadraticCurveTo(cx, topY + h * 0.04, x + w * 0.82, topY + h * 0.18);
  ctx.quadraticCurveTo(x + w * 0.96, topY + h * 0.42, x + w * 0.9, ground - 8);
  ctx.quadraticCurveTo(cx, ground + h * 0.02, x + w * 0.08, ground - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#5D4037";
  for (let i = 0; i < 9; i++) {
    const bx = x + w * (0.12 + i * 0.07);
    const by = topY + h * (0.08 + (i % 3) * 0.04);
    ctx.beginPath();
    ctx.moveTo(bx, by + h * 0.06);
    ctx.lineTo(bx - w * 0.012, by);
    ctx.lineTo(bx + w * 0.012, by);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBearBody(ctx: CanvasRenderingContext2D, x: number, topY: number, w: number, h: number, ground: number, cx: number): void {
  ctx.fillStyle = "#5D4037";
  ctx.beginPath();
  ctx.ellipse(cx, topY + h * 0.45, w * 0.42, h * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + w * 0.18, topY + h * 0.18, w * 0.1, 0, Math.PI * 2);
  ctx.arc(x + w * 0.32, topY + h * 0.16, w * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4E342E";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.22, ground - h * 0.08, w * 0.14, h * 0.07, -0.2, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.38, ground - h * 0.06, w * 0.13, h * 0.065, 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function drawCrocBody(ctx: CanvasRenderingContext2D, x: number, topY: number, w: number, h: number, ground: number): void {
  ctx.fillStyle = "#33691E";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.05, ground - 4);
  ctx.quadraticCurveTo(x + w * 0.1, topY + h * 0.5, x + w * 0.55, topY + h * 0.35);
  ctx.quadraticCurveTo(x + w * 0.92, topY + h * 0.28, x + w * 0.95, ground - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#558B2F";
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w * (0.15 + i * 0.08), topY + h * (0.3 + (i % 2) * 0.05));
    ctx.lineTo(x + w * (0.12 + i * 0.08), topY + h * (0.38 + (i % 2) * 0.05));
    ctx.lineTo(x + w * (0.18 + i * 0.08), topY + h * (0.38 + (i % 2) * 0.05));
    ctx.closePath();
    ctx.fill();
  }
}

function drawTigerBody(ctx: CanvasRenderingContext2D, x: number, topY: number, w: number, h: number, ground: number, cx: number): void {
  ctx.fillStyle = "#FF8F00";
  ctx.beginPath();
  ctx.ellipse(cx, topY + h * 0.42, w * 0.4, h * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3E2723";
  ctx.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.moveTo(x + w * (0.2 + i * 0.08), topY + h * 0.2);
    ctx.lineTo(x + w * (0.22 + i * 0.08), topY + h * 0.55);
    ctx.stroke();
  }
  ctx.fillStyle = "#E65100";
  ctx.beginPath();
  ctx.ellipse(x + w * 0.24, ground - h * 0.07, w * 0.12, h * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawWolfBody(ctx: CanvasRenderingContext2D, x: number, topY: number, w: number, h: number, ground: number, cx: number): void {
  ctx.fillStyle = "#78909C";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, ground - 4);
  ctx.quadraticCurveTo(x + w * 0.08, topY + h * 0.3, cx, topY + h * 0.12);
  ctx.quadraticCurveTo(x + w * 0.85, topY + h * 0.2, x + w * 0.88, ground - 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#B0BEC5";
  ctx.beginPath();
  ctx.ellipse(cx, topY + h * 0.35, w * 0.12, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLionBody(ctx: CanvasRenderingContext2D, _x: number, topY: number, w: number, h: number, _ground: number, cx: number): void {
  ctx.fillStyle = "#FFB300";
  ctx.beginPath();
  ctx.ellipse(cx, topY + h * 0.42, w * 0.4, h * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FF8F00";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * w * 0.22, topY + h * 0.28 + Math.sin(a) * h * 0.14);
    ctx.lineTo(cx + Math.cos(a) * w * 0.34, topY + h * 0.28 + Math.sin(a) * h * 0.22);
    ctx.lineTo(cx + Math.cos(a + 0.15) * w * 0.22, topY + h * 0.28 + Math.sin(a + 0.15) * h * 0.14);
    ctx.fill();
  }
}

function drawEagleBody(ctx: CanvasRenderingContext2D, x: number, topY: number, w: number, h: number, _ground: number, cx: number, elapsed: number): void {
  ctx.fillStyle = "#5D4037";
  ctx.beginPath();
  ctx.ellipse(cx, topY + h * 0.4, w * 0.28, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  const wing = Math.sin(elapsed * 0.004) * 0.15;
  ctx.fillStyle = "#4E342E";
  ctx.beginPath();
  ctx.ellipse(cx - w * 0.2, topY + h * 0.38, w * 0.22, h * 0.08 + wing * h, -0.4, 0, Math.PI * 2);
  ctx.ellipse(cx + w * 0.05, topY + h * 0.38, w * 0.22, h * 0.08 - wing * h, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#FFD54F";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.78, topY + h * 0.22);
  ctx.lineTo(x + w * 0.92, topY + h * 0.26);
  ctx.lineTo(x + w * 0.8, topY + h * 0.3);
  ctx.closePath();
  ctx.fill();
}

function drawSnakeBody(ctx: CanvasRenderingContext2D, x: number, _topY: number, w: number, h: number, ground: number, elapsed: number): void {
  ctx.strokeStyle = "#388E3C";
  ctx.lineWidth = w * 0.14;
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const sx = x + w * (0.08 + t * 0.82);
    const sy = ground - h * 0.08 + Math.sin(t * 5 + elapsed * 0.002) * h * 0.12;
    if (i === 0) ctx.moveTo(sx, sy);
    else ctx.lineTo(sx, sy);
  }
  ctx.stroke();
  ctx.fillStyle = "#2E7D32";
  ctx.beginPath();
  ctx.arc(x + w * 0.9, ground - h * 0.12 + Math.sin(elapsed * 0.002) * h * 0.05, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

function drawAnimalBody(
  ctx: CanvasRenderingContext2D,
  boss: AnimalBoss,
  ground: number,
  topY: number,
  cx: number,
  elapsed: number,
): void {
  const { x, width: w, height: h, kind } = boss;
  switch (kind) {
    case "boar":
      drawBoarBody(ctx, x, topY, w, h, ground, cx);
      break;
    case "bear":
      drawBearBody(ctx, x, topY, w, h, ground, cx);
      break;
    case "crocodile":
      drawCrocBody(ctx, x, topY, w, h, ground);
      break;
    case "tiger":
      drawTigerBody(ctx, x, topY, w, h, ground, cx);
      break;
    case "wolf":
      drawWolfBody(ctx, x, topY, w, h, ground, cx);
      break;
    case "lion":
      drawLionBody(ctx, x, topY, w, h, ground, cx);
      break;
    case "eagle":
      drawEagleBody(ctx, x, topY, w, h, ground, cx, elapsed);
      break;
    case "snake":
      drawSnakeBody(ctx, x, topY, w, h, ground, elapsed);
      break;
  }
}

export function drawAnimalBoss(
  ctx: CanvasRenderingContext2D,
  boss: AnimalBoss,
  ground: number,
  elapsed: number,
  intent: BossBiteIntent,
  canDefeat: boolean,
): void {
  const { x, width: w, height: h } = boss;
  const topY = ground - h;
  const cx = x + w * 0.46;
  const pending = boss.defeatPendingAt;

  ctx.save();
  if (pending) {
    const remain = Math.max(0, pending - elapsed);
    const t = 1 - remain / BOAR_DEFEAT_VIEW_MS;
    const shake = (Math.sin(elapsed * 0.09) * 3.5 + Math.sin(elapsed * 0.14) * 2.5) * t;
    ctx.translate(shake, shake * 0.35);
    const glowPulse = 0.35 + Math.sin(elapsed * 0.025) * 0.2 + t * 0.25;
    ctx.shadowColor = "#FF6D00";
    ctx.shadowBlur = 24 + t * 36;
    ctx.fillStyle = `rgba(255,109,0,${glowPulse * 0.22})`;
    ctx.beginPath();
    ctx.ellipse(cx, topY + h * 0.48, w * 0.52, h * 0.56, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.beginPath();
  ctx.ellipse(cx, ground - 6, w * 0.44, h * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  drawAnimalBody(ctx, boss, ground, topY, cx, elapsed);

  drawBossHead(ctx, boss, ground, intent, (fw, fh, jawGap) => {
    const headGrad = ctx.createRadialGradient(-fw * 0.04, -fh * 0.04, 4, 0, 0, fw * 0.2);
    const colors: Record<BossKind, [string, string]> = {
      boar: ["#A1887F", "#5D4037"],
      bear: ["#8D6E63", "#4E342E"],
      crocodile: ["#689F38", "#33691E"],
      tiger: ["#FFB74D", "#E65100"],
      wolf: ["#B0BEC5", "#546E7A"],
      lion: ["#FFD54F", "#FF8F00"],
      eagle: ["#8D6E63", "#4E342E"],
      snake: ["#66BB6A", "#2E7D32"],
    };
    const [c0, c1] = colors[boss.kind];
    headGrad.addColorStop(0, c0);
    headGrad.addColorStop(1, c1);
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, fw * 0.2, fh * 0.13, 0, 0, Math.PI * 2);
    ctx.fill();

    if (boss.kind === "boar") {
      ctx.fillStyle = "#BCAAA4";
      ctx.beginPath();
      ctx.ellipse(-fw * 0.12, -fh * 0.08, fw * 0.07, fh * 0.05, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#FFFDE7";
      ctx.beginPath();
      ctx.moveTo(fw * 0.2, -jawGap * 0.5 + fh * 0.01);
      ctx.lineTo(fw * 0.34, -jawGap * 0.25 + fh * 0.05);
      ctx.lineTo(fw * 0.22, jawGap * 0.35 + fh * 0.09);
      ctx.closePath();
      ctx.fill();
    } else if (boss.kind === "bear") {
      ctx.beginPath();
      ctx.arc(-fw * 0.14, -fh * 0.1, fw * 0.07, 0, Math.PI * 2);
      ctx.arc(fw * 0.14, -fh * 0.1, fw * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = "#5D4037";
      ctx.fill();
    } else if (boss.kind === "tiger") {
      ctx.strokeStyle = "#3E2723";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-fw * 0.08 + i * fw * 0.05, -fh * 0.06);
        ctx.lineTo(-fw * 0.04 + i * fw * 0.05, fh * 0.04);
        ctx.stroke();
      }
    } else if (boss.kind === "wolf") {
      ctx.beginPath();
      ctx.moveTo(-fw * 0.08, -fh * 0.1);
      ctx.lineTo(-fw * 0.14, -fh * 0.22);
      ctx.lineTo(-fw * 0.02, -fh * 0.12);
      ctx.moveTo(fw * 0.08, -fh * 0.1);
      ctx.lineTo(fw * 0.14, -fh * 0.22);
      ctx.lineTo(fw * 0.02, -fh * 0.12);
      ctx.fill();
    } else if (boss.kind === "lion") {
      ctx.fillStyle = "#FF8F00";
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * fw * 0.12, Math.sin(a) * fh * 0.08);
        ctx.lineTo(Math.cos(a) * fw * 0.22, Math.sin(a) * fh * 0.14);
        ctx.lineTo(Math.cos(a + 0.2) * fw * 0.12, Math.sin(a + 0.2) * fh * 0.08);
        ctx.fill();
      }
    } else if (boss.kind === "eagle") {
      ctx.fillStyle = "#FFD54F";
      ctx.beginPath();
      ctx.moveTo(fw * 0.12, fh * 0.02);
      ctx.lineTo(fw * 0.28, fh * 0.06);
      ctx.lineTo(fw * 0.14, fh * 0.08);
      ctx.closePath();
      ctx.fill();
    } else if (boss.kind === "crocodile") {
      ctx.fillStyle = "#FFFDE7";
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(fw * 0.12 + i * fw * 0.04, fh * 0.02 - jawGap * 0.2);
        ctx.lineTo(fw * 0.14 + i * fw * 0.04, fh * 0.08 + jawGap * 0.2);
        ctx.lineTo(fw * 0.16 + i * fw * 0.04, fh * 0.02 - jawGap * 0.2);
        ctx.fill();
      }
    } else if (boss.kind === "snake") {
      ctx.fillStyle = "#FF1744";
      ctx.beginPath();
      ctx.arc(fw * 0.1, -fh * 0.02, fw * 0.025, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1B5E20";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-fw * 0.05, fh * 0.05);
      ctx.lineTo(fw * 0.28, fh * 0.02 + jawGap * 0.3);
      ctx.stroke();
    }

    ctx.fillStyle = "#5D4037";
    ctx.beginPath();
    ctx.ellipse(fw * 0.14, -jawGap * 0.35 + fh * 0.03, fw * 0.11, fh * 0.075, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(fw * 0.24, jawGap * 0.45 + fh * 0.1, fw * 0.12, fh * 0.055 + jawGap * 0.35, 0.18, 0, Math.PI * 2);
    ctx.fill();
  });

  if (pending) {
    const remain = Math.max(0, pending - elapsed);
    const pulse = 0.65 + Math.sin(elapsed * 0.02) * 0.35;
    ctx.fillStyle = `rgba(255,193,7,${pulse})`;
    ctx.font = `900 ${Math.max(16, w * 0.05)}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("BOOM...", cx, topY + h * 0.1);
    ctx.font = `bold ${Math.max(11, w * 0.032)}px Manrope, sans-serif`;
    ctx.fillStyle = `rgba(255,248,225,${0.85 * pulse})`;
    ctx.fillText(`${(remain / 1000).toFixed(1)}s`, cx, topY + h * 0.17);
  } else if (canDefeat) {
    const pulse = 0.7 + Math.sin(elapsed * 0.012) * 0.3;
    ctx.fillStyle = `rgba(255,109,0,${pulse})`;
    ctx.font = `bold ${Math.max(12, w * 0.04)}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("SMASH!", cx, topY + h * 0.12);
  } else if (intent.inRange && boss.bitePhase <= 0) {
    const pulse = 0.55 + Math.sin(elapsed * 0.018) * 0.25;
    ctx.fillStyle = `rgba(255,82,82,${pulse})`;
    ctx.font = `bold ${Math.max(11, w * 0.035)}px Manrope, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("NOM!", cx + w * 0.22, topY + h * 0.08);
  }

  ctx.restore();
}

export function drawBossFloatingTitle(
  ctx: CanvasRenderingContext2D,
  boss: AnimalBoss,
  ground: number,
  elapsed: number,
): void {
  const { x, width: w, height: h } = boss;
  const cx = x + w * 0.46;
  const bob = Math.sin(elapsed * 0.0035) * 14;
  const sway = Math.sin(elapsed * 0.0022) * 6;
  const floatY = ground - h - 36 + bob;
  const fontSize = Math.max(56, Math.min(96, w * 0.13));
  const pulse = 0.86 + Math.sin(elapsed * 0.005) * 0.14;
  const label = bossSpec(boss.kind).label;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px Manrope, sans-serif`;
  ctx.shadowColor = "#FFB300";
  ctx.shadowBlur = 28 * pulse;
  ctx.strokeStyle = "#4E342E";
  ctx.lineWidth = fontSize * 0.1;
  ctx.lineJoin = "round";
  ctx.strokeText(label, cx + sway, floatY);
  ctx.shadowBlur = 16 * pulse;
  const gold = ctx.createLinearGradient(cx, floatY - fontSize * 0.5, cx, floatY + fontSize * 0.5);
  gold.addColorStop(0, "#FFF59D");
  gold.addColorStop(0.35, "#FFD700");
  gold.addColorStop(0.65, "#FFA000");
  gold.addColorStop(1, "#FF8F00");
  ctx.fillStyle = gold;
  ctx.fillText(label, cx + sway, floatY);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.5 * pulse;
  ctx.fillStyle = "#FFFDE7";
  ctx.fillText(label, cx + sway - fontSize * 0.025, floatY - fontSize * 0.06);
  ctx.globalAlpha = 1;
  ctx.font = `bold ${Math.max(11, fontSize * 0.16)}px Manrope, sans-serif`;
  ctx.fillStyle = `rgba(255,248,225,${0.75 * pulse})`;
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 4;
  ctx.fillText("⚠", cx + sway - fontSize * 0.72, floatY - fontSize * 0.55);
  ctx.fillText("⚠", cx + sway + fontSize * 0.72, floatY - fontSize * 0.55);
  ctx.restore();
}
