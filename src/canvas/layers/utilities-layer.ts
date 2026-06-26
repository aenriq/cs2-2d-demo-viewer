import type { ReplayLayer } from "../../replay/layer-types.ts";
import type { DemoUtilityEffect, UtilityType } from "../../types.ts";

const UTILITY_RADIUS: Record<UtilityType, number> = {
  smoke: 0.048,
  molotov: 0.042,
  flash: 0.038,
  he: 0.028,
  decoy: 0.022,
};

const UTILITY_COLOR: Record<UtilityType, string> = {
  smoke: "rgba(180, 180, 190, 0.35)",
  molotov: "rgba(255, 120, 40, 0.4)",
  flash: "rgba(255, 255, 220, 0.55)",
  he: "rgba(255, 220, 80, 0.45)",
  decoy: "rgba(160, 160, 160, 0.25)",
};

function drawUtilitiesLayer(
  ctx: CanvasRenderingContext2D,
  utilities: DemoUtilityEffect[],
  currentTick: number,
  w: number,
  h: number,
): void {
  for (const util of utilities) {
    if (currentTick < util.startTick || currentTick > util.endTick) continue;

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
    ctx.fillStyle = UTILITY_COLOR[util.type];
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    if (util.type === "smoke") {
      ctx.strokeStyle = "rgba(220, 220, 230, 0.35)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}

export const utilitiesLayer: ReplayLayer = {
  id: "utilities",
  order: 20,
  isAvailable: (demo) => (demo.utilities?.length ?? 0) > 0,
  draw({ ctx, demo, frame, size, options }) {
    if (!options.showUtilities) return;
    drawUtilitiesLayer(ctx, demo.utilities ?? [], frame.tick, size, size);
  },
};
