import { SHOT_LIFETIME_TICKS, SHOT_TRACER_WIDTH } from "../canvas/constants.ts";
import { teamFill } from "../canvas/colors.ts";
import type { ReplayLayerContext } from "../replay/layer-types.ts";
import { getFrameTickInterval } from "../utils/frame-interval.ts";
import "./pixi-setup.ts";

export function ShotsLayer({
  demo,
  playbackTick,
  size,
  options,
}: ReplayLayerContext) {
  if (!options.showTracers) return null;

  return (
    <>
      {(demo.shots ?? []).map((shot, i) => {
        const age = playbackTick - shot.tick;
        if (age > SHOT_LIFETIME_TICKS) return null;
        if (shot.tick > playbackTick + getFrameTickInterval(demo)) return null;

        const fade = age < 0 ? 1 : 1 - age / SHOT_LIFETIME_TICKS;
        const color = teamFill(shot.team);
        const x1 = shot.from.x * size;
        const y1 = shot.from.y * size;
        const x2 = shot.to.x * size;
        const y2 = shot.to.y * size;

        return (
          <pixiGraphics
            key={`${shot.tick}-${i}`}
            eventMode="none"
            draw={(g) => {
              g.clear();
              g.moveTo(x1, y1)
                .lineTo(x2, y2)
                .stroke({
                  width: SHOT_TRACER_WIDTH,
                  color,
                  alpha: Math.max(0.2, fade * 0.85),
                  cap: "round",
                });
            }}
          />
        );
      })}
    </>
  );
}
