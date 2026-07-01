import {
  DIRECTION_MARK_LENGTH,
  DIRECTION_MARK_WIDTH,
  PLAYER_RADIUS,
  VIEW_CONE_HALF_ANGLE,
  VIEW_CONE_LENGTH,
} from "../constants.ts";
import { teamFill, teamHealthRing, teamVisionCone } from "../colors.ts";
import type { ReplayLayer } from "../../replay/layer-types.ts";
import type { PlayerFrame } from "../../types.ts";

function viewAngle(yaw: number): number {
  return (-yaw * Math.PI) / 180;
}

function drawVisionCone(
  ctx: CanvasRenderingContext2D,
  team: string,
): void {
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, VIEW_CONE_LENGTH, -VIEW_CONE_HALF_ANGLE, VIEW_CONE_HALF_ANGLE);
  ctx.closePath();
  ctx.fillStyle = teamVisionCone(team);
  ctx.fill();
}

function drawHealthRing(
  ctx: CanvasRenderingContext2D,
  radius: number,
  healthPct: number,
  team: string,
): void {
  if (healthPct >= 0.999) return;

  const ringRadius = radius + 2.5;
  const start = -Math.PI / 2;
  const end = start + Math.PI * 2 * healthPct;

  ctx.strokeStyle = teamHealthRing(team, healthPct);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, ringRadius, start, end);
  ctx.stroke();
}

function drawDirectionMark(
  ctx: CanvasRenderingContext2D,
  radius: number,
): void {
  const halfW = DIRECTION_MARK_WIDTH * 0.5;
  const tip = radius + DIRECTION_MARK_LENGTH;

  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.beginPath();
  ctx.moveTo(tip, 0);
  ctx.lineTo(radius - 0.5, halfW);
  ctx.lineTo(radius - 0.5, -halfW);
  ctx.closePath();
  ctx.fill();
}

function drawPlayerBody(
  ctx: CanvasRenderingContext2D,
  radius: number,
  fill: string,
): void {
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
  ctx.lineWidth = 1.5;
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
  const alpha = intensity * durationFactor * 0.88;

  ctx.save();
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.beginPath();
  ctx.arc(0, 0, radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawNameLabel(ctx: CanvasRenderingContext2D, name: string, radius: number): void {
  ctx.font = "600 10px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  const labelY = -(radius + 6);
  const metrics = ctx.measureText(name);
  const padX = 5;
  const padY = 3;
  const boxW = metrics.width + padX * 2;
  const boxH = 12 + padY;
  const boxX = -boxW / 2;
  const boxY = labelY - boxH + 2;

  ctx.fillStyle = "rgba(6, 10, 16, 0.78)";
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 3);
  ctx.fill();

  ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
  ctx.fillText(name, 0, labelY);
}

function drawDeadMarker(ctx: CanvasRenderingContext2D, team: string): void {
  ctx.globalAlpha = 0.55;
  drawPlayerBody(ctx, PLAYER_RADIUS - 1, teamFill(team));
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 1.75;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-4, -4);
  ctx.lineTo(4, 4);
  ctx.moveTo(4, -4);
  ctx.lineTo(-4, 4);
  ctx.stroke();
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

  ctx.save();
  ctx.translate(p.radar.x * w, p.radar.y * h);

  if (!p.alive) {
    drawDeadMarker(ctx, p.team);
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.rotate(viewAngle(p.yaw));
  drawVisionCone(ctx, p.team);
  ctx.restore();

  drawHealthRing(ctx, PLAYER_RADIUS, healthPct, p.team);

  drawPlayerBody(ctx, PLAYER_RADIUS, fill);

  ctx.save();
  ctx.rotate(viewAngle(p.yaw));
  drawDirectionMark(ctx, PLAYER_RADIUS);
  ctx.restore();

  if (showFlashOverlay && (p.flashDuration ?? 0) > 0) {
    drawFlashOverlay(
      ctx,
      PLAYER_RADIUS,
      p.flashDuration ?? 0,
      p.flashAlpha ?? 255,
    );
  }

  if (showName) {
    drawNameLabel(ctx, p.name, PLAYER_RADIUS);
  }

  ctx.restore();
}

function playerDrawOrder(a: PlayerFrame, b: PlayerFrame): number {
  if (a.alive !== b.alive) return a.alive ? 1 : -1;
  const teamOrder = { CT: 0, T: 1, SPEC: 2 };
  const teamDiff = (teamOrder[a.team] ?? 2) - (teamOrder[b.team] ?? 2);
  return teamDiff !== 0 ? teamDiff : a.name.localeCompare(b.name);
}

export const playersLayer: ReplayLayer = {
  id: "players",
  order: 40,
  draw({ ctx, demo: _demo, frame, size, options }) {
    const w = size;
    const h = size;
    const players = frame.players
      .filter((p) => p.team !== "SPEC")
      .slice()
      .sort(playerDrawOrder);

    for (const player of players) {
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
