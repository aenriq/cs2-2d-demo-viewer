import { useCallback, useEffect, useRef, useState } from "react";
import { FRAME_TICK_INTERVAL } from "../canvas/constants.ts";
import type { DemoFrame } from "../types.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";

export interface UsePlaybackOptions {
  initialFrameIndex?: number;
  frameIndex?: number;
  onFrameIndexChange?: (index: number, frame: DemoFrame) => void;
}

export interface UsePlaybackResult {
  frameIndex: number;
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
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const frameIndex = isControlled ? options.frameIndex! : internalIndex;
  const maxIndex = Math.max(0, (demo?.frames.length ?? 1) - 1);

  const clampIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, maxIndex)),
    [maxIndex],
  );

  const onFrameIndexChange = options.onFrameIndexChange;

  const setFrameIndex = useCallback(
    (index: number) => {
      const next = clampIndex(index);
      if (!isControlled) setInternalIndex(next);
      const frame = demo?.frames[next];
      if (frame && onFrameIndexChange) {
        onFrameIndexChange(next, frame);
      }
    },
    [clampIndex, demo, isControlled, onFrameIndexChange],
  );

  const pause = useCallback(() => {
    setPlaying(false);
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
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
    setPlaying(true);
  }, [demo, frameIndex, maxIndex, setFrameIndex]);

  const togglePlay = useCallback(() => {
    if (playing) pause();
    else play();
  }, [pause, play, playing]);

  useEffect(() => {
    if (!playing || !demo) return;

    if (frameIndex >= maxIndex) {
      pause();
      return;
    }

    const msPerFrame = 1000 / ((demo.tickRate ?? 64) / FRAME_TICK_INTERVAL);
    timerRef.current = setTimeout(() => {
      setFrameIndex(frameIndex + 1);
    }, msPerFrame);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [demo, frameIndex, maxIndex, pause, playing, setFrameIndex]);

  useEffect(() => {
    pause();
    if (!isControlled) setInternalIndex(clampIndex(options.initialFrameIndex ?? 0));
  }, [demo, pause, isControlled, clampIndex, options.initialFrameIndex]);

  return {
    frameIndex,
    playing,
    setFrameIndex,
    play,
    pause,
    togglePlay,
    stepForward,
    stepBackward,
  };
}
