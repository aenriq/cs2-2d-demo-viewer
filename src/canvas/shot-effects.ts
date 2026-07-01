import type { Team } from "../types.ts";

export interface StarburstOptions {
  /** Outer reach of the longest rays. */
  radius: number;
  /** Number of radiating rays. */
  rayCount?: number;
  /** Center glow color. */
  coreColor?: string;
  /** Ray stroke color. */
  rayColor?: string;
  /** Overall opacity multiplier. */
  alpha?: number;
}

const DEFAULT_RAY_COUNT = 18;

/**
 * Leetify-style muzzle / impact starburst — bright core + sharp radiating rays.
 */
export function drawStarburst(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: StarburstOptions,
): void {
  const {
    radius,
    rayCount = DEFAULT_RAY_COUNT,
    coreColor = "#fff8e8",
    rayColor = "rgba(255, 255, 255, 0.92)",
    alpha = 1,
  } = options;

  if (alpha <= 0) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;

  const coreRadius = radius * 0.38;
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coreRadius);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.45, coreColor);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineCap = "round";
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + (i % 2) * 0.12;
    const lengthMul = 0.55 + (i % 4) * 0.12;
    const rayLen = radius * lengthMul;
    const lineWidth = i % 3 === 0 ? 1.6 : 1.1;

    ctx.strokeStyle = rayColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  team: Team | string,
  alpha: number,
): void {
  const isCt = team === "CT";
  drawStarburst(ctx, x, y, {
    radius: 11,
    rayCount: 16,
    coreColor: isCt ? "#d8ecff" : "#ffe8cc",
    rayColor: isCt ? "rgba(200, 230, 255, 0.95)" : "rgba(255, 230, 190, 0.95)",
    alpha,
  });
}

export function drawImpactFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  team: Team | string,
  alpha: number,
): void {
  const isCt = team === "CT";
  drawStarburst(ctx, x, y, {
    radius: 14,
    rayCount: 20,
    coreColor: isCt ? "#b8daff" : "#ffb070",
    rayColor: isCt ? "rgba(140, 200, 255, 0.9)" : "rgba(255, 170, 80, 0.92)",
    alpha,
  });
}

export function teamShotLineColor(team: Team | string): string {
  if (team === "CT") return "rgba(93, 168, 240, 0.92)";
  if (team === "T") return "rgba(240, 152, 74, 0.92)";
  return "rgba(200, 200, 200, 0.85)";
}
