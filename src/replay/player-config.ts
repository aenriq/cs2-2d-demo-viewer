import type { DrawFrameOptions } from "../canvas/draw-frame.ts";
import {
  createReplayLayers,
  type CreateReplayLayersOptions,
} from "../canvas/layers/index.tsx";
import type { ReplayLayer } from "./layer-types.ts";
import type { ReplayLayerId } from "./layer-types.ts";
import type { ReplayLayerPreset, ReplayViewPreset } from "./view-presets.ts";
import { REPLAY_VIEW_PRESETS } from "./view-presets.ts";

/** What replay data this player instance may render. `false` = never, even if JSON has it. */
export interface DemoReplayPlayerCapabilities {
  tracers?: boolean;
  utilities?: boolean;
  grenadePaths?: boolean;
  flashOverlay?: boolean;
  playerNames?: boolean;
}

export const DEFAULT_DEMO_REPLAY_CAPABILITIES: Required<DemoReplayPlayerCapabilities> =
  {
    tracers: true,
    utilities: true,
    grenadePaths: true,
    flashOverlay: true,
    playerNames: true,
  };

export interface CreateDemoReplayPlayerOptions {
  capabilities?: DemoReplayPlayerCapabilities;
  layerPreset?: ReplayLayerPreset;
  viewPreset?: ReplayViewPreset;
  layerOptions?: Omit<CreateReplayLayersOptions, "preset">;
  /** Auto-fill missing optional arrays in demo JSON. Default true. */
  normalize?: boolean;
  canvasSize?: number;
}

export interface DemoReplayPlayerConfig {
  capabilities: Required<DemoReplayPlayerCapabilities>;
  layers: ReplayLayer[];
  layerPreset: ReplayLayerPreset;
  layerOptions?: Omit<CreateReplayLayersOptions, "preset">;
  defaultDrawOptions: DrawFrameOptions;
  normalize: boolean;
  canvasSize: number;
  applyCapabilities: (options: DrawFrameOptions) => DrawFrameOptions;
}

export function applyPlayerCapabilities(
  options: DrawFrameOptions,
  capabilities: Required<DemoReplayPlayerCapabilities>,
): DrawFrameOptions {
  return {
    showTracers:
      capabilities.tracers && (options.showTracers ?? true),
    showUtilities:
      capabilities.utilities && (options.showUtilities ?? true),
    showGrenadePaths:
      capabilities.grenadePaths && (options.showGrenadePaths ?? true),
    showFlashOverlay:
      capabilities.flashOverlay && (options.showFlashOverlay ?? true),
    showPlayerNames:
      capabilities.playerNames && (options.showPlayerNames ?? true),
  };
}

function capabilityExcludes(
  capabilities: Required<DemoReplayPlayerCapabilities>,
): ReplayLayerId[] {
  const exclude: ReplayLayerId[] = [];
  if (!capabilities.tracers) exclude.push("shots");
  if (!capabilities.utilities) exclude.push("utilities");
  if (!capabilities.grenadePaths) exclude.push("grenadePaths");
  return exclude;
}

export function resolvePlayerConfig(
  options: CreateDemoReplayPlayerOptions = {},
): DemoReplayPlayerConfig {
  const capabilities: Required<DemoReplayPlayerCapabilities> = {
    ...DEFAULT_DEMO_REPLAY_CAPABILITIES,
    ...options.capabilities,
  };

  const layerPreset =
    options.layerPreset ?? options.viewPreset ?? ("full" as ReplayLayerPreset);

  const viewDefaults =
    options.viewPreset != null
      ? REPLAY_VIEW_PRESETS[options.viewPreset]
      : undefined;

  const layerOptions: Omit<CreateReplayLayersOptions, "preset"> = {
    ...options.layerOptions,
    exclude: [
      ...(options.layerOptions?.exclude ?? []),
      ...capabilityExcludes(capabilities),
    ],
  };

  const layers = createReplayLayers({
    preset: layerPreset,
    ...layerOptions,
  });

  const defaultDrawOptions = applyPlayerCapabilities(
    {
      showTracers: viewDefaults?.showTracers ?? capabilities.tracers,
      showPlayerNames: viewDefaults?.showPlayerNames ?? capabilities.playerNames,
      showUtilities: viewDefaults?.showUtilities ?? capabilities.utilities,
      showGrenadePaths:
        viewDefaults?.showGrenadePaths ?? capabilities.grenadePaths,
      showFlashOverlay:
        viewDefaults?.showFlashOverlay ?? capabilities.flashOverlay,
    },
    capabilities,
  );

  return {
    capabilities,
    layers,
    layerPreset,
    layerOptions,
    defaultDrawOptions,
    normalize: options.normalize ?? true,
    canvasSize: options.canvasSize ?? 512,
    applyCapabilities: (drawOptions) =>
      applyPlayerCapabilities(drawOptions, capabilities),
  };
}
