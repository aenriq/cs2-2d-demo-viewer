import { FRAME_TICK_INTERVAL, SHOT_LIFETIME_TICKS } from "../constants.ts";
import { teamTracer } from "../colors.ts";
import type { ReplayLayer } from "../../replay/layer-types.ts";

export const shotsLayer: ReplayLayer = {
  id: "shots",
  order: 30,
  isAvailable: (demo) => (demo.shots?.length ?? 0) > 0,
  draw({ ctx, demo, frame, size, options }) {
    if (!options.showTracers) return;

    const tickWindow = FRAME_TICK_INTERVAL;
    const w = size;
    const h = size;

    ctx.setLineDash([5, 4]);
    ctx.lineCap = "round";

    for (const shot of demo.shots ?? []) {
      if (shot.tick > frame.tick + tickWindow) continue;
      const age = frame.tick - shot.tick;
      if (age > SHOT_LIFETIME_TICKS) continue;
      if (age < -tickWindow) continue;

      const fade = age < 0 ? 1 : 1 - age / SHOT_LIFETIME_TICKS;

      ctx.strokeStyle = teamTracer(shot.team);
      ctx.globalAlpha = Math.max(0.15, fade * 0.9);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shot.from.x * w, shot.from.y * h);
      ctx.lineTo(shot.to.x * w, shot.to.y * h);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  },
};
