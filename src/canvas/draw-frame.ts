import type { ReplayLayer, ReplayLayerContext } from "../replay/layer-types.ts";
import type { DemoReplayData } from "../types.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";
import { createReplayLayers } from "./layers/index.ts";

export interface DrawFrameOptions {
  showPlayerNames?: boolean;
  showTracers?: boolean;
  showUtilities?: boolean;
  showGrenadePaths?: boolean;
  showFlashOverlay?: boolean;
}

export const DEFAULT_DRAW_OPTIONS: DrawFrameOptions = {
  showPlayerNames: true,
  showTracers: true,
  showUtilities: true,
  showGrenadePaths: true,
  showFlashOverlay: true,
};

export function drawReplayFrame(
  ctx: CanvasRenderingContext2D,
  demo: DemoReplayData,
  frameIndex: number,
  radarImg: CanvasImageSource,
  size: number,
  options: DrawFrameOptions = {},
  layers = createReplayLayers({ preset: "full" }),
): void {
  const frame = demo.frames[frameIndex];
  if (!frame) return;

  const mergedOptions: DrawFrameOptions = { ...DEFAULT_DRAW_OPTIONS, ...options };

  const layerContext: ReplayLayerContext = {
    ctx,
    demo,
    frameIndex,
    frame,
    radarImg,
    size,
    options: mergedOptions,
  };

  ctx.clearRect(0, 0, size, size);

  for (const layer of layers) {
    if (layer.isAvailable && !layer.isAvailable(demo)) continue;
    layer.draw(layerContext);
  }
}

export function getRoundAtTick(
  demo: DemoReplayLike,
  tick: number,
): DemoReplayData["rounds"][number] | undefined {
  return (demo.rounds ?? []).find((r) => tick >= r.startTick && tick <= r.endTick);
}
