import type { ReplayLayerContext } from "../replay/layer-types.ts";
import type { DemoGrenadePath, UtilityType } from "../types.ts";
import "./pixi-setup.ts";

const PATH_COLOR: Record<UtilityType, string> = {
  molotov: "rgba(255, 160, 80, 0.7)",
  flash: "rgba(255, 255, 180, 0.65)",
  he: "rgba(255, 220, 100, 0.65)",
  smoke: "rgba(200, 200, 210, 0.55)",
  decoy: "rgba(200, 200, 210, 0.55)",
};

function GrenadePath({
  path,
  currentTick,
  size,
}: {
  path: DemoGrenadePath;
  currentTick: number;
  size: number;
}) {
  if (currentTick < path.points[0]!.tick) return null;

  const visiblePoints = path.points.filter(
    (p) => p.tick <= currentTick && p.tick <= path.endTick,
  );
  if (visiblePoints.length < 2) return null;

  return (
    <pixiGraphics
      eventMode="none"
      draw={(g) => {
        g.clear();
        const first = visiblePoints[0]!;
        g.moveTo(first.radar.x * size, first.radar.y * size);
        for (let i = 1; i < visiblePoints.length; i++) {
          const p = visiblePoints[i]!;
          g.lineTo(p.radar.x * size, p.radar.y * size);
        }
        g.stroke({
          width: 1.5,
          color: PATH_COLOR[path.type],
          cap: "round",
        });
      }}
    />
  );
}

export function GrenadePathsLayer({
  demo,
  playbackTick,
  size,
  options,
}: ReplayLayerContext) {
  if (!options.showGrenadePaths) return null;

  return (
    <>
      {(demo.grenadePaths ?? []).map((path) => (
        <GrenadePath
          key={path.entityId}
          path={path}
          currentTick={playbackTick}
          size={size}
        />
      ))}
    </>
  );
}
