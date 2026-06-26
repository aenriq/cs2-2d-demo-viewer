import { useCallback, useMemo, useState } from "react";
import type { DrawFrameOptions } from "../canvas/draw-frame.ts";
import type { DemoReplayPlayerCapabilities } from "../replay/player-config.ts";
import {
  REPLAY_VIEW_PRESETS,
  type ReplayViewPreset,
} from "../replay/view-presets.ts";

export type { ReplayViewInitial } from "../replay/view-presets.ts";
export type { ReplayViewPreset } from "../replay/view-presets.ts";

export interface UseReplayViewOptions {
  preset?: ReplayViewPreset;
  initial?: DrawFrameOptions;
  /** Hard caps from player init — disabled features stay off. */
  capabilities?: Required<DemoReplayPlayerCapabilities>;
}

export interface UseReplayViewResult {
  drawOptions: DrawFrameOptions;
  capabilities: Required<DemoReplayPlayerCapabilities>;
  canToggleTracers: boolean;
  canToggleUtilities: boolean;
  canToggleGrenadePaths: boolean;
  canToggleFlashOverlay: boolean;
  canTogglePlayerNames: boolean;
  showTracers: boolean;
  setShowTracers: (value: boolean) => void;
  toggleTracers: () => void;
  showPlayerNames: boolean;
  setShowPlayerNames: (value: boolean) => void;
  togglePlayerNames: () => void;
  showUtilities: boolean;
  setShowUtilities: (value: boolean) => void;
  toggleUtilities: () => void;
  showGrenadePaths: boolean;
  setShowGrenadePaths: (value: boolean) => void;
  toggleGrenadePaths: () => void;
  showFlashOverlay: boolean;
  setShowFlashOverlay: (value: boolean) => void;
  toggleFlashOverlay: () => void;
}

function useCapabilityToggle(
  initial: boolean,
  enabled: boolean,
): [boolean, (value: boolean) => void, () => void] {
  const [value, setValue] = useState(enabled ? initial : false);

  const set = useCallback(
    (next: boolean) => {
      if (!enabled) return;
      setValue(next);
    },
    [enabled],
  );

  const toggle = useCallback(() => {
    if (!enabled) return;
    setValue((v) => !v);
  }, [enabled]);

  return [enabled ? value : false, set, toggle];
}

export function useReplayView(
  options: UseReplayViewOptions = {},
): UseReplayViewResult {
  const caps = options.capabilities;
  const canTracers = caps?.tracers ?? true;
  const canUtilities = caps?.utilities ?? true;
  const canPaths = caps?.grenadePaths ?? true;
  const canFlash = caps?.flashOverlay ?? true;
  const canNames = caps?.playerNames ?? true;

  const base = options.preset
    ? REPLAY_VIEW_PRESETS[options.preset]
    : options.initial ?? REPLAY_VIEW_PRESETS.standard;

  const [showTracers, setShowTracers, toggleTracers] = useCapabilityToggle(
    base.showTracers ?? true,
    canTracers,
  );
  const [showPlayerNames, setShowPlayerNames, togglePlayerNames] =
    useCapabilityToggle(base.showPlayerNames ?? true, canNames);
  const [showUtilities, setShowUtilities, toggleUtilities] =
    useCapabilityToggle(base.showUtilities ?? true, canUtilities);
  const [showGrenadePaths, setShowGrenadePaths, toggleGrenadePaths] =
    useCapabilityToggle(base.showGrenadePaths ?? true, canPaths);
  const [showFlashOverlay, setShowFlashOverlay, toggleFlashOverlay] =
    useCapabilityToggle(base.showFlashOverlay ?? true, canFlash);

  const capabilities = useMemo(
    () => ({
      tracers: canTracers,
      utilities: canUtilities,
      grenadePaths: canPaths,
      flashOverlay: canFlash,
      playerNames: canNames,
    }),
    [canTracers, canUtilities, canPaths, canFlash, canNames],
  );

  const drawOptions = useMemo<DrawFrameOptions>(
    () => ({
      showTracers,
      showPlayerNames,
      showUtilities,
      showGrenadePaths,
      showFlashOverlay,
    }),
    [showTracers, showPlayerNames, showUtilities, showGrenadePaths, showFlashOverlay],
  );

  return {
    drawOptions,
    capabilities,
    canToggleTracers: canTracers,
    canToggleUtilities: canUtilities,
    canToggleGrenadePaths: canPaths,
    canToggleFlashOverlay: canFlash,
    canTogglePlayerNames: canNames,
    showTracers,
    setShowTracers,
    toggleTracers,
    showPlayerNames,
    setShowPlayerNames,
    togglePlayerNames,
    showUtilities,
    setShowUtilities,
    toggleUtilities,
    showGrenadePaths,
    setShowGrenadePaths,
    toggleGrenadePaths,
    showFlashOverlay,
    setShowFlashOverlay,
    toggleFlashOverlay,
  };
}
