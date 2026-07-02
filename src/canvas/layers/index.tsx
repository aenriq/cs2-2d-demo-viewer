import type { ReplayLayer, ReplayLayerId } from "../../replay/layer-types.ts";
import { MapLayer } from "../../scene/MapLayer.tsx";
import { GrenadePathsLayer } from "../../scene/GrenadePathsLayer.tsx";
import { UtilitiesLayer } from "../../scene/UtilitiesLayer.tsx";
import { ShotsLayer } from "../../scene/ShotsLayer.tsx";
import { PlayersLayer } from "../../scene/PlayersLayer.tsx";

export const mapLayer: ReplayLayer = {
  id: "map",
  order: 0,
  render: (ctx) => <MapLayer {...ctx} />,
};

export const grenadePathsLayer: ReplayLayer = {
  id: "grenadePaths",
  order: 15,
  isAvailable: (demo) => (demo.grenadePaths?.length ?? 0) > 0,
  render: (ctx) => <GrenadePathsLayer {...ctx} />,
};

export const utilitiesLayer: ReplayLayer = {
  id: "utilities",
  order: 20,
  isAvailable: (demo) => (demo.utilities?.length ?? 0) > 0,
  render: (ctx) => <UtilitiesLayer {...ctx} />,
};

export const shotsLayer: ReplayLayer = {
  id: "shots",
  order: 30,
  isAvailable: (demo) => (demo.shots?.length ?? 0) > 0,
  render: (ctx) => <ShotsLayer {...ctx} />,
};

export const playersLayer: ReplayLayer = {
  id: "players",
  order: 40,
  render: (ctx) => <PlayersLayer {...ctx} />,
};

export { MapLayer } from "../../scene/MapLayer.tsx";
export { GrenadePathsLayer } from "../../scene/GrenadePathsLayer.tsx";
export { UtilitiesLayer } from "../../scene/UtilitiesLayer.tsx";
export { ShotsLayer } from "../../scene/ShotsLayer.tsx";
export { PlayersLayer } from "../../scene/PlayersLayer.tsx";
export { PlayerMarker } from "../../scene/PlayerMarker.tsx";
export { ReplayScene } from "../../scene/ReplayScene.tsx";

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
  preset?: "minimal" | "standard" | "full";
  include?: ReplayLayerId[];
  exclude?: ReplayLayerId[];
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
