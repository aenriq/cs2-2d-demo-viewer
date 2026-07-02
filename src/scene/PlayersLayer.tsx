import type { ReplayLayerContext } from "../replay/layer-types.ts";
import { PlayerMarker } from "./PlayerMarker.tsx";
import "./pixi-setup.ts";

export function PlayersLayer({
  frame,
  size,
  options,
  onPlayerClick,
  onPlayerHover,
  selectedSteamId,
}: ReplayLayerContext) {
  return (
    <>
      {frame.players.map((player) => {
        if (player.team === "SPEC") return null;
        return (
          <PlayerMarker
            key={player.steamId}
            player={player}
            size={size}
            showName={options.showPlayerNames ?? true}
            showFlashOverlay={options.showFlashOverlay ?? true}
            selected={selectedSteamId === player.steamId}
            onClick={onPlayerClick}
            onHover={onPlayerHover}
          />
        );
      })}
    </>
  );
}
