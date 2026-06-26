import { useMemo } from "react";
import { useOptionalDemoReplayPlayer } from "../context/DemoReplayPlayerContext.tsx";
import type { DemoFrame, DemoReplayData, DemoRound } from "../types.ts";
import type { DrawFrameOptions } from "../canvas/draw-frame.ts";
import type { DemoReplayPlayerConfig } from "../replay/player-config.ts";
import type { ReplayLayerPreset, ReplayViewPreset } from "../replay/view-presets.ts";
import type { CreateReplayLayersOptions } from "../canvas/layers/index.ts";
import type { DemoReplayInput } from "../replay/normalize-demo.ts";
import { usePlayback, type UsePlaybackOptions } from "./usePlayback.ts";
import { useReplayView, type UseReplayViewOptions } from "./useReplayView.ts";
import { useRoundNavigation } from "./useRoundNavigation.ts";

export interface UseDemoReplayOptions
  extends Pick<UsePlaybackOptions, "initialFrameIndex" | "frameIndex" | "onFrameIndexChange"> {
  /** From `createDemoReplayPlayer()` — auto-read from provider when omitted. */
  playerConfig?: DemoReplayPlayerConfig;
  viewPreset?: ReplayViewPreset;
  view?: UseReplayViewOptions;
  layerPreset?: ReplayLayerPreset;
  layerOptions?: Omit<CreateReplayLayersOptions, "preset">;
}

export interface UseDemoReplayResult {
  frameIndex: number;
  playing: boolean;
  setFrameIndex: (index: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  maxFrameIndex: number;
  currentFrame: DemoFrame | undefined;
  currentTick: number | undefined;
  demoRounds: DemoRound[];
  currentRound: DemoRound | undefined;
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

  const playback = usePlayback(demo, {
    initialFrameIndex: options.initialFrameIndex,
    frameIndex: options.frameIndex,
    onFrameIndexChange: options.onFrameIndexChange,
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

  const maxFrameIndex = Math.max(0, (demo?.frames.length ?? 1) - 1);
  const currentFrame = demo?.frames[playback.frameIndex];
  const currentTick = currentFrame?.tick;

  return useMemo(
    () => ({
      frameIndex: playback.frameIndex,
      playing: playback.playing,
      setFrameIndex: playback.setFrameIndex,
      play: playback.play,
      pause: playback.pause,
      togglePlay: playback.togglePlay,
      stepForward: playback.stepForward,
      stepBackward: playback.stepBackward,
      maxFrameIndex,
      currentFrame,
      currentTick,
      demoRounds: roundNav.rounds,
      currentRound: roundNav.currentRound,
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
    }),
    [
      playback,
      maxFrameIndex,
      currentFrame,
      currentTick,
      roundNav,
      playerConfig,
      view,
      drawOptions,
      layerPreset,
      options.layerOptions,
    ],
  );
}
