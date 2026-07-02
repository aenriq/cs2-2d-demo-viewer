import type { DemoMapMeta } from "../types.ts";

/** Official CS2 overview PNGs mirrored from game assets. */
export const OFFICIAL_RADAR_CDN_BASE =
  "https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars";

export type RadarLevel = "upper" | "lower";

const LOWER_RADAR_MAPS = new Set(["de_nuke", "de_train", "de_vertigo"]);

/** Upper/lower overview PNG URL for a map name (e.g. `de_dust2`). */
export function getOfficialRadarUrl(
  mapName: string,
  level: RadarLevel = "upper",
): string {
  const suffix =
    level === "lower" ? "_lower_radar_psd.png" : "_radar_psd.png";
  return `${OFFICIAL_RADAR_CDN_BASE}/${mapName}${suffix}`;
}

export function buildDemoMapMeta(
  mapName: string,
  options?: { thresholdZ?: number },
): DemoMapMeta {
  const mapMeta: DemoMapMeta = {
    radarUrl: getOfficialRadarUrl(mapName, "upper"),
  };

  if (options?.thresholdZ != null) {
    mapMeta.thresholdZ = options.thresholdZ;
  }

  if (LOWER_RADAR_MAPS.has(mapName)) {
    mapMeta.lowerRadarUrl = getOfficialRadarUrl(mapName, "lower");
  }

  return mapMeta;
}

/** Fill empty `radarUrl` from map name; keeps explicit overrides. */
export function resolveDemoMapMeta(
  mapName: string,
  mapMeta?: DemoMapMeta | null,
): DemoMapMeta | null {
  if (mapName === "unknown") {
    return mapMeta ?? null;
  }

  const fallback = buildDemoMapMeta(mapName, {
    thresholdZ: mapMeta?.thresholdZ,
  });

  if (!mapMeta) {
    return fallback;
  }

  return {
    ...fallback,
    ...mapMeta,
    radarUrl: mapMeta.radarUrl?.trim() ? mapMeta.radarUrl : fallback.radarUrl,
    lowerRadarUrl: mapMeta.lowerRadarUrl ?? fallback.lowerRadarUrl,
  };
}
