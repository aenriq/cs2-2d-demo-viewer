import type { DrawFrameOptions } from "../canvas/draw-frame.ts";
import type { DemoFrame, DemoReplayData } from "../types.ts";

export interface ReplayLayerContext {
  ctx: CanvasRenderingContext2D;
  demo: DemoReplayData;
  frameIndex: number;
  frame: DemoFrame;
  radarImg: CanvasImageSource;
  size: number;
  options: DrawFrameOptions;
}

export interface ReplayLayer {
  /** Unique layer id — use for include/exclude filters. */
  id: string;
  /** Lower order draws first (underneath). */
  order: number;
  /** Return false to skip when demo JSON lacks this data. */
  isAvailable?: (demo: DemoReplayData) => boolean;
  draw: (context: ReplayLayerContext) => void;
}

export type ReplayLayerId =
  | "map"
  | "grenadePaths"
  | "utilities"
  | "shots"
  | "players";
