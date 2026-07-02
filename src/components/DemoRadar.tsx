import { useMemo, type CSSProperties, type ReactNode } from "react";
import { Application } from "@pixi/react";
import { DEFAULT_CANVAS_SIZE } from "../canvas/constants.ts";
import {
  createReplayLayers,
  type CreateReplayLayersOptions,
} from "../canvas/layers/index.tsx";
import {
  DEFAULT_DRAW_OPTIONS,
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
import { ReplayScene } from "../scene/ReplayScene.tsx";
import { getInterpolatedFrame } from "../utils/interpolate-frame.ts";
import type { DemoReplayData, PlayerFrame } from "../types.ts";
import "../scene/pixi-setup.ts";

export interface DemoRadarProps {
  demo: DemoReplayInput | DemoReplayData;
  frameIndex: number;
  /** Continuous tick for lerp + effects timing. Falls back to frame tick when omitted. */
  playbackTick?: number;
  /** When true, player positions are interpolated between frames. */
  playing?: boolean;
  drawOptions?: DrawFrameOptions;
  playerConfig?: DemoReplayPlayerConfig;
  layerPreset?: ReplayLayerPreset;
  layers?: ReplayLayer[];
  layerOptions?: Omit<CreateReplayLayersOptions, "preset">;
  normalize?: boolean;
  size?: number;
  className?: string;
  stageClassName?: string;
  /** @deprecated use stageClassName */
  canvasClassName?: string;
  canvasStyle?: CSSProperties;
  radarImage?: HTMLImageElement | null;
  selectedSteamId?: string | null;
  onPlayerClick?: (player: PlayerFrame) => void;
  onPlayerHover?: (player: PlayerFrame | null) => void;
  renderLoading?: () => ReactNode;
  renderError?: (error: Error) => ReactNode;
}

export function DemoRadar({
  demo: demoInput,
  frameIndex,
  playbackTick,
  playing = false,
  drawOptions,
  playerConfig: playerConfigProp,
  layerPreset = "full",
  layers: layersProp,
  layerOptions,
  normalize: normalizeProp,
  size: sizeProp,
  className,
  stageClassName,
  canvasClassName,
  canvasStyle,
  radarImage: radarImageProp,
  selectedSteamId,
  onPlayerClick,
  onPlayerHover,
  renderLoading,
  renderError,
}: DemoRadarProps) {
  const contextConfig = useOptionalDemoReplayPlayer();
  const playerConfig = playerConfigProp ?? contextConfig;

  const normalize = normalizeProp ?? playerConfig?.normalize ?? true;
  const size = sizeProp ?? playerConfig?.canvasSize ?? DEFAULT_CANVAS_SIZE;
  const canvasClass = stageClassName ?? canvasClassName;

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

  const resolvedTick =
    playbackTick ?? demo.frames[frameIndex]?.tick ?? demo.frames[0]?.tick ?? 0;

  const displayFrame = useMemo(() => {
    if (playing) return getInterpolatedFrame(demo, resolvedTick);
    return demo.frames[frameIndex] ?? { tick: resolvedTick, players: [] };
  }, [demo, frameIndex, playing, resolvedTick]);

  const sceneContext = useMemo(
    () =>
      radarImage
        ? {
            demo,
            frame: displayFrame,
            playbackTick: resolvedTick,
            radarImg: radarImage,
            size,
            options: resolvedDrawOptions,
            selectedSteamId,
            onPlayerClick,
            onPlayerHover,
          }
        : null,
    [
      demo,
      displayFrame,
      resolvedTick,
      radarImage,
      size,
      resolvedDrawOptions,
      selectedSteamId,
      onPlayerClick,
      onPlayerHover,
    ],
  );

  return (
    <div className={className} style={canvasStyle}>
      {radarImage && sceneContext && (
        <div className={canvasClass}>
          <Application
            width={size}
            height={size}
            backgroundAlpha={0}
            antialias
            autoDensity
            resolution={typeof window !== "undefined" ? window.devicePixelRatio : 1}
          >
            <ReplayScene layers={layers} context={sceneContext} />
          </Application>
        </div>
      )}
      {!radarImage && loading && renderLoading?.()}
      {error && renderError?.(error)}
    </div>
  );
}
