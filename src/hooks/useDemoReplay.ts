import { useCallback, useMemo, useState } from "react";
import { useOptionalDemoReplayPlayer } from "../context/DemoReplayPlayerContext.tsx";
import type { DemoFrame, DemoReplayData, DemoRound, PlayerFrame } from "../types.ts";
import type { DrawFrameOptions } from "../canvas/draw-frame.ts";
import type { DemoReplayPlayerConfig } from "../replay/player-config.ts";
import type { ReplayLayerPreset, ReplayViewPreset } from "../replay/view-presets.ts";
import type { CreateReplayLayersOptions } from "../canvas/layers/index.tsx";
import type { DemoReplayInput } from "../replay/normalize-demo.ts";
import { usePlayback, type UsePlaybackOptions } from "./usePlayback.ts";
import { useReplayView, type UseReplayViewOptions } from "./useReplayView.ts";
import { useRoundNavigation } from "./useRoundNavigation.ts";
import { getInterpolatedFrame } from "../utils/interpolate-frame.ts";
import type { RoundFrameBounds } from "../utils/demo-rounds.ts";

export interface UseDemoReplayOptions
  extends Pick<
    UsePlaybackOptions,
    "initialFrameIndex" | "frameIndex" | "onFrameIndexChange"
  > {
  playerConfig?: DemoReplayPlayerConfig;
  /** Override factory config — limit seekbar to active round. */
  roundScopedScrubber?: boolean;
  viewPreset?: ReplayViewPreset;
  view?: UseReplayViewOptions;
  layerPreset?: ReplayLayerPreset;
  layerOptions?: Omit<CreateReplayLayersOptions, "preset">;
}

export interface UseDemoReplayResult {
  frameIndex: number;
  playbackTick: number;
  playing: boolean;
  setFrameIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  maxFrameIndex: number;
  /** Seekbar range — full demo or active round when round-scoped. */
  scrubMinFrameIndex: number;
  scrubMaxFrameIndex: number;
  roundScopedScrubber: boolean;
  roundFrameBounds: RoundFrameBounds | null;
  currentFrame: DemoFrame | undefined;
  /** Lerped frame while playing; exact frame when paused. */
  displayFrame: DemoFrame | undefined;
  currentTick: number | undefined;
  demoRounds: DemoRound[];
  currentRound: DemoRound | undefined;
  currentPhaseRound: DemoRound | undefined;
  goToRound: (roundNumber: number) => void;
  goToNextRound: () => void;
  goToPreviousRound: () => void;
  hasPreviousRound: boolean;
  hasNextRound: boolean;
  playerConfig: DemoReplayPlayerConfig | null;
  capabilities: DemoReplayPlayerConfig["capabilities"];
  drawOptions: DrawFrameOptions;
  layerPreset: ReplayLayerPreset;
  layerOptions?: Omit<CreateReplayLayersOptions, "preset">;
  canToggleTracers: boolean;
  canToggleUtilities: boolean;
  canToggleGrenadePaths: boolean;
  canToggleFlashOverlay: boolean;
  canTogglePlayerNames: boolean;
  showTracers: boolean;
  setShowTracers: (value: boolean) => void;
  toggleTracers: () => void;
  showPlayerNames: boolean;
  setShowPlayerNames: (value: boolean) => void;
  togglePlayerNames: () => void;
  showUtilities: boolean;
  setShowUtilities: (value: boolean) => void;
  toggleUtilities: () => void;
  showGrenadePaths: boolean;
  setShowGrenadePaths: (value: boolean) => void;
  toggleGrenadePaths: () => void;
  showFlashOverlay: boolean;
  setShowFlashOverlay: (value: boolean) => void;
  toggleFlashOverlay: () => void;
  selectedSteamId: string | null;
  setSelectedSteamId: (steamId: string | null) => void;
  selectPlayer: (player: PlayerFrame | null) => void;
}

export function useDemoReplay(
  demo: DemoReplayData | DemoReplayInput | null,
  options: UseDemoReplayOptions = {},
): UseDemoReplayResult {
  const contextConfig = useOptionalDemoReplayPlayer();
  const playerConfig = options.playerConfig ?? contextConfig;

  const layerPreset =
    options.layerPreset ??
    options.viewPreset ??
    playerConfig?.layerPreset ??
    "full";

  const roundScopedScrubber =
    options.roundScopedScrubber ?? playerConfig?.roundScopedScrubber ?? false;

  const playback = usePlayback(demo, {
    initialFrameIndex: options.initialFrameIndex,
    frameIndex: options.frameIndex,
    onFrameIndexChange: options.onFrameIndexChange,
    roundScopedScrubber,
  });

  const roundNav = useRoundNavigation({ demo, playback });

  const view = useReplayView({
    preset: options.viewPreset,
    initial: playerConfig?.defaultDrawOptions,
    capabilities: playerConfig?.capabilities,
    ...options.view,
  });

  const drawOptions = useMemo(
    () =>
      playerConfig
        ? playerConfig.applyCapabilities(view.drawOptions)
        : view.drawOptions,
    [playerConfig, view.drawOptions],
  );

  const demoMaxFrameIndex = Math.max(0, (demo?.frames.length ?? 1) - 1);
  const roundFrameBounds = playback.roundFrameBounds;
  const scrubMinFrameIndex = roundFrameBounds?.startFrameIndex ?? 0;
  const scrubMaxFrameIndex =
    roundFrameBounds?.endFrameIndex ?? demoMaxFrameIndex;

  const currentFrame = demo?.frames[playback.frameIndex];
  const displayFrame = useMemo(() => {
    if (!demo) return undefined;
    if (playback.playing) {
      return getInterpolatedFrame(demo, playback.playbackTick);
    }
    return currentFrame;
  }, [demo, playback.playing, playback.playbackTick, currentFrame]);

  const currentTick = playback.playing
    ? Math.round(playback.playbackTick)
    : currentFrame?.tick;

  const [selectedSteamId, setSelectedSteamId] = useState<string | null>(null);

  const selectPlayer = useCallback((player: PlayerFrame | null) => {
    setSelectedSteamId(player?.steamId ?? null);
  }, []);

  return useMemo(
    () => ({
      frameIndex: playback.frameIndex,
      playbackTick: playback.playbackTick,
      playing: playback.playing,
      setFrameIndex: playback.setFrameIndex,
      play: playback.play,
      pause: playback.pause,
      togglePlay: playback.togglePlay,
      stepForward: playback.stepForward,
      stepBackward: playback.stepBackward,
      maxFrameIndex: demoMaxFrameIndex,
      scrubMinFrameIndex,
      scrubMaxFrameIndex,
      roundScopedScrubber,
      roundFrameBounds,
      currentFrame,
      displayFrame,
      currentTick,
      demoRounds: roundNav.rounds,
      currentRound: roundNav.currentRound,
      currentPhaseRound: roundNav.currentPhaseRound,
      goToRound: roundNav.goToRound,
      goToNextRound: roundNav.goToNextRound,
      goToPreviousRound: roundNav.goToPreviousRound,
      hasPreviousRound: roundNav.hasPreviousRound,
      hasNextRound: roundNav.hasNextRound,
      playerConfig: playerConfig ?? null,
      capabilities: view.capabilities,
      drawOptions,
      layerPreset,
      layerOptions: playerConfig?.layerOptions ?? options.layerOptions,
      canToggleTracers: view.canToggleTracers,
      canToggleUtilities: view.canToggleUtilities,
      canToggleGrenadePaths: view.canToggleGrenadePaths,
      canToggleFlashOverlay: view.canToggleFlashOverlay,
      canTogglePlayerNames: view.canTogglePlayerNames,
      showTracers: view.showTracers,
      setShowTracers: view.setShowTracers,
      toggleTracers: view.toggleTracers,
      showPlayerNames: view.showPlayerNames,
      setShowPlayerNames: view.setShowPlayerNames,
      togglePlayerNames: view.togglePlayerNames,
      showUtilities: view.showUtilities,
      setShowUtilities: view.setShowUtilities,
      toggleUtilities: view.toggleUtilities,
      showGrenadePaths: view.showGrenadePaths,
      setShowGrenadePaths: view.setShowGrenadePaths,
      toggleGrenadePaths: view.toggleGrenadePaths,
      showFlashOverlay: view.showFlashOverlay,
      setShowFlashOverlay: view.setShowFlashOverlay,
      toggleFlashOverlay: view.toggleFlashOverlay,
      selectedSteamId,
      setSelectedSteamId,
      selectPlayer,
    }),
    [
      playback,
      demoMaxFrameIndex,
      scrubMinFrameIndex,
      scrubMaxFrameIndex,
      roundScopedScrubber,
      roundFrameBounds,
      currentFrame,
      displayFrame,
      currentTick,
      roundNav,
      playerConfig,
      view,
      drawOptions,
      layerPreset,
      options.layerOptions,
      selectedSteamId,
      selectPlayer,
    ],
  );
}
