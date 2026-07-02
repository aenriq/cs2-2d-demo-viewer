import { useCallback, useMemo } from "react";
import type { DemoRound } from "../types.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";
import type { UsePlaybackResult } from "./usePlayback.ts";
import {
  findFrameIndexForRound,
  getPlayableRounds,
  getRoundAtTick,
  getRoundIndex,
} from "../utils/rounds.ts";

export interface UseRoundNavigationOptions {
  demo: DemoReplayLike | null;
  playback: Pick<UsePlaybackResult, "frameIndex" | "setFrameIndex" | "pause">;
}

export interface UseRoundNavigationResult {
  rounds: DemoRound[];
  /** Competitive round at playhead — undefined during warmup/knife. */
  currentRound: DemoRound | undefined;
  /** Any phase at playhead (warmup / knife / live). */
  currentPhaseRound: DemoRound | undefined;
  currentRoundIndex: number;
  goToRound: (roundNumber: number) => void;
  goToNextRound: () => void;
  goToPreviousRound: () => void;
  hasPreviousRound: boolean;
  hasNextRound: boolean;
}

export function useRoundNavigation({
  demo,
  playback,
}: UseRoundNavigationOptions): UseRoundNavigationResult {
  const rounds = useMemo(
    () => (demo ? getPlayableRounds(demo) : []),
    [demo],
  );

  const currentPhaseRound = useMemo(() => {
    if (!demo) return undefined;
    const frame = demo.frames[playback.frameIndex];
    if (!frame) return undefined;
    return getRoundAtTick(demo, frame.tick);
  }, [demo, playback.frameIndex]);

  const currentRound = useMemo(() => {
    return currentPhaseRound?.kind === "live" ? currentPhaseRound : undefined;
  }, [currentPhaseRound]);

  const currentRoundIndex = useMemo(
    () => (demo ? getRoundIndex(demo, currentRound?.number) : -1),
    [demo, currentRound?.number],
  );

  const goToRound = useCallback(
    (roundNumber: number) => {
      if (!demo) return;
      playback.pause();
      playback.setFrameIndex(findFrameIndexForRound(demo, roundNumber));
    },
    [demo, playback],
  );

  const goToNextRound = useCallback(() => {
    if (!demo || currentRoundIndex < 0) return;
    const next = rounds[currentRoundIndex + 1];
    if (next) goToRound(next.number);
  }, [demo, currentRoundIndex, goToRound, rounds]);

  const goToPreviousRound = useCallback(() => {
    if (!demo || currentRoundIndex <= 0) return;
    const prev = rounds[currentRoundIndex - 1];
    if (prev) goToRound(prev.number);
  }, [demo, currentRoundIndex, goToRound, rounds]);

  return {
    rounds,
    currentRound,
    currentPhaseRound,
    currentRoundIndex,
    goToRound,
    goToNextRound,
    goToPreviousRound,
    hasPreviousRound: currentRoundIndex > 0,
    hasNextRound: currentRoundIndex >= 0 && currentRoundIndex < rounds.length - 1,
  };
}
