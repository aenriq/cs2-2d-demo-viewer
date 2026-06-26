import { useMemo } from "react";
import { useDemoReplay, type UseDemoReplayOptions } from "../hooks/useDemoReplay.ts";
import type { DemoReplayInput } from "../replay/normalize-demo.ts";
import { DemoEventList } from "./DemoEventList.tsx";
import { DemoRadar } from "./DemoRadar.tsx";
import { PlaybackControls } from "./PlaybackControls.tsx";
import { RoundSelector } from "./RoundSelector.tsx";

export interface DemoReplayPlayerProps extends UseDemoReplayOptions {
  demo: DemoReplayInput;
  className?: string;
  showPlaybackControls?: boolean;
  showRoundSelector?: boolean;
  showEventLog?: boolean;
}

/** Reference layout — compose hooks + DemoRadar yourself for full control. */
export function DemoReplayPlayer({
  demo,
  className,
  showPlaybackControls = true,
  showRoundSelector = true,
  showEventLog = false,
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
  const disabled = (demo.frames?.length ?? 0) === 0;

  return (
    <div className={className}>
      <DemoRadar
        demo={demo}
        frameIndex={replay.frameIndex}
        drawOptions={replay.drawOptions}
        layerPreset={replay.layerPreset}
        layerOptions={replay.layerOptions}
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

      {showEventLog && (
        <DemoEventList events={events} currentTick={replay.currentTick} />
      )}
    </div>
  );
}
