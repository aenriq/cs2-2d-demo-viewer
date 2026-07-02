import type { ReactNode } from "react";
import type { DrawFrameOptions } from "../canvas/draw-frame.ts";
import type { DemoFrame, DemoReplayData, PlayerFrame } from "../types.ts";

export interface ReplayLayerContext {
  demo: DemoReplayData;
  frame: DemoFrame;
  playbackTick: number;
  radarImg: CanvasImageSource;
  size: number;
  options: DrawFrameOptions;
  onPlayerClick?: (player: PlayerFrame) => void;
  onPlayerHover?: (player: PlayerFrame | null) => void;
  selectedSteamId?: string | null;
}

export interface ReplayLayer {
  id: string;
  order: number;
  isAvailable?: (demo: DemoReplayData) => boolean;
  render: (context: ReplayLayerContext) => ReactNode;
}

export type ReplayLayerId =
  | "map"
  | "grenadePaths"
  | "utilities"
  | "shots"
  | "players";
