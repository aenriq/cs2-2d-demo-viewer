import type { DemoEvent, DemoRound, Team } from "../types.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";

export type RoundKind = "warmup" | "knife" | "live";

interface RoundStartRow {
  tick: number;
  isWarmup?: boolean;
}

interface RoundEndRow {
  tick: number;
  winner?: Team;
}

interface RoundBoundary {
  startTick: number;
  endTick: number;
  winner?: Team;
  warmupAtStart?: boolean;
}

const KNIFE_WEAPON = /^knife(?:_|$)|bayonet/;

export function isKnifeWeapon(weapon?: string): boolean {
  if (!weapon) return false;
  return KNIFE_WEAPON.test(weapon.toLowerCase());
}

/** Pair each round_end with the last round_start since the previous end. */
export function buildRoundBoundaries(
  roundStarts: RoundStartRow[],
  roundEnds: RoundEndRow[],
): RoundBoundary[] {
  const starts = [...roundStarts].sort((a, b) => a.tick - b.tick);
  const ends = [...roundEnds].sort((a, b) => a.tick - b.tick);
  const boundaries: RoundBoundary[] = [];

  for (let i = 0; i < ends.length; i++) {
    const end = ends[i]!;
    const prevEndTick = i > 0 ? ends[i - 1]!.tick : -1;
    const candidates = starts.filter(
      (start) => start.tick > prevEndTick && start.tick <= end.tick,
    );
    const matchedStart = candidates[candidates.length - 1];

    boundaries.push({
      startTick: matchedStart?.tick ?? prevEndTick + 1,
      endTick: end.tick,
      winner: end.winner,
      warmupAtStart: matchedStart?.isWarmup,
    });
  }

  return boundaries;
}

export function classifyRoundKind(
  boundary: Pick<RoundBoundary, "startTick" | "endTick" | "warmupAtStart">,
  kills: DemoEvent[],
): RoundKind {
  if (boundary.warmupAtStart) return "warmup";
  if (boundary.startTick >= boundary.endTick) return "warmup";

  const roundKills = kills.filter(
    (event) =>
      event.type === "kill" &&
      event.tick >= boundary.startTick &&
      event.tick <= boundary.endTick,
  );

  if (roundKills.length === 0) {
    return boundary.endTick - boundary.startTick < 64 * 30 ? "warmup" : "live";
  }

  return roundKills.every((kill) => isKnifeWeapon(kill.weapon)) ? "knife" : "live";
}

/** Rebuild rounds from timeline events; numbers only competitive (`live`) rounds. */
export function buildDemoRoundsFromEvents(events: DemoEvent[]): DemoRound[] {
  const kills = events.filter((event) => event.type === "kill");
  const starts = events
    .filter((event) => event.type === "round_start")
    .map((event) => ({ tick: event.tick, isWarmup: event.isWarmup }));
  const ends = events
    .filter((event) => event.type === "round_end")
    .map((event) => ({ tick: event.tick, winner: event.winner }));

  if (starts.length === 0 || ends.length === 0) return [];

  const boundaries = buildRoundBoundaries(starts, ends);
  let liveNumber = 0;

  return boundaries.map((boundary) => {
    const kind = classifyRoundKind(boundary, kills);
    const round: DemoRound = {
      number: 0,
      startTick: boundary.startTick,
      endTick: boundary.endTick,
      winner: boundary.winner,
      kind,
    };

    if (kind === "live") {
      liveNumber += 1;
      round.number = liveNumber;
    }

    return round;
  });
}

export function normalizeDemoRounds(demo: DemoReplayLike): DemoRound[] {
  return resolveDemoRounds(demo);
}

function resolveDemoRounds(demo: DemoReplayLike): DemoRound[] {
  const fromEvents = buildDemoRoundsFromEvents(demo.events ?? []);
  if (fromEvents.length > 0) return fromEvents;
  return demo.rounds ?? [];
}

export function getPlayableRounds(demo: DemoReplayLike): DemoRound[] {
  return resolveDemoRounds(demo).filter((round) => round.kind === "live");
}

export function demoHasKnifeRound(demo: DemoReplayLike): boolean {
  return resolveDemoRounds(demo).some((round) => round.kind === "knife");
}

export function getRoundAtTick(
  demo: DemoReplayLike,
  tick: number,
): DemoRound | undefined {
  let best: DemoRound | undefined;

  for (const round of resolveDemoRounds(demo)) {
    if (tick >= round.startTick && tick <= round.endTick) {
      if (!best || round.startTick > best.startTick) best = round;
    }
  }

  return best;
}

export function getLiveRoundAtTick(
  demo: DemoReplayLike,
  tick: number,
): DemoRound | undefined {
  const round = getRoundAtTick(demo, tick);
  return round?.kind === "live" ? round : undefined;
}

export function findFrameIndexForTick(
  demo: DemoReplayLike,
  tick: number,
): number {
  for (let i = 0; i < demo.frames.length; i++) {
    if (demo.frames[i]!.tick >= tick) return i;
  }
  return Math.max(0, demo.frames.length - 1);
}

export function findFrameIndexForRound(
  demo: DemoReplayLike,
  roundNumber: number,
): number {
  const round = getPlayableRounds(demo).find((entry) => entry.number === roundNumber);
  if (!round) return 0;
  return findFrameIndexForTick(demo, round.startTick);
}

export function getRoundForFrameIndex(
  demo: DemoReplayLike,
  frameIndex: number,
): DemoRound | undefined {
  const frame = demo.frames[frameIndex];
  if (!frame) return undefined;
  return getRoundAtTick(demo, frame.tick);
}

export function getLiveRoundForFrameIndex(
  demo: DemoReplayLike,
  frameIndex: number,
): DemoRound | undefined {
  const frame = demo.frames[frameIndex];
  if (!frame) return undefined;
  return getLiveRoundAtTick(demo, frame.tick);
}

export function getRoundIndex(
  demo: DemoReplayLike,
  roundNumber: number | undefined,
): number {
  if (roundNumber === undefined) return -1;
  return getPlayableRounds(demo).findIndex((round) => round.number === roundNumber);
}
