import { FRAME_TICK_INTERVAL, SHOT_LIFETIME_TICKS } from "../constants.ts";
import {
  drawImpactFlash,
  drawMuzzleFlash,
  teamShotLineColor,
} from "../shot-effects.ts";
import type { ReplayLayer } from "../../replay/layer-types.ts";

const MUZZLE_FLASH_TICKS = 14;
const IMPACT_FLASH_TICKS = 18;

export const shotsLayer: ReplayLayer = {
  id: "shots",
  order: 30,
  isAvailable: (demo) => (demo.shots?.length ?? 0) > 0,
  draw({ ctx, demo, frame, size, options }) {
    if (!options.showTracers) return;

    const tickWindow = FRAME_TICK_INTERVAL;
    const w = size;
    const h = size;

    ctx.lineCap = "round";

    for (const shot of demo.shots ?? []) {
      if (shot.tick > frame.tick + tickWindow) continue;
      const age = frame.tick - shot.tick;
      if (age > SHOT_LIFETIME_TICKS) continue;
      if (age < -tickWindow) continue;

      const lifeFade = age < 0 ? 1 : 1 - age / SHOT_LIFETIME_TICKS;
      const fromX = shot.from.x * w;
      const fromY = shot.from.y * h;
      const toX = shot.to.x * w;
      const toY = shot.to.y * h;

      ctx.strokeStyle = teamShotLineColor(shot.team);
      ctx.globalAlpha = Math.max(0.15, lifeFade * 0.9);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      if (age >= 0 && age <= MUZZLE_FLASH_TICKS) {
        const flashAlpha = 1 - age / MUZZLE_FLASH_TICKS;
        drawMuzzleFlash(ctx, fromX, fromY, shot.team, flashAlpha);
      }

      if (age >= 0 && age <= IMPACT_FLASH_TICKS) {
        const impactAlpha = 1 - age / IMPACT_FLASH_TICKS;
        drawImpactFlash(ctx, toX, toY, shot.team, impactAlpha * 0.95);
      }
    }

    ctx.globalAlpha = 1;
  },
};
