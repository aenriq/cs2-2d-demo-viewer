import { type ReactNode } from "react";
import { DemoRadar, type DemoRadarProps } from "../components/DemoRadar.tsx";
import {
  DemoReplayPlayerProvider,
  useOptionalDemoReplayPlayer,
} from "../context/DemoReplayPlayerContext.tsx";
import {
  useDemoReplay,
  type UseDemoReplayOptions,
  type UseDemoReplayResult,
} from "../hooks/useDemoReplay.ts";
import type { DemoReplayInput } from "./normalize-demo.ts";
import type { DemoReplayData } from "../types.ts";
import {
  resolvePlayerConfig,
  type CreateDemoReplayPlayerOptions,
  type DemoReplayPlayerConfig,
} from "./player-config.ts";

export interface DemoReplayPlayerInstance {
  /** Resolved init config — inspect capabilities or pass elsewhere. */
  config: DemoReplayPlayerConfig;
  /** Wrap app (or subtree) once after init. */
  Provider: (props: { children: ReactNode }) => ReactNode;
  /** Read init config (from provider, or factory fallback). */
  usePlayer: () => DemoReplayPlayerConfig;
  /** Playback + view state for a demo JSON file. */
  useDemo: (
    demo: DemoReplayData | DemoReplayInput | null,
    options?: Omit<UseDemoReplayOptions, "playerConfig">,
  ) => UseDemoReplayResult;
  /** Radar canvas wired to init config. */
  Radar: (
    props: Omit<
      DemoRadarProps,
      "playerConfig" | "layers" | "layerPreset" | "layerOptions" | "normalize" | "size"
    >,
  ) => ReactNode;
}

/**
 * Initialize replay player once with capability flags, then use `.Provider`,
 * `.useDemo()`, and `.Radar` anywhere under the provider.
 *
 * Empty options (`createDemoReplayPlayer()` or `{}`) enables all capabilities
 * and the `full` layer preset.
 *
 * @example
 * ```tsx
 * const player = createDemoReplayPlayer({
 *   capabilities: { flashOverlay: false, grenadePaths: false },
 * });
 *
 * <player.Provider>
 *   <MatchReplay demo={demo} />
 * </player.Provider>
 * ```
 */
export function createDemoReplayPlayer(
  options: CreateDemoReplayPlayerOptions = {},
): DemoReplayPlayerInstance {
  const config = resolvePlayerConfig(options);

  function Provider({ children }: { children: ReactNode }) {
    return (
      <DemoReplayPlayerProvider config={config}>{children}</DemoReplayPlayerProvider>
    );
  }

  function usePlayer(): DemoReplayPlayerConfig {
    return useOptionalDemoReplayPlayer() ?? config;
  }

  function useDemo(
    demo: DemoReplayData | DemoReplayInput | null,
    playbackOptions: Omit<UseDemoReplayOptions, "playerConfig"> = {},
  ): UseDemoReplayResult {
    const playerConfig = usePlayer();
    return useDemoReplay(demo, { ...playbackOptions, playerConfig });
  }

  function Radar(
    props: Omit<
      DemoRadarProps,
      "playerConfig" | "layers" | "layerPreset" | "layerOptions" | "normalize" | "size"
    >,
  ) {
    const playerConfig = usePlayer();
    return <DemoRadar {...props} playerConfig={playerConfig} />;
  }

  return { config, Provider, usePlayer, useDemo, Radar };
}
