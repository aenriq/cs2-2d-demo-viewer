import type { ButtonHTMLAttributes } from "react";

export interface PlaybackButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  playing: boolean;
  playLabel?: string;
  pauseLabel?: string;
}

/** Unstyled play / pause toggle. */
export function PlaybackButton({
  playing,
  playLabel = "Play",
  pauseLabel = "Pause",
  type = "button",
  children,
  ...rest
}: PlaybackButtonProps) {
  return (
    <button type={type} data-playing={playing ? "" : undefined} {...rest}>
      {children ?? (playing ? pauseLabel : playLabel)}
    </button>
  );
}
