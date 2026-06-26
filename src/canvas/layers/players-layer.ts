import {
  BEAK_LENGTH,
  BEAK_WIDTH,
  PLAYER_RADIUS,
} from "../constants.ts";
import { teamEmptyGlass, teamFill, teamStroke } from "../colors.ts";
import type { ReplayLayer } from "../../replay/layer-types.ts";
import type { PlayerFrame } from "../../types.ts";

function viewAngle(yaw: number): number {
  return (-yaw * Math.PI) / 180;
}

function drawHealthGlass(
  ctx: CanvasRenderingContext2D,
  radius: number,
  healthPct: number,
  fill: string,
  stroke: string,
  team: string,
): void {
  const inner = radius - 1.5;

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, inner, 0, Math.PI * 2);
  ctx.clip();

  if (healthPct >= 0.999) {
    ctx.fillStyle = fill;
    ctx.fillRect(-inner, -inner, inner * 2, inner * 2);
  } else {
    const waterY = inner * (1 - 2 * healthPct);
    ctx.fillStyle = teamEmptyGlass(team);
    ctx.fillRect(-inner, -inner, inner * 2, waterY + inner);
    ctx.fillStyle = fill;
    ctx.globalAlpha = 0.95;
    ctx.fillRect(-inner, waterY, inner * 2, inner - waterY);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-inner * 0.82, waterY);
    ctx.lineTo(inner * 0.82, waterY);
    ctx.stroke();
  }

  ctx.restore();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawViewBeak(
  ctx: CanvasRenderingContext2D,
  radius: number,
  fill: string,
  stroke: string,
): void {
  const halfW = BEAK_WIDTH * 0.65;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(radius + BEAK_LENGTH, 0);
  ctx.lineTo(radius - 1, halfW);
  ctx.lineTo(radius - 1, -halfW);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawFlashOverlay(
  ctx: CanvasRenderingContext2D,
  radius: number,
  flashDuration: number,
  flashAlpha: number,
): void {
  if (flashDuration <= 0) return;
  const intensity = Math.min(1, flashAlpha / 255);
  const durationFactor = Math.min(1, flashDuration / 2.5);
  const alpha = intensity * durationFactor * 0.85;
  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSkullMarker(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✕", 0, 1);
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  p: PlayerFrame,
  w: number,
  h: number,
  showName: boolean,
  showFlashOverlay: boolean,
): void {
  const healthPct = Math.max(0, Math.min(1, p.health / 100));
  const fill = teamFill(p.team);
  const stroke = teamStroke(p.team);

  ctx.save();
  ctx.translate(p.radar.x * w, p.radar.y * h);

  if (!p.alive) {
    drawSkullMarker(ctx);
    ctx.restore();
    return;
  }

  drawHealthGlass(ctx, PLAYER_RADIUS, healthPct, fill, stroke, p.team);

  if (showFlashOverlay && (p.flashDuration ?? 0) > 0) {
    drawFlashOverlay(
      ctx,
      PLAYER_RADIUS,
      p.flashDuration ?? 0,
      p.flashAlpha ?? 255,
    );
  }

  ctx.save();
  ctx.rotate(viewAngle(p.yaw));
  drawViewBeak(ctx, PLAYER_RADIUS, fill, stroke);
  ctx.restore();

  if (showName) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(p.name, 0, PLAYER_RADIUS + 12);
  }

  ctx.restore();
}

export const playersLayer: ReplayLayer = {
  id: "players",
  order: 40,
  draw({ ctx, demo: _demo, frame, size, options }) {
    const w = size;
    const h = size;
    for (const player of frame.players) {
      if (player.team === "SPEC") continue;
      drawPlayer(
        ctx,
        player,
        w,
        h,
        options.showPlayerNames ?? true,
        options.showFlashOverlay ?? true,
      );
    }
  },
};
