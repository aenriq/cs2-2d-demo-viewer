import { useMemo } from "react";
import { useDemoReplay, type UseDemoReplayOptions } from "../hooks/useDemoReplay.ts";
import { useKillfeed } from "../hooks/useKillfeed.ts";
import type { DemoReplayInput } from "../replay/normalize-demo.ts";
import { DemoEventList } from "./DemoEventList.tsx";
import { DemoKillfeed } from "./DemoKillfeed.tsx";
import { DemoRadar } from "./DemoRadar.tsx";
import { PlaybackControls } from "./PlaybackControls.tsx";
import { RoundSelector } from "./RoundSelector.tsx";

export interface DemoReplayPlayerProps extends UseDemoReplayOptions {
  /** Parsed replay JSON — same shape as {@link DemoRadar} / {@link useDemoReplay}. */
  demo: DemoReplayInput;
  /** Root wrapper `className`. */
  className?: string;
  /** Render {@link PlaybackControls} below the radar. @defaultValue `true` */
  showPlaybackControls?: boolean;
  /** Render {@link RoundSelector} below playback. @defaultValue `true` */
  showRoundSelector?: boolean;
  /**
   * Render full event log ({@link DemoEventList}) synced to replay tick.
   *
   * Shows all event types (kills, round start/end, bomb events), not just kills.
   * @defaultValue `false`
   */
  showEventLog?: boolean;
  /**
   * Render in-game-style killfeed ({@link DemoKillfeed}) synced to replay tick.
   *
   * Uses {@link useKillfeed} internally — recent kills only, max 5 rows, ~5s
   * linger. Unstyled; pass `className` via composing your own layout if you need
   * custom styling.
   * @defaultValue `false`
   */
  showKillfeed?: boolean;
}

/** Reference layout — compose hooks + DemoRadar yourself for full control. */
export function DemoReplayPlayer({
  demo,
  className,
  showPlaybackControls = true,
  showRoundSelector = true,
  showEventLog = false,
  showKillfeed = false,
  viewPreset = "full",
  layerPreset,
  ...replayOptions
}: DemoReplayPlayerProps) {
  const replay = useDemoReplay(demo, {
    viewPreset,
    layerPreset: layerPreset ?? viewPreset,
    ...replayOptions,
  });

  const events = useMemo(() => demo.events ?? [], [demo.events]);
  const killfeed = useKillfeed(demo, { currentTick: replay.currentTick });
  const disabled = (demo.frames?.length ?? 0) === 0;

  return (
    <div className={className}>
      <DemoRadar
        demo={demo}
        frameIndex={replay.frameIndex}
        playbackTick={replay.playbackTick}
        playing={replay.playing}
        drawOptions={replay.drawOptions}
        layerPreset={replay.layerPreset}
        layerOptions={replay.layerOptions}
        selectedSteamId={replay.selectedSteamId}
        onPlayerClick={replay.selectPlayer}
      />

      {showPlaybackControls && (
        <PlaybackControls
          playing={replay.playing}
          onTogglePlay={replay.togglePlay}
          frameIndex={replay.frameIndex}
          maxFrameIndex={replay.maxFrameIndex}
          onFrameIndexChange={replay.setFrameIndex}
          disabled={disabled}
        />
      )}

      {showRoundSelector && (
        <RoundSelector
          demo={demo}
          currentRoundNumber={replay.currentRound?.number}
          onRoundSelect={(round) => replay.goToRound(round.number)}
        />
      )}

      {showKillfeed && <DemoKillfeed entries={killfeed.entries} />}

      {showEventLog && (
        <DemoEventList events={events} currentTick={replay.currentTick} />
      )}
    </div>
  );
}
