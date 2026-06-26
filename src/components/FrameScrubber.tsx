import type { InputHTMLAttributes } from "react";

export interface FrameScrubberProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  frameIndex: number;
  maxFrameIndex: number;
  onFrameIndexChange: (index: number) => void;
}

/** Unstyled frame range input. */
export function FrameScrubber({
  frameIndex,
  maxFrameIndex,
  onFrameIndexChange,
  min = 0,
  ...rest
}: FrameScrubberProps) {
  return (
    <input
      type="range"
      min={min}
      max={maxFrameIndex}
      value={frameIndex}
      onChange={(e) => onFrameIndexChange(Number(e.target.value))}
      {...rest}
    />
  );
}
