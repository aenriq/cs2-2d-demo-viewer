#!/usr/bin/env bun
/**
 * CS2 .dem → replay JSON for cs2-demo-viewer.
 *
 * Usage:
 *   bun run parse-demo.ts path/to/match.dem [--out replay.json] [--interval 4] [--full]
 */

import { existsSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import {
  parseEvent,
  parseGrenades,
  parseHeader,
  parseTicks,
} from "@laihoe/demoparser2";
import type {
  DemoEvent,
  DemoFrame,
  DemoGrenadePath,
  DemoReplayData,
  DemoShot,
  DemoUtilityEffect,
  PlayerFrame,
  Team,
  UtilityType,
} from "../src/types.ts";
import { buildDemoMapMeta } from "../src/utils/radar-url.ts";
import { buildDemoRoundsFromEvents } from "../src/utils/demo-rounds.ts";
import { getMapMeta, worldToRadar, type MapMetaEntry } from "./map-meta.ts";

const FRAME_TICK_INTERVAL = 4;
const SMOKE_TICKS = 64 * 18;
const HE_FLASH_DECOY_TICKS = 64 * 2;
const MOLOTOV_TICKS = 64 * 7;
const SHOT_TRACE_WORLD_LEN = 900; // arbitrary radar hint length (HU), not from ballistics

interface CliOptions {
  demoPath: string;
  outPath: string;
  interval: number;
  full: boolean;
}

interface TickRow {
  tick: number;
  player_steamid?: string;
  player_name?: string;
  X?: number;
  Y?: number;
  Z?: number;
  health?: number;
  yaw?: number;
  is_alive?: boolean;
  team_num?: number;
  active_weapon_name?: string;
  flash_duration?: number;
  flash_max_alpha?: number;
}

interface GameEventRow {
  tick: number;
  [key: string]: unknown;
}

function parseArgs(argv: string[]): CliOptions {
  const positional = argv.filter((a) => !a.startsWith("-"));
  const demoPath = positional[0];
  if (!demoPath) {
    console.error("Usage: bun run parse-demo.ts <demo.dem> [--out replay.json] [--interval 4] [--full]");
    process.exit(1);
  }

  const outIdx = argv.indexOf("--out");
  const intervalIdx = argv.indexOf("--interval");

  return {
    demoPath: resolve(demoPath),
    outPath: resolve(outIdx >= 0 ? (argv[outIdx + 1] ?? "replay.json") : "replay.json"),
    interval: intervalIdx >= 0 ? Number(argv[intervalIdx + 1] ?? FRAME_TICK_INTERVAL) : FRAME_TICK_INTERVAL,
    full: argv.includes("--full"),
  };
}

function teamFromNum(teamNum: number | undefined): Team {
  if (teamNum === 2) return "T";
  if (teamNum === 3) return "CT";
  return "SPEC";
}

function teamFromWinner(row: GameEventRow): Team | undefined {
  const raw = row.winner;
  if (typeof raw === "number") return teamFromNum(raw);
  if (typeof raw === "string") {
    const value = raw.toUpperCase();
    if (value === "2" || value === "T" || value === "TERRORIST") return "T";
    if (value === "3" || value === "CT" || value === "COUNTER-TERRORIST") return "CT";
  }
  return undefined;
}

function radarPoint(
  x: number | undefined,
  y: number | undefined,
  meta: MapMetaEntry,
): { x: number; y: number } {
  return worldToRadar(x ?? 0, y ?? 0, meta);
}

function shotEndpoint(x: number, y: number, yaw: number): { x: number; y: number } {
  const rad = (yaw * Math.PI) / 180;
  return {
    x: x + Math.cos(rad) * SHOT_TRACE_WORLD_LEN,
    y: y + Math.sin(rad) * SHOT_TRACE_WORLD_LEN,
  };
}

function tickRows(raw: unknown): TickRow[] {
  if (Array.isArray(raw)) return raw as TickRow[];
  return [];
}

function eventRows(raw: unknown): GameEventRow[] {
  if (Array.isArray(raw)) return raw as GameEventRow[];
  return [];
}

function str(row: GameEventRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function num(row: GameEventRow, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
  }
  return undefined;
}

function buildFrames(
  ticks: TickRow[],
  meta: MapMetaEntry,
  interval: number,
): DemoFrame[] {
  const byTick = new Map<number, PlayerFrame[]>();

  for (const row of ticks) {
    if (row.tick % interval !== 0) continue;
    if (!row.player_steamid || row.X == null || row.Y == null) continue;

    const players = byTick.get(row.tick) ?? [];
    players.push({
      steamId: String(row.player_steamid),
      name: row.player_name ?? "Unknown",
      team: teamFromNum(row.team_num),
      x: row.X,
      y: row.Y,
      z: row.Z ?? 0,
      radar: radarPoint(row.X, row.Y, meta),
      health: row.health ?? 0,
      alive: row.is_alive ?? row.health !== 0,
      yaw: row.yaw ?? 0,
      weapon: row.active_weapon_name,
      flashDuration: row.flash_duration,
      flashAlpha: row.flash_max_alpha,
    });
    byTick.set(row.tick, players);
  }

  return [...byTick.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tick, players]) => ({ tick, players }));
}

function bool(row: GameEventRow, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "boolean") return v;
  }
  return undefined;
}

function buildKillEvents(rows: GameEventRow[]): DemoEvent[] {
  return rows.map((row) => ({
    tick: row.tick,
    type: "kill" as const,
    attacker: str(row, "attacker_name", "attacker"),
    victim: str(row, "user_name", "userid", "victim_name", "victim"),
    weapon: str(row, "weapon"),
    headshot: bool(row, "headshot"),
    noscope: bool(row, "noscope"),
    thrusmoke: bool(row, "thrusmoke"),
    attackerblind: bool(row, "attackerblind"),
    attackerinair: bool(row, "attackerinair"),
    assistedflash: bool(row, "assistedflash"),
    penetrated: num(row, "penetrated"),
    revenge: bool(row, "revenge"),
  }));
}

function buildRoundEvents(
  rows: GameEventRow[],
  type: "round_start" | "round_end",
): DemoEvent[] {
  return rows.map((row) => ({
    tick: row.tick,
    type,
    winner: type === "round_end" ? teamFromWinner(row) : undefined,
    isWarmup: type === "round_start" ? bool(row, "is_warmup_period") : undefined,
  }));
}

function buildBombEvents(
  planted: GameEventRow[],
  defused: GameEventRow[],
): DemoEvent[] {
  return [
    ...planted.map((row) => ({ tick: row.tick, type: "bomb_planted" as const })),
    ...defused.map((row) => ({ tick: row.tick, type: "bomb_defused" as const })),
  ];
}

function utilityTypeFromEvent(name: string, weapon: string | undefined): UtilityType | null {
  if (name.includes("smoke")) return "smoke";
  if (name.includes("flash")) return "flash";
  if (name.includes("hegrenade") || name.includes("he_")) return "he";
  if (name.includes("inferno") || name.includes("molotov")) return "molotov";
  if (name.includes("decoy")) return "decoy";
  if (weapon?.includes("smoke")) return "smoke";
  if (weapon?.includes("flash")) return "flash";
  if (weapon?.includes("he")) return "he";
  if (weapon?.includes("molotov") || weapon?.includes("incendiary")) return "molotov";
  if (weapon?.includes("decoy")) return "decoy";
  return null;
}

function utilityDurationTicks(type: UtilityType): number {
  if (type === "smoke") return SMOKE_TICKS;
  if (type === "molotov") return MOLOTOV_TICKS;
  return HE_FLASH_DECOY_TICKS;
}

function buildUtilities(
  eventGroups: Array<{ name: string; rows: GameEventRow[] }>,
  meta: MapMetaEntry,
): DemoUtilityEffect[] {
  const utilities: DemoUtilityEffect[] = [];
  let id = 0;

  for (const group of eventGroups) {
    for (const row of group.rows) {
      const type = utilityTypeFromEvent(group.name, str(row, "weapon"));
      if (!type) continue;

      const x = num(row, "x", "X");
      const y = num(row, "y", "Y");
      if (x == null || y == null) continue;

      utilities.push({
        id: `${type}-${id++}`,
        type,
        startTick: row.tick,
        endTick: row.tick + utilityDurationTicks(type),
        radar: radarPoint(x, y, meta),
        throwerName: str(row, "userid", "thrower", "attacker_name"),
        throwerTeam: teamFromNum(num(row, "team_num")),
      });
    }
  }

  return utilities;
}

function steamIdStr(row: GameEventRow, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.length > 0) return v;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return String(v);
  }
  return undefined;
}

function isGunWeapon(weapon?: string): boolean {
  if (!weapon) return true;
  const w = weapon.toLowerCase();
  if (w.includes("knife")) return false;
  if (w.includes("grenade")) return false;
  if (w.includes("flashbang")) return false;
  if (w.includes("molotov") || w.includes("incgrenade")) return false;
  if (w.includes("decoy")) return false;
  if (w.includes("taser")) return false;
  if (w === "weapon_c4") return false;
  return true;
}

function groupRowsByTick(rows: TickRow[]): Map<number, TickRow[]> {
  const byTick = new Map<number, TickRow[]>();
  for (const row of rows) {
    const list = byTick.get(row.tick) ?? [];
    list.push(row);
    byTick.set(row.tick, list);
  }
  return byTick;
}

function matchShooterRow(
  fire: GameEventRow,
  players: TickRow[],
): TickRow | undefined {
  const userId = num(fire, "userid", "user_id", "userId");
  if (userId != null) {
    const byUserId = players.find((row) => num(row, "user_id") === userId);
    if (byUserId) return byUserId;
  }

  const steamId = steamIdStr(fire, "player_steamid", "steamid", "player_id");
  if (steamId) {
    const bySteam = players.find(
      (row) => steamIdStr(row, "player_steamid") === steamId,
    );
    if (bySteam) return bySteam;
  }

  const name = str(fire, "player_name", "attacker_name", "user_name");
  if (name) {
    const byName = players.find((row) => row.player_name === name);
    if (byName) return byName;
  }

  const weapon = str(fire, "weapon");
  if (weapon) {
    const weaponKey = weapon.replace(/^weapon_/, "");
    const matches = players.filter((row) =>
      str(row, "active_weapon_name")?.includes(weaponKey),
    );
    if (matches.length === 1) return matches[0];
  }

  return undefined;
}

function lookupPlayerAtTick(
  frames: DemoFrame[],
  tick: number,
  steamId?: string,
): PlayerFrame | undefined {
  let best: DemoFrame | undefined;

  for (const frame of frames) {
    if (frame.tick > tick) break;
    best = frame;
  }

  if (!best) return undefined;
  if (steamId) {
    return best.players.find((player) => player.steamId === steamId);
  }
  return undefined;
}

function fetchTickRowsAtTicks(
  demoPath: string,
  ticks: number[],
): Map<number, TickRow[]> {
  if (ticks.length === 0) return new Map();

  const props = [
    "X",
    "Y",
    "yaw",
    "team_num",
    "player_steamid",
    "player_name",
    "user_id",
    "active_weapon_name",
  ];
  const uniqueTicks = [...new Set(ticks)].sort((a, b) => a - b);
  const rows: TickRow[] = [];
  const chunkSize = 4000;

  for (let i = 0; i < uniqueTicks.length; i += chunkSize) {
    const chunk = uniqueTicks.slice(i, i + chunkSize);
    rows.push(...tickRows(parseTicks(demoPath, props, chunk)));
  }

  return groupRowsByTick(rows);
}

function buildShots(
  demoPath: string,
  fires: GameEventRow[],
  meta: MapMetaEntry,
  frames: DemoFrame[],
): DemoShot[] {
  const gunFires = fires.filter((row) => isGunWeapon(str(row, "weapon")));
  if (gunFires.length === 0) return [];

  const playersByTick = fetchTickRowsAtTicks(
    demoPath,
    gunFires.map((row) => row.tick),
  );
  const shots: DemoShot[] = [];

  for (const row of gunFires) {
    const steamId = steamIdStr(row, "player_steamid", "steamid", "player_id");
    const tickPlayers = playersByTick.get(row.tick) ?? [];
    const shooter =
      matchShooterRow(row, tickPlayers) ??
      (() => {
        const fromFrame = lookupPlayerAtTick(frames, row.tick, steamId);
        if (!fromFrame) return undefined;
        return {
          tick: row.tick,
          X: fromFrame.x,
          Y: fromFrame.y,
          yaw: fromFrame.yaw,
          team_num: fromFrame.team === "T" ? 2 : fromFrame.team === "CT" ? 3 : 0,
          player_steamid: fromFrame.steamId,
        } satisfies TickRow;
      })();

    const x = num(row, "X", "x") ?? shooter?.X;
    const y = num(row, "Y", "y") ?? shooter?.Y;
    const yaw =
      num(row, "yaw", "viewangle_y", "usercmd_viewangle_y") ?? shooter?.yaw;

    if (x == null || y == null || yaw == null) continue;

    const team =
      teamFromNum(num(row, "team_num")) ??
      teamFromNum(num(shooter ?? {}, "team_num")) ??
      "SPEC";
    const end = shotEndpoint(x, y, yaw);

    shots.push({
      tick: row.tick,
      team,
      from: radarPoint(x, y, meta),
      to: radarPoint(end.x, end.y, meta),
    });
  }

  return shots;
}

function buildGrenadePaths(raw: unknown, meta: MapMetaEntry): DemoGrenadePath[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry) => {
    const entityId = Number(entry.entity_id ?? entry.entityId ?? entry.id);
    const type = utilityTypeFromEvent(String(entry.type ?? entry.grenade_type ?? ""), undefined);
    const trajectory = entry.trajectory ?? entry.TrajectoryEntry ?? entry.points;
    if (!Number.isFinite(entityId) || !type || !Array.isArray(trajectory)) return [];

    const points = trajectory
      .map((p: Record<string, unknown>) => {
        const tick = Number(p.tick ?? p.game_tick);
        const x = Number(p.x ?? p.X);
        const y = Number(p.y ?? p.Y);
        if (!Number.isFinite(tick) || !Number.isFinite(x) || !Number.isFinite(y)) return null;
        return { tick, radar: radarPoint(x, y, meta) };
      })
      .filter((p): p is { tick: number; radar: { x: number; y: number } } => p != null);

    if (points.length === 0) return [];

    return [
      {
        entityId,
        type,
        throwerName: typeof entry.thrower === "string" ? entry.thrower : undefined,
        throwerTeam: teamFromNum(Number(entry.team_num)),
        endTick: points[points.length - 1]!.tick,
        points,
      },
    ];
  });
}

function inferTickRate(header: Record<string, unknown>): number {
  const playback = Number(header.playback_time ?? header.playbackTime);
  const ticks = Number(header.playback_ticks ?? header.playbackTicks);
  if (Number.isFinite(playback) && playback > 0 && Number.isFinite(ticks) && ticks > 0) {
    return Math.round(ticks / playback);
  }
  return 64;
}

function inferMapName(header: Record<string, unknown>): string {
  const map = header.map_name ?? header.mapName ?? header.map;
  return typeof map === "string" ? map : "unknown";
}

export function parseDemoFile(
  demoPath: string,
  options: { interval?: number; full?: boolean } = {},
): DemoReplayData {
  const interval = options.interval ?? FRAME_TICK_INTERVAL;
  const full = options.full ?? false;

  const header = parseHeader(demoPath) as Record<string, unknown>;
  const map = inferMapName(header);
  const tickRate = inferTickRate(header);
  const meta = getMapMeta(map);

  if (!meta) {
    console.warn(`No map metadata for "${map}" — radar coords will be wrong. Add entry in scripts/map-meta.ts`);
  }

  const mapMeta = meta ?? { posX: 0, posY: 0, scale: 1 };

  const tickProps = [
    "X",
    "Y",
    "Z",
    "health",
    "yaw",
    "is_alive",
    "player_name",
    "player_steamid",
    "team_num",
    "active_weapon_name",
    "flash_duration",
    "flash_max_alpha",
  ];

  const ticks = tickRows(parseTicks(demoPath, tickProps));
  const frames = buildFrames(ticks, mapMeta, interval);
  const totalTicks = ticks.reduce((max, row) => Math.max(max, row.tick), 0);

  const roundStarts = eventRows(
    parseEvent(demoPath, "round_start", ["is_warmup_period"]),
  );
  const roundEnds = eventRows(parseEvent(demoPath, "round_end"));
  const deaths = eventRows(parseEvent(demoPath, "player_death"));
  const planted = eventRows(parseEvent(demoPath, "bomb_planted"));
  const defused = eventRows(parseEvent(demoPath, "bomb_defused"));

  const events: DemoEvent[] = [
    ...buildKillEvents(deaths),
    ...buildRoundEvents(roundStarts, "round_start"),
    ...buildRoundEvents(roundEnds, "round_end"),
    ...buildBombEvents(planted, defused),
  ].sort((a, b) => a.tick - b.tick);

  const rounds = buildDemoRoundsFromEvents(events);

  const replay: DemoReplayData = {
    map,
    tickRate,
    frameTickInterval: interval,
    totalTicks,
    rounds,
    frames,
    events,
  };

  if (full) {
    const utilityEvents = [
      { name: "smokegrenade_detonate", rows: eventRows(parseEvent(demoPath, "smokegrenade_detonate", ["X", "Y"])) },
      { name: "flashbang_detonate", rows: eventRows(parseEvent(demoPath, "flashbang_detonate", ["X", "Y"])) },
      { name: "hegrenade_detonate", rows: eventRows(parseEvent(demoPath, "hegrenade_detonate", ["X", "Y"])) },
      { name: "inferno_startburn", rows: eventRows(parseEvent(demoPath, "inferno_startburn", ["X", "Y"])) },
      { name: "decoy_started", rows: eventRows(parseEvent(demoPath, "decoy_started", ["X", "Y"])) },
    ];

    replay.utilities = buildUtilities(utilityEvents, mapMeta);
    const weaponFires = eventRows(parseEvent(demoPath, "weapon_fire"));
    replay.shots = buildShots(demoPath, weaponFires, mapMeta, frames);
    if (weaponFires.length > 0 && replay.shots.length === 0) {
      console.warn(
        `Parsed ${weaponFires.length} weapon_fire events but extracted 0 shots — check demoparser tick join`,
      );
    }

    try {
      replay.grenadePaths = buildGrenadePaths(parseGrenades(demoPath, ["X", "Y"]), mapMeta);
    } catch {
      replay.grenadePaths = [];
    }
  }

  replay.mapMeta = buildDemoMapMeta(map, { thresholdZ: meta?.thresholdZ });

  return replay;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!existsSync(opts.demoPath)) {
    console.error(`Demo not found: ${opts.demoPath}`);
    process.exit(1);
  }

  console.log(`Parsing ${basename(opts.demoPath)}…`);
  const replay = parseDemoFile(opts.demoPath, {
    interval: opts.interval,
    full: opts.full,
  });

  writeFileSync(opts.outPath, JSON.stringify(replay, null, 2));
  console.log(
    `Wrote ${opts.outPath} — ${replay.frames.length} frames, ${replay.events.length} events, map=${replay.map}`,
  );
}

if (import.meta.main) {
  main();
}
