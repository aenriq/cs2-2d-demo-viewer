import type { HTMLAttributes } from "react";
import { PlaybackButton } from "./PlaybackButton.tsx";
import { FrameScrubber } from "./FrameScrubber.tsx";

export interface PlaybackControlsProps extends HTMLAttributes<HTMLDivElement> {
  playing: boolean;
  onTogglePlay: () => void;
  frameIndex: number;
  maxFrameIndex: number;
  minFrameIndex?: number;
  onFrameIndexChange: (index: number) => void;
  disabled?: boolean;
  playLabel?: string;
  pauseLabel?: string;
}

/** Unstyled play + scrubber group. Style via className on root or children. */
export function PlaybackControls({
  playing,
  onTogglePlay,
  frameIndex,
  maxFrameIndex,
  minFrameIndex = 0,
  onFrameIndexChange,
  disabled = false,
  playLabel,
  pauseLabel,
  className,
  ...rest
}: PlaybackControlsProps) {
  return (
    <div className={className} {...rest}>
      <PlaybackButton
        playing={playing}
        disabled={disabled}
        onClick={onTogglePlay}
        playLabel={playLabel}
        pauseLabel={pauseLabel}
      />
      <FrameScrubber
        frameIndex={frameIndex}
        min={minFrameIndex}
        maxFrameIndex={maxFrameIndex}
        onFrameIndexChange={onFrameIndexChange}
        disabled={disabled}
      />
    </div>
  );
}
