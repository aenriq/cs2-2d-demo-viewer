import type { DemoReplayLike } from "../replay/normalize-demo.ts";
import { getRoundAtTick } from "../canvas/draw-frame.ts";

export function findFrameIndexForTick(demo: DemoReplayLike, tick: number): number {
  for (let i = 0; i < demo.frames.length; i++) {
    if (demo.frames[i]!.tick >= tick) return i;
  }
  return Math.max(0, demo.frames.length - 1);
}

export function findFrameIndexForRound(
  demo: DemoReplayLike,
  roundNumber: number,
): number {
  const round = (demo.rounds ?? []).find((r) => r.number === roundNumber);
  if (!round) return 0;
  return findFrameIndexForTick(demo, round.startTick);
}

export function getRoundForFrameIndex(
  demo: DemoReplayLike,
  frameIndex: number,
) {
  const frame = demo.frames[frameIndex];
  if (!frame) return undefined;
  return getRoundAtTick(demo, frame.tick);
}

export function getRoundIndex(
  demo: DemoReplayLike,
  roundNumber: number | undefined,
): number {
  if (roundNumber === undefined) return -1;
  return (demo.rounds ?? []).findIndex((r) => r.number === roundNumber);
}
