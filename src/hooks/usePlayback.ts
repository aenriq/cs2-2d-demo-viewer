import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DemoFrame } from "../types.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";
import {
  findFrameIndexForRound,
  findFrameIndexForTick,
  getLiveRoundForFrameIndex,
  getNextPlayableRound,
  getPlayableRounds,
  getRoundFrameBounds,
  type RoundFrameBounds,
} from "../utils/demo-rounds.ts";

export interface UsePlaybackOptions {
  initialFrameIndex?: number;
  frameIndex?: number;
  onFrameIndexChange?: (index: number, frame: DemoFrame) => void;
  /** Inclusive scrub/play range — overrides round-scoped bounds when set. */
  minFrameIndex?: number;
  maxFrameIndex?: number;
  /** Pause playback once continuous tick reaches this value. */
  stopTick?: number;
  /** Limit scrub/play to the round at the current frame. */
  roundScopedScrubber?: boolean;
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
  roundFrameBounds: RoundFrameBounds | null;
}

export function usePlayback(
  demo: DemoReplayLike | null,
  options: UsePlaybackOptions = {},
): UsePlaybackResult {
  const isControlled = options.frameIndex !== undefined;
  const [internalIndex, setInternalIndex] = useState(options.initialFrameIndex ?? 0);
  const [playbackTick, setPlaybackTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [activeRoundNumber, setActiveRoundNumber] = useState<number | undefined>(
    undefined,
  );
  const rafRef = useRef<number | null>(null);
  const playStartRef = useRef({ wall: 0, tick: 0 });
  const activeBoundsRef = useRef<RoundFrameBounds | null>(null);

  const frameIndex = isControlled ? options.frameIndex! : internalIndex;
  const demoMaxIndex = Math.max(0, (demo?.frames.length ?? 1) - 1);

  const roundFrameBounds = useMemo(() => {
    if (!options.roundScopedScrubber || !demo) return null;

    const playableRounds = getPlayableRounds(demo);
    const round =
      playableRounds.find((entry) => entry.number === activeRoundNumber) ??
      playableRounds[0];

    return getRoundFrameBounds(demo, round);
  }, [activeRoundNumber, demo, options.roundScopedScrubber]);

  useEffect(() => {
    activeBoundsRef.current = roundFrameBounds;
  }, [roundFrameBounds]);

  const minIndex = Math.max(
    0,
    options.minFrameIndex ?? roundFrameBounds?.startFrameIndex ?? 0,
  );
  const maxIndex = Math.min(
    demoMaxIndex,
    options.maxFrameIndex ?? roundFrameBounds?.endFrameIndex ?? demoMaxIndex,
  );
  const boundedMaxIndex = Math.max(minIndex, maxIndex);
  const tickRate = demo?.tickRate ?? 64;
  const endTick =
    options.stopTick ??
    roundFrameBounds?.endTick ??
    demo?.frames[boundedMaxIndex]?.tick ??
    0;

  const clampToDemo = useCallback(
    (index: number) => Math.max(0, Math.min(index, demoMaxIndex)),
    [demoMaxIndex],
  );

  const clampToRound = useCallback(
    (index: number) => Math.max(minIndex, Math.min(index, boundedMaxIndex)),
    [minIndex, boundedMaxIndex],
  );

  const onFrameIndexChange = options.onFrameIndexChange;

  const advanceToNextRound = useCallback(
    (wallTime: number): boolean => {
      if (!options.roundScopedScrubber || !demo) return false;

      const bounds = activeBoundsRef.current;
      if (!bounds) return false;

      const nextRound = getNextPlayableRound(demo, activeRoundNumber);
      if (!nextRound) return false;

      const nextBounds = getRoundFrameBounds(demo, nextRound);
      if (!nextBounds) return false;

      setActiveRoundNumber(nextRound.number);
      activeBoundsRef.current = nextBounds;
      playStartRef.current = { wall: wallTime, tick: nextBounds.startTick };
      if (!isControlled) setInternalIndex(nextBounds.startFrameIndex);
      setPlaybackTick(nextBounds.startTick);
      return true;
    },
    [activeRoundNumber, demo, isControlled, options.roundScopedScrubber],
  );

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

      const next = clampToDemo(index);
      syncTickToIndex(next);
      if (!isControlled) setInternalIndex(next);
      if (options.roundScopedScrubber && demo) {
        const liveRound = getLiveRoundForFrameIndex(demo, next);
        if (liveRound) setActiveRoundNumber(liveRound.number);
      }
      const frame = demo?.frames[next];
      if (frame && onFrameIndexChange) {
        onFrameIndexChange(next, frame);
      }
    },
    [clampToDemo, demo, isControlled, onFrameIndexChange, options.roundScopedScrubber, syncTickToIndex],
  );

  const pause = useCallback(() => {
    setPlaying(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const stepForward = useCallback(() => {
    setFrameIndex(clampToRound(frameIndex + 1));
  }, [clampToRound, frameIndex, setFrameIndex]);

  const stepBackward = useCallback(() => {
    setFrameIndex(clampToRound(frameIndex - 1));
  }, [clampToRound, frameIndex, setFrameIndex]);

  const play = useCallback(() => {
    if (!demo || demo.frames.length === 0) return;

    let playHeadIndex = clampToRound(frameIndex);

    if (frameIndex >= boundedMaxIndex) {
      if (
        options.roundScopedScrubber &&
        advanceToNextRound(performance.now())
      ) {
        setPlaying(true);
        return;
      }

      playHeadIndex = minIndex;
      syncTickToIndex(minIndex);
      if (!isControlled) setInternalIndex(minIndex);
    }

    playStartRef.current = {
      wall: performance.now(),
      tick: demo.frames[playHeadIndex]?.tick ?? 0,
    };
    setPlaying(true);
  }, [
    advanceToNextRound,
    clampToRound,
    demo,
    frameIndex,
    boundedMaxIndex,
    minIndex,
    isControlled,
    options.roundScopedScrubber,
    syncTickToIndex,
  ]);

  const togglePlay = useCallback(() => {
    if (playing) pause();
    else play();
  }, [pause, play, playing]);

  useEffect(() => {
    if (!playing || !demo) return;

    const animate = (now: number) => {
      const elapsedSec = (now - playStartRef.current.wall) / 1000;
      const nextTick = playStartRef.current.tick + elapsedSec * tickRate;
      const activeEndTick =
        activeBoundsRef.current?.endTick ?? endTick;

      if (nextTick >= activeEndTick) {
        if (options.roundScopedScrubber && advanceToNextRound(now)) {
          rafRef.current = requestAnimationFrame(animate);
          return;
        }

        setPlaybackTick(activeEndTick);
        if (!isControlled) setInternalIndex(boundedMaxIndex);
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
  }, [
    advanceToNextRound,
    demo,
    endTick,
    isControlled,
    boundedMaxIndex,
    options.roundScopedScrubber,
    pause,
    playing,
    tickRate,
  ]);

  useEffect(() => {
    if (!demo) return;

    pause();
    const firstRoundNumber = getPlayableRounds(demo)[0]?.number;
    setActiveRoundNumber(firstRoundNumber);
    const defaultIndex = options.roundScopedScrubber
      ? findFrameIndexForRound(demo, firstRoundNumber ?? 1)
      : 0;
    const index = clampToDemo(options.initialFrameIndex ?? defaultIndex);
    if (!isControlled) setInternalIndex(index);
    syncTickToIndex(index);
  }, [
    demo,
    pause,
    isControlled,
    clampToDemo,
    options.initialFrameIndex,
    options.roundScopedScrubber,
    syncTickToIndex,
  ]);

  useEffect(() => {
    if (!isControlled && !playing) {
      setInternalIndex((index) => clampToRound(index));
    }
    const tick = demo?.frames[clampToRound(frameIndex)]?.tick ?? 0;
    setPlaybackTick((current) => (playing ? current : tick));
  }, [
    clampToRound,
    demo,
    frameIndex,
    isControlled,
    minIndex,
    boundedMaxIndex,
    endTick,
    playing,
  ]);

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
    roundFrameBounds,
  };
}
