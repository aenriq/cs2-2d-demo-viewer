import { useLayoutEffect, useMemo, useRef } from "react";
import { Circle, Container, Graphics, TextStyle, type FederatedPointerEvent } from "pixi.js";
import {
  BEAK_LENGTH,
  BEAK_WIDTH,
  PLAYER_RADIUS,
} from "../canvas/constants.ts";
import { teamEmptyGlass, teamFill, teamStroke } from "../canvas/colors.ts";
import type { PlayerFrame } from "../types.ts";
import "./pixi-setup.ts";

export interface PlayerMarkerProps {
  player: PlayerFrame;
  size: number;
  showName: boolean;
  showFlashOverlay: boolean;
  selected: boolean;
  onClick?: (player: PlayerFrame) => void;
  onHover?: (player: PlayerFrame | null) => void;
}

const DEAD_TEXT_STYLE = new TextStyle({
  fontFamily: "system-ui, sans-serif",
  fontSize: 13,
  fontWeight: "bold",
  fill: "rgba(255, 255, 255, 0.85)",
});

const NAME_TEXT_STYLE = new TextStyle({
  fontFamily: "system-ui, sans-serif",
  fontSize: 11,
  fill: "rgba(255, 255, 255, 0.92)",
});

function HealthRing({
  healthPct,
  fill,
  stroke,
  team,
}: {
  healthPct: number;
  fill: string;
  stroke: string;
  team: string;
}) {
  const inner = PLAYER_RADIUS - 1.5;
  const waterY = inner * (1 - 2 * healthPct);
  const maskRef = useRef<Graphics>(null);
  const contentRef = useRef<Container>(null);

  useLayoutEffect(() => {
    const mask = maskRef.current;
    const content = contentRef.current;
    if (mask && content) {
      content.mask = mask;
    }
    return () => {
      if (content) content.mask = null;
    };
  }, [healthPct]);

  return (
    <>
      <pixiGraphics
        ref={maskRef}
        draw={(g) => {
          g.clear();
          g.circle(0, 0, inner).fill({ color: 0xffffff });
        }}
      />
      <pixiContainer ref={contentRef}>
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(-inner, -inner, inner * 2, inner * 2).fill({
              color: teamEmptyGlass(team),
            });
            if (healthPct >= 0.999) {
              g.rect(-inner, -inner, inner * 2, inner * 2).fill({ color: fill });
            } else {
              g.rect(-inner, waterY, inner * 2, inner - waterY).fill({
                color: fill,
                alpha: 0.95,
              });
              g.moveTo(-inner * 0.82, waterY)
                .lineTo(inner * 0.82, waterY)
                .stroke({ width: 1, color: "rgba(255, 255, 255, 0.5)" });
            }
          }}
        />
      </pixiContainer>
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.circle(0, 0, PLAYER_RADIUS).stroke({ width: 1.5, color: stroke });
        }}
      />
    </>
  );
}

function ViewBeak({ fill, stroke }: { fill: string; stroke: string }) {
  const halfW = BEAK_WIDTH * 0.65;
  return (
    <pixiGraphics
      draw={(g) => {
        g.clear();
        g.moveTo(PLAYER_RADIUS + BEAK_LENGTH, 0)
          .lineTo(PLAYER_RADIUS - 1, halfW)
          .lineTo(PLAYER_RADIUS - 1, -halfW)
          .closePath()
          .fill({ color: fill })
          .stroke({ width: 1, color: stroke });
      }}
    />
  );
}

export function PlayerMarker({
  player,
  size,
  showName,
  showFlashOverlay,
  selected,
  onClick,
  onHover,
}: PlayerMarkerProps) {
  const x = player.radar.x * size;
  const y = player.radar.y * size;
  const healthPct = Math.max(0, Math.min(1, player.health / 100));
  const fill = teamFill(player.team);
  const stroke = teamStroke(player.team);

  const flashDuration = player.flashDuration ?? 0;
  const flashAlpha = player.flashAlpha ?? 255;
  const flashIntensity =
    flashDuration > 0
      ? Math.min(1, flashAlpha / 255) * Math.min(1, flashDuration / 2.5) * 0.85
      : 0;

  const hitArea = useMemo(
    () => new Circle(0, 0, PLAYER_RADIUS + 8),
    [],
  );

  return (
    <pixiContainer
      x={x}
      y={y}
      eventMode="static"
      cursor="pointer"
      hitArea={hitArea}
      onPointerTap={(e: FederatedPointerEvent) => {
        e.stopPropagation();
        onClick?.(player);
      }}
      onPointerEnter={() => onHover?.(player)}
      onPointerLeave={() => onHover?.(null)}
    >
      {selected && (
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.circle(0, 0, PLAYER_RADIUS + 5).stroke({
              width: 2,
              color: 0xffffff,
            });
          }}
        />
      )}

      {!player.alive ? (
        <pixiText text="✕" style={DEAD_TEXT_STYLE} anchor={0.5} />
      ) : (
        <>
          <HealthRing
            healthPct={healthPct}
            fill={fill}
            stroke={stroke}
            team={player.team}
          />

          {showFlashOverlay && flashIntensity > 0 && (
            <pixiGraphics
              eventMode="none"
              draw={(g) => {
                g.clear();
                g.circle(0, 0, PLAYER_RADIUS + 2).fill({
                  color: 0xffffff,
                  alpha: flashIntensity,
                });
              }}
            />
          )}

          <pixiContainer rotation={(-player.yaw * Math.PI) / 180}>
            <ViewBeak fill={fill} stroke={stroke} />
          </pixiContainer>
        </>
      )}

      {showName && (
        <pixiText
          text={player.name}
          y={PLAYER_RADIUS + 12}
          style={NAME_TEXT_STYLE}
          anchor={{ x: 0.5, y: 0 }}
        />
      )}
    </pixiContainer>
  );
}
