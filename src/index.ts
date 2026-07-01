export { DemoRadar } from "./components/DemoRadar.tsx";
export type { DemoRadarProps } from "./components/DemoRadar.tsx";

export { DemoReplayPlayer } from "./components/DemoReplayPlayer.tsx";
export type { DemoReplayPlayerProps } from "./components/DemoReplayPlayer.tsx";

export { RoundSelector } from "./components/RoundSelector.tsx";
export type { RoundSelectorProps } from "./components/RoundSelector.tsx";

export { PlaybackButton } from "./components/PlaybackButton.tsx";
export type { PlaybackButtonProps } from "./components/PlaybackButton.tsx";

export { FrameScrubber } from "./components/FrameScrubber.tsx";
export type { FrameScrubberProps } from "./components/FrameScrubber.tsx";

export { PlaybackControls } from "./components/PlaybackControls.tsx";
export type { PlaybackControlsProps } from "./components/PlaybackControls.tsx";

export { DemoEventList, formatDemoEvent } from "./components/DemoEventList.tsx";
export type { DemoEventListProps } from "./components/DemoEventList.tsx";

export { DemoKillfeed, formatKillfeedEntry } from "./components/DemoKillfeed.tsx";
export type { DemoKillfeedProps } from "./components/DemoKillfeed.tsx";

export { drawReplayFrame, getRoundAtTick } from "./canvas/draw-frame.ts";
export type { DrawFrameOptions } from "./canvas/draw-frame.ts";

export {
  findFrameIndexForRound,
  findFrameIndexForTick,
  getRoundForFrameIndex,
  getRoundIndex,
} from "./utils/rounds.ts";

export {
  BEAK_LENGTH,
  BEAK_WIDTH,
  DEFAULT_CANVAS_SIZE,
  FRAME_TICK_INTERVAL,
  PLAYER_RADIUS,
  SHOT_LIFETIME_TICKS,
} from "./canvas/constants.ts";

export { teamFill, teamStroke, teamTracer, teamEmptyGlass } from "./canvas/colors.ts";

export { useRadarImage } from "./hooks/useRadarImage.ts";
export type { UseRadarImageResult } from "./hooks/useRadarImage.ts";

export { usePlayback } from "./hooks/usePlayback.ts";
export type { UsePlaybackOptions, UsePlaybackResult } from "./hooks/usePlayback.ts";

export { useRoundNavigation } from "./hooks/useRoundNavigation.ts";
export type {
  UseRoundNavigationOptions,
  UseRoundNavigationResult,
} from "./hooks/useRoundNavigation.ts";

export { useReplayView } from "./hooks/useReplayView.ts";
export type {
  ReplayViewInitial,
  UseReplayViewOptions,
  UseReplayViewResult,
} from "./hooks/useReplayView.ts";

export {
  ALL_REPLAY_LAYERS,
  createReplayLayers,
  grenadePathsLayer,
  mapLayer,
  playersLayer,
  shotsLayer,
  utilitiesLayer,
} from "./canvas/layers/index.ts";
export type { CreateReplayLayersOptions } from "./canvas/layers/index.ts";

export {
  normalizeDemoReplay,
  isMinimalDemo,
} from "./replay/normalize-demo.ts";
export type { DemoReplayInput, DemoReplayLike } from "./replay/normalize-demo.ts";

export {
  REPLAY_LAYER_PRESETS,
  REPLAY_VIEW_PRESETS,
  resolveViewPreset,
} from "./replay/view-presets.ts";
export type {
  ReplayLayerPreset,
  ReplayViewPreset,
} from "./replay/view-presets.ts";

export type { ReplayLayer, ReplayLayerContext, ReplayLayerId } from "./replay/layer-types.ts";

export {
  createDemoReplayPlayer,
} from "./replay/create-demo-replay-player.tsx";
export type { DemoReplayPlayerInstance } from "./replay/create-demo-replay-player.tsx";

export {
  DemoReplayPlayerProvider,
  useDemoReplayPlayer,
  useOptionalDemoReplayPlayer,
} from "./context/DemoReplayPlayerContext.tsx";

export {
  resolvePlayerConfig,
  applyPlayerCapabilities,
  DEFAULT_DEMO_REPLAY_CAPABILITIES,
} from "./replay/player-config.ts";
export type {
  CreateDemoReplayPlayerOptions,
  DemoReplayPlayerCapabilities,
  DemoReplayPlayerConfig,
} from "./replay/player-config.ts";

export { useDemoReplay } from "./hooks/useDemoReplay.ts";
export type { UseDemoReplayOptions, UseDemoReplayResult } from "./hooks/useDemoReplay.ts";

export { useKillfeed } from "./hooks/useKillfeed.ts";
export type { UseKillfeedOptions, UseKillfeedResult } from "./hooks/useKillfeed.ts";

export { useEconomy } from "./hooks/useEconomy.ts";
export type { UseEconomyOptions, UseEconomyResult } from "./hooks/useEconomy.ts";

export {
  classifyBuyType,
  computeTeamTotals,
  getEconomyForFrameIndex,
  getEconomyForTick,
  getRoundEconomy,
  hasEconomyInDemo,
  sortEconomyPlayers,
} from "./utils/economy.ts";
export type {
  BuyType,
  EconomySortBy,
  EconomyTeamTotals,
} from "./utils/economy.ts";

export {
  getKillfeedDisplayDurationTicks,
  getKillfeedEntries,
  getKillfeedEntriesForDemo,
  isKillEvent,
} from "./utils/killfeed.ts";
export type {
  GetKillfeedEntriesOptions,
  KillEvent,
  KillfeedEntry,
} from "./utils/killfeed.ts";

export type {
  DemoEvent,
  DemoFrame,
  DemoMapMeta,
  DemoPlayerEconomy,
  DemoPurchase,
  DemoReplayData,
  DemoRound,
  DemoRoundEconomy,
  DemoShot,
  DemoUtilityEffect,
  DemoGrenadePath,
  UtilityType,
  MapMeta,
  ParsedDemo,
  PlayerFrame,
  RadarPoint,
  Team,
} from "./types.ts";
