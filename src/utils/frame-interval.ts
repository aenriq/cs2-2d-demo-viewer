import type { DemoFrame } from "../types.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";

/** Default parser sample rate when not specified in JSON. */
export const DEFAULT_FRAME_TICK_INTERVAL = 4;

/** Common parser intervals — viewer accepts any positive value. */
export const SUPPORTED_FRAME_TICK_INTERVALS = [4, 8] as const;

/** @deprecated use {@link DEFAULT_FRAME_TICK_INTERVAL} or {@link getFrameTickInterval} */
export const FRAME_TICK_INTERVAL = DEFAULT_FRAME_TICK_INTERVAL;

/** Median tick gap between early frames — handles `--interval 4` and `--interval 8`. */
export function inferFrameTickInterval(frames: DemoFrame[]): number {
  if (frames.length < 2) return DEFAULT_FRAME_TICK_INTERVAL;

  const deltas: number[] = [];
  const sampleCount = Math.min(frames.length - 1, 32);

  for (let i = 1; i <= sampleCount; i++) {
    const delta = frames[i]!.tick - frames[i - 1]!.tick;
    if (delta > 0) deltas.push(delta);
  }

  if (deltas.length === 0) return DEFAULT_FRAME_TICK_INTERVAL;

  deltas.sort((a, b) => a - b);
  return deltas[Math.floor(deltas.length / 2)]!;
}

/** Explicit JSON field wins; otherwise infer from frame spacing. */
export function getFrameTickInterval(demo: DemoReplayLike): number {
  if (demo.frameTickInterval != null && demo.frameTickInterval > 0) {
    return demo.frameTickInterval;
  }
  return inferFrameTickInterval(demo.frames);
}
