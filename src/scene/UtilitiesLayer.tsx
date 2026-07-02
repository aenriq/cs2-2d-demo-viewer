import type { ReplayLayerContext } from "../replay/layer-types.ts";
import type { DemoUtilityEffect, UtilityType } from "../types.ts";
import "./pixi-setup.ts";

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

function UtilityCircle({
  util,
  currentTick,
  size,
}: {
  util: DemoUtilityEffect;
  currentTick: number;
  size: number;
}) {
  if (currentTick < util.startTick || currentTick > util.endTick) return null;

  const cx = util.radar.x * size;
  const cy = util.radar.y * size;
  const r = UTILITY_RADIUS[util.type] * size;

  const life = util.endTick - util.startTick;
  const age = currentTick - util.startTick;
  let opacity = 1;
  if (util.type === "flash" || util.type === "he" || util.type === "decoy") {
    opacity = Math.max(0, 1 - age / Math.max(life, 1));
  }

  return (
    <pixiGraphics
      x={cx}
      y={cy}
      eventMode="none"
      draw={(g) => {
        g.clear();
        g.circle(0, 0, r).fill({
          color: UTILITY_COLOR[util.type],
          alpha: opacity,
        });
        if (util.type === "smoke") {
          g.circle(0, 0, r).stroke({
            width: 1.5,
            color: "rgba(220, 220, 230, 0.35)",
            alpha: opacity,
          });
        }
      }}
    />
  );
}

export function UtilitiesLayer({
  demo,
  playbackTick,
  size,
  options,
}: ReplayLayerContext) {
  if (!options.showUtilities) return null;

  return (
    <>
      {(demo.utilities ?? []).map((util) => (
        <UtilityCircle
          key={util.id}
          util={util}
          currentTick={playbackTick}
          size={size}
        />
      ))}
    </>
  );
}
