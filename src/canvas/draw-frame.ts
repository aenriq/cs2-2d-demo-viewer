export interface DrawFrameOptions {
  showPlayerNames?: boolean;
  showTracers?: boolean;
  showUtilities?: boolean;
  showGrenadePaths?: boolean;
  showFlashOverlay?: boolean;
}

export const DEFAULT_DRAW_OPTIONS: DrawFrameOptions = {
  showPlayerNames: true,
  showTracers: true,
  showUtilities: true,
  showGrenadePaths: true,
  showFlashOverlay: true,
};

export { getRoundAtTick } from "../utils/rounds.ts";
