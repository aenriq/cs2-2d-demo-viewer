import type { DemoFrame, DemoReplayData, PlayerFrame, RadarPoint } from "../types.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";
import { clamp01, lerp, lerpAngle } from "./lerp.ts";

function lerpRadar(a: RadarPoint, b: RadarPoint, t: number): RadarPoint {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function interpolatePlayer(a: PlayerFrame, b: PlayerFrame, t: number): PlayerFrame {
  const alive = t < 0.5 ? a.alive : b.alive;
  const health = Math.round(lerp(a.health, b.health, t));

  return {
    steamId: a.steamId,
    name: a.name,
    team: a.team,
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    radar: lerpRadar(a.radar, b.radar, t),
    health,
    alive: alive && health > 0,
    yaw: lerpAngle(a.yaw, b.yaw, t),
    weapon: t < 0.5 ? a.weapon : b.weapon,
    flashDuration: lerp(a.flashDuration ?? 0, b.flashDuration ?? 0, t),
    flashAlpha: lerp(a.flashAlpha ?? 0, b.flashAlpha ?? 0, t),
  };
}

export function interpolateFrames(a: DemoFrame, b: DemoFrame, t: number): DemoFrame {
  const blend = clamp01(t);
  const bById = new Map(b.players.map((p) => [p.steamId, p]));
  const players: PlayerFrame[] = [];

  for (const playerA of a.players) {
    const playerB = bById.get(playerA.steamId);
    if (playerB) {
      players.push(interpolatePlayer(playerA, playerB, blend));
      bById.delete(playerA.steamId);
    } else {
      players.push(playerA);
    }
  }

  for (const playerB of bById.values()) {
    players.push(playerB);
  }

  return {
    tick: Math.round(lerp(a.tick, b.tick, blend)),
    players,
  };
}

/** Blend player positions between the two frames surrounding `tick`. */
export function getInterpolatedFrame(
  demo: DemoReplayLike | DemoReplayData,
  tick: number,
): DemoFrame {
  const frames = demo.frames;
  if (frames.length === 0) return { tick: 0, players: [] };
  if (frames.length === 1 || tick <= frames[0]!.tick) return frames[0]!;
  if (tick >= frames[frames.length - 1]!.tick) return frames[frames.length - 1]!;

  let i = 0;
  while (i < frames.length - 1 && frames[i + 1]!.tick <= tick) i++;

  const a = frames[i]!;
  const b = frames[i + 1]!;
  if (tick <= a.tick) return a;
  if (tick >= b.tick) return b;

  const span = b.tick - a.tick;
  if (span <= 0) return a;

  return interpolateFrames(a, b, (tick - a.tick) / span);
}
