import { useCallback, useEffect, useRef, useState } from "react";
import type { DemoFrame } from "../types.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";
import { findFrameIndexForTick } from "../utils/rounds.ts";

export interface UsePlaybackOptions {
  initialFrameIndex?: number;
  frameIndex?: number;
  onFrameIndexChange?: (index: number, frame: DemoFrame) => void;
}

export interface UsePlaybackResult {
  frameIndex: number;
  /** Continuous tick — lerped while playing, snapped when scrubbing. */
  playbackTick: number;
  playing: boolean;
  setFrameIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBackward: () => void;
}

export function usePlayback(
  demo: DemoReplayLike | null,
  options: UsePlaybackOptions = {},
): UsePlaybackResult {
  const isControlled = options.frameIndex !== undefined;
  const [internalIndex, setInternalIndex] = useState(options.initialFrameIndex ?? 0);
  const [playbackTick, setPlaybackTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const playStartRef = useRef({ wall: 0, tick: 0 });

  const frameIndex = isControlled ? options.frameIndex! : internalIndex;
  const maxIndex = Math.max(0, (demo?.frames.length ?? 1) - 1);
  const tickRate = demo?.tickRate ?? 64;
  const endTick = demo?.frames[maxIndex]?.tick ?? 0;

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, maxIndex)),
    [maxIndex],
  );

  const onFrameIndexChange = options.onFrameIndexChange;

  const syncTickToIndex = useCallback(
    (index: number) => {
      const tick = demo?.frames[index]?.tick ?? 0;
      setPlaybackTick(tick);
      return tick;
    },
    [demo],
  );

  const setFrameIndex = useCallback(
    (index: number) => {
      setPlaying(false);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const next = clampIndex(index);
      syncTickToIndex(next);
      if (!isControlled) setInternalIndex(next);
      const frame = demo?.frames[next];
      if (frame && onFrameIndexChange) {
        onFrameIndexChange(next, frame);
      }
    },
    [clampIndex, demo, isControlled, onFrameIndexChange, syncTickToIndex],
  );

  const pause = useCallback(() => {
    setPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stepForward = useCallback(() => {
    setFrameIndex(frameIndex + 1);
  }, [frameIndex, setFrameIndex]);

  const stepBackward = useCallback(() => {
    setFrameIndex(frameIndex - 1);
  }, [frameIndex, setFrameIndex]);

  const play = useCallback(() => {
    if (!demo || demo.frames.length === 0) return;
    if (frameIndex >= maxIndex) setFrameIndex(0);
    playStartRef.current = {
      wall: performance.now(),
      tick: demo.frames[clampIndex(frameIndex)]?.tick ?? 0,
    };
    setPlaying(true);
  }, [clampIndex, demo, frameIndex, maxIndex, setFrameIndex]);

  const togglePlay = useCallback(() => {
    if (playing) pause();
    else play();
  }, [pause, play, playing]);

  useEffect(() => {
    if (!playing || !demo) return;

    const animate = (now: number) => {
      const elapsedSec = (now - playStartRef.current.wall) / 1000;
      const nextTick = playStartRef.current.tick + elapsedSec * tickRate;

      if (nextTick >= endTick) {
        setPlaybackTick(endTick);
        if (!isControlled) setInternalIndex(maxIndex);
        pause();
        return;
      }

      setPlaybackTick(nextTick);
      const nextIndex = findFrameIndexForTick(demo, nextTick);
      if (!isControlled) setInternalIndex(nextIndex);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [demo, endTick, isControlled, maxIndex, pause, playing, tickRate]);

  useEffect(() => {
    pause();
    const index = clampIndex(options.initialFrameIndex ?? 0);
    if (!isControlled) setInternalIndex(index);
    syncTickToIndex(index);
  }, [demo, pause, isControlled, clampIndex, options.initialFrameIndex, syncTickToIndex]);

  return {
    frameIndex,
    playbackTick,
    playing,
    setFrameIndex,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
  };
}
