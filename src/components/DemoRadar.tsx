import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_CANVAS_SIZE } from "../canvas/constants.ts";
import {
  createReplayLayers,
  type CreateReplayLayersOptions,
} from "../canvas/layers/index.ts";
import {
  DEFAULT_DRAW_OPTIONS,
  drawReplayFrame,
  type DrawFrameOptions,
} from "../canvas/draw-frame.ts";
import { useOptionalDemoReplayPlayer } from "../context/DemoReplayPlayerContext.tsx";
import { useRadarImage } from "../hooks/useRadarImage.ts";
import {
  normalizeDemoReplay,
  type DemoReplayInput,
} from "../replay/normalize-demo.ts";
import type { DemoReplayPlayerConfig } from "../replay/player-config.ts";
import type { ReplayLayer } from "../replay/layer-types.ts";
import type { ReplayLayerPreset } from "../replay/view-presets.ts";
import type { DemoReplayData } from "../types.ts";

export interface DemoRadarProps {
  demo: DemoReplayInput | DemoReplayData;
  frameIndex: number;
  drawOptions?: DrawFrameOptions;
  /** Init config from `createDemoReplayPlayer()` — auto from provider when omitted. */
  playerConfig?: DemoReplayPlayerConfig;
  layerPreset?: ReplayLayerPreset;
  layers?: ReplayLayer[];
  layerOptions?: Omit<CreateReplayLayersOptions, "preset">;
  normalize?: boolean;
  size?: number;
  className?: string;
  canvasClassName?: string;
  canvasStyle?: CSSProperties;
  radarImage?: HTMLImageElement | null;
  renderLoading?: () => ReactNode;
  renderError?: (error: Error) => ReactNode;
}

export function DemoRadar({
  demo: demoInput,
  frameIndex,
  drawOptions,
  playerConfig: playerConfigProp,
  layerPreset = "full",
  layers: layersProp,
  layerOptions,
  normalize: normalizeProp,
  size: sizeProp,
  className,
  canvasClassName,
  canvasStyle,
  radarImage: radarImageProp,
  renderLoading,
  renderError,
}: DemoRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextConfig = useOptionalDemoReplayPlayer();
  const playerConfig = playerConfigProp ?? contextConfig;

  const normalize = normalizeProp ?? playerConfig?.normalize ?? true;
  const size = sizeProp ?? playerConfig?.canvasSize ?? DEFAULT_CANVAS_SIZE;

  const demo = useMemo(
    () => (normalize ? normalizeDemoReplay(demoInput) : (demoInput as DemoReplayData)),
    [demoInput, normalize],
  );

  const layers = useMemo(
    () =>
      layersProp ??
      playerConfig?.layers ??
      createReplayLayers({
        preset: playerConfig?.layerPreset ?? layerPreset,
        ...layerOptions,
        ...playerConfig?.layerOptions,
      }),
    [layersProp, playerConfig, layerPreset, layerOptions],
  );

  const resolvedDrawOptions = useMemo(() => {
    const base = {
      ...DEFAULT_DRAW_OPTIONS,
      ...playerConfig?.defaultDrawOptions,
      ...drawOptions,
    };
    return playerConfig ? playerConfig.applyCapabilities(base) : base;
  }, [playerConfig, drawOptions]);

  const { image: loadedImage, loading, error } = useRadarImage(
    radarImageProp ? undefined : demo.mapMeta?.radarUrl,
  );
  const radarImage = radarImageProp ?? loadedImage;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !radarImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawReplayFrame(
      ctx,
      demo,
      frameIndex,
      radarImage,
      size,
      resolvedDrawOptions,
      layers,
    );
  }, [demo, frameIndex, radarImage, size, resolvedDrawOptions, layers]);

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        className={canvasClassName}
        width={size}
        height={size}
        style={canvasStyle}
      />
      {!radarImage && loading && renderLoading?.()}
      {error && renderError?.(error)}
    </div>
  );
}
