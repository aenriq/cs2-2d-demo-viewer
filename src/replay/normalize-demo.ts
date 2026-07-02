import type { DemoReplayData } from "../types.ts";
import { resolveDemoMapMeta } from "../utils/radar-url.ts";
import { normalizeDemoRounds } from "../utils/demo-rounds.ts";

/** Minimal JSON — only map + frames required. */
export type DemoReplayInput = Partial<DemoReplayData> &
  Pick<DemoReplayData, "map" | "frames">;

/** Full or partial demo JSON — safe for hooks and utils. */
export type DemoReplayLike = DemoReplayInput | DemoReplayData;

/**
 * Fill missing optional replay fields so layers can safely no-op.
 * Use before passing partial JSON into DemoRadar / hooks.
 */
export function normalizeDemoReplay(input: DemoReplayInput): DemoReplayData {
  const lastFrame = input.frames[input.frames.length - 1];

  return {
    map: input.map,
    tickRate: input.tickRate ?? 64,
    frameTickInterval: input.frameTickInterval,
    totalTicks: input.totalTicks ?? lastFrame?.tick ?? 0,
    rounds: normalizeDemoRounds(input),
    frames: input.frames,
    events: input.events ?? [],
    shots: input.shots ?? [],
    utilities: input.utilities ?? [],
    grenadePaths: input.grenadePaths ?? [],
    mapMeta: resolveDemoMapMeta(input.map, input.mapMeta),
  };
}

export function isMinimalDemo(input: DemoReplayInput): boolean {
  return (
    !(input.shots?.length ?? 0) &&
    !(input.utilities?.length ?? 0) &&
    !(input.grenadePaths?.length ?? 0)
  );
}
