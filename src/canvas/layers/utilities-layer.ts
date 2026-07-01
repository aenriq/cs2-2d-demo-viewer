import type { ReplayLayer } from "../../replay/layer-types.ts";
import type { DemoUtilityEffect, UtilityType } from "../../types.ts";

const UTILITY_RADIUS: Record<UtilityType, number> = {
  smoke: 0.052,
  molotov: 0.044,
  flash: 0.034,
  he: 0.03,
  decoy: 0.022,
};

function drawSmoke(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
): void {
  const gradient = ctx.createRadialGradient(cx, cy, r * 0.08, cx, cy, r);
  gradient.addColorStop(0, "rgba(210, 215, 225, 0.42)");
  gradient.addColorStop(0.55, "rgba(165, 170, 180, 0.28)");
  gradient.addColorStop(1, "rgba(120, 125, 135, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawUtility(
  ctx: CanvasRenderingContext2D,
  util: DemoUtilityEffect,
  currentTick: number,
  w: number,
  h: number,
): void {
  if (currentTick < util.startTick || currentTick > util.endTick) return;

  const cx = util.radar.x * w;
  const cy = util.radar.y * h;
  const r = UTILITY_RADIUS[util.type] * w;

  const life = util.endTick - util.startTick;
  const age = currentTick - util.startTick;
  let alpha = 1;
  if (util.type === "flash" || util.type === "he" || util.type === "decoy") {
    alpha = Math.max(0, 1 - age / Math.max(life, 1));
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  if (util.type === "smoke") {
    drawSmoke(ctx, cx, cy, r);
  } else if (util.type === "molotov") {
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, "rgba(255, 140, 50, 0.55)");
    gradient.addColorStop(0.65, "rgba(255, 90, 30, 0.32)");
    gradient.addColorStop(1, "rgba(200, 60, 10, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (util.type === "flash") {
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    gradient.addColorStop(0, "rgba(255, 255, 240, 0.75)");
    gradient.addColorStop(0.5, "rgba(255, 255, 220, 0.35)");
    gradient.addColorStop(1, "rgba(255, 255, 200, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (util.type === "he") {
    ctx.strokeStyle = "rgba(255, 210, 80, 0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * (0.4 + alpha * 0.6), 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = "rgba(160, 160, 160, 0.28)";
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export const utilitiesLayer: ReplayLayer = {
  id: "utilities",
  order: 20,
  isAvailable: (demo) => (demo.utilities?.length ?? 0) > 0,
  draw({ ctx, demo, frame, size, options }) {
    if (!options.showUtilities) return;
    for (const util of demo.utilities ?? []) {
      drawUtility(ctx, util, frame.tick, size, size);
    }
  },
};
