import type { DrawFrameOptions } from "../canvas/draw-frame.ts";
import type { ReplayLayerId } from "./layer-types.ts";

export type ReplayViewInitial = DrawFrameOptions;

export type ReplayViewPreset = "minimal" | "standard" | "full";

export const REPLAY_VIEW_PRESETS: Record<ReplayViewPreset, ReplayViewInitial> = {
  minimal: {
    showTracers: false,
    showPlayerNames: true,
    showUtilities: false,
    showGrenadePaths: false,
    showFlashOverlay: false,
  },
  standard: {
    showTracers: true,
    showPlayerNames: true,
    showUtilities: true,
    showGrenadePaths: false,
    showFlashOverlay: true,
  },
  full: {
    showTracers: true,
    showPlayerNames: true,
    showUtilities: true,
    showGrenadePaths: true,
    showFlashOverlay: true,
  },
};

export type ReplayLayerPreset = "minimal" | "standard" | "full";

/** Which canvas layers are registered for each preset. */
export const REPLAY_LAYER_PRESETS: Record<ReplayLayerPreset, ReplayLayerId[]> = {
  minimal: ["map", "players"],
  standard: ["map", "utilities", "shots", "players"],
  full: ["map", "grenadePaths", "utilities", "shots", "players"],
};

export function resolveViewPreset(
  preset?: ReplayViewPreset,
): DrawFrameOptions | undefined {
  return preset ? REPLAY_VIEW_PRESETS[preset] : undefined;
}
