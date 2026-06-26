import type { ReplayLayer } from "../../replay/layer-types.ts";
import type { DemoGrenadePath } from "../../types.ts";

function drawGrenadePathsLayer(
  ctx: CanvasRenderingContext2D,
  paths: DemoGrenadePath[],
  currentTick: number,
  w: number,
  h: number,
): void {
  for (const path of paths) {
    if (currentTick < path.points[0]!.tick) continue;

    const visiblePoints = path.points.filter(
      (p) => p.tick <= currentTick && p.tick <= path.endTick,
    );
    if (visiblePoints.length < 2) continue;

    ctx.save();
    ctx.strokeStyle =
      path.type === "molotov"
        ? "rgba(255, 160, 80, 0.7)"
        : path.type === "flash"
          ? "rgba(255, 255, 180, 0.65)"
          : path.type === "he"
            ? "rgba(255, 220, 100, 0.65)"
            : "rgba(200, 200, 210, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(visiblePoints[0]!.radar.x * w, visiblePoints[0]!.radar.y * h);
    for (let i = 1; i < visiblePoints.length; i++) {
      ctx.lineTo(
        visiblePoints[i]!.radar.x * w,
        visiblePoints[i]!.radar.y * h,
      );
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export const grenadePathsLayer: ReplayLayer = {
  id: "grenadePaths",
  order: 15,
  isAvailable: (demo) => (demo.grenadePaths?.length ?? 0) > 0,
  draw({ ctx, demo, frame, size, options }) {
    if (!options.showGrenadePaths) return;
    drawGrenadePathsLayer(ctx, demo.grenadePaths ?? [], frame.tick, size, size);
  },
};
