/** Radar image size used by CS2 overview PNGs (square). */
export const RADAR_PX = 1024;

export interface MapMetaEntry {
  posX: number;
  posY: number;
  scale: number;
  /** Z cutoff for lower radar on multi-floor maps (e.g. de_nuke). */
  thresholdZ?: number;
}

/**
 * World → normalized radar coords (0–1) for cs2-demo-viewer.
 * Matches Valve overview VDF + demoinfocs convention.
 */
export function worldToRadar(
  worldX: number,
  worldY: number,
  meta: MapMetaEntry,
): { x: number; y: number } {
  const px = (worldX - meta.posX) / meta.scale;
  const py = (meta.posY - worldY) / meta.scale;
  return { x: px / RADAR_PX, y: py / RADAR_PX };
}

/**
 * Built-in metadata for official/active-duty maps.
 * Extend from game VDFs: csgo/resource/overviews/<map>.txt
 */
export const MAP_META: Record<string, MapMetaEntry> = {
  de_ancient: { posX: -2953, posY: 2164, scale: 5 },
  de_anubis: { posX: -2796, posY: 3328, scale: 5.22 },
  de_dust2: { posX: -2476, posY: 3239, scale: 4.4 },
  de_inferno: { posX: -2087, posY: 3870, scale: 4.9 },
  de_mirage: { posX: -3230, posY: 1713, scale: 5 },
  de_nuke: { posX: -3453, posY: 2887, scale: 7, thresholdZ: -495 },
  de_overpass: { posX: -4831, posY: 1781, scale: 5.2 },
  de_train: { posX: -2477, posY: 2392, scale: 4.7 },
  de_vertigo: { posX: -3168, posY: 1762, scale: 4 },
  de_cache: { posX: -2000, posY: 3250, scale: 5.5 },
  de_cbble: { posX: -3840, posY: 3072, scale: 6 },
};

export function getMapMeta(mapName: string): MapMetaEntry | undefined {
  return MAP_META[mapName];
}
