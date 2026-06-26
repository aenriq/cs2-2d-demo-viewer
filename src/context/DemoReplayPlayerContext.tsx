import { createContext, useContext, type ReactNode } from "react";
import type { DemoReplayPlayerConfig } from "../replay/player-config.ts";

const DemoReplayPlayerContext = createContext<DemoReplayPlayerConfig | null>(
  null,
);

export function DemoReplayPlayerProvider({
  config,
  children,
}: {
  config: DemoReplayPlayerConfig;
  children: ReactNode;
}) {
  return (
    <DemoReplayPlayerContext.Provider value={config}>
      {children}
    </DemoReplayPlayerContext.Provider>
  );
}

/** Player config from nearest provider, or null outside provider. */
export function useOptionalDemoReplayPlayer(): DemoReplayPlayerConfig | null {
  return useContext(DemoReplayPlayerContext);
}

/** Player config from provider — throws if missing. */
export function useDemoReplayPlayer(): DemoReplayPlayerConfig {
  const config = useContext(DemoReplayPlayerContext);
  if (!config) {
    throw new Error(
      "useDemoReplayPlayer must be used within DemoReplayPlayerProvider. " +
        "Initialize with createDemoReplayPlayer() and wrap your tree in player.Provider.",
    );
  }
  return config;
}
