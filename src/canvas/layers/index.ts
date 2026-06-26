export { mapLayer } from "./map-layer.ts";
export { grenadePathsLayer } from "./grenade-paths-layer.ts";
export { utilitiesLayer } from "./utilities-layer.ts";
export { shotsLayer } from "./shots-layer.ts";
export { playersLayer } from "./players-layer.ts";

import { grenadePathsLayer } from "./grenade-paths-layer.ts";
import { mapLayer } from "./map-layer.ts";
import { playersLayer } from "./players-layer.ts";
import { shotsLayer } from "./shots-layer.ts";
import { utilitiesLayer } from "./utilities-layer.ts";
import type { ReplayLayer, ReplayLayerId } from "../../replay/layer-types.ts";

export const ALL_REPLAY_LAYERS: ReplayLayer[] = [
  mapLayer,
  grenadePathsLayer,
  utilitiesLayer,
  shotsLayer,
  playersLayer,
];

const LAYER_BY_ID = new Map<ReplayLayerId, ReplayLayer>(
  ALL_REPLAY_LAYERS.map((layer) => [layer.id as ReplayLayerId, layer]),
);

export interface CreateReplayLayersOptions {
  /** Built-in preset — picks which layers are registered. */
  preset?: "minimal" | "standard" | "full";
  /** Explicit layer ids (overrides preset when set). */
  include?: ReplayLayerId[];
  exclude?: ReplayLayerId[];
  /** Append custom layers (drawn after built-ins at same order rules). */
  custom?: ReplayLayer[];
}

export function createReplayLayers(
  options: CreateReplayLayersOptions = {},
): ReplayLayer[] {
  let ids: ReplayLayerId[];

  if (options.include?.length) {
    ids = options.include;
  } else if (options.preset === "minimal") {
    ids = ["map", "players"];
  } else if (options.preset === "standard") {
    ids = ["map", "utilities", "shots", "players"];
  } else if (options.preset === "full") {
    ids = ["map", "grenadePaths", "utilities", "shots", "players"];
  } else {
    ids = ALL_REPLAY_LAYERS.map((l) => l.id as ReplayLayerId);
  }

  if (options.exclude?.length) {
    const excluded = new Set(options.exclude);
    ids = ids.filter((id) => !excluded.has(id));
  }

  const layers = ids
    .map((id) => LAYER_BY_ID.get(id))
    .filter((l): l is ReplayLayer => l != null);

  if (options.custom?.length) {
    layers.push(...options.custom);
  }

  return [...layers].sort((a, b) => a.order - b.order);
}
