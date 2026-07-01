import { getRoundAtTick } from "../canvas/draw-frame.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";
import type {
  DemoPlayerEconomy,
  DemoRound,
  DemoRoundEconomy,
  Team,
} from "../types.ts";

/** Heuristic buy-type label derived from money and equipment. */
export type BuyType = "full" | "half" | "eco" | "force" | "pistol" | "unknown";

/** Sort order for economy player lists. */
export type EconomySortBy = "team" | "moneySpent" | "equipmentValue" | "name";

/** Aggregated economy totals for one team. */
export interface EconomyTeamTotals {
  equipmentValue: number;
  moneySpent: number;
  playerCount: number;
}

const TEAM_ORDER: Record<Team, number> = { CT: 0, T: 1, SPEC: 2 };

const FULL_BUY_THRESHOLD = 4000;
const HALF_BUY_THRESHOLD = 2000;

/**
 * Whether parsed JSON includes any economy rows.
 *
 * @param demo - Parsed replay JSON, or `null`.
 */
export function hasEconomyInDemo(demo: DemoReplayLike | null): boolean {
  return (demo?.economy?.length ?? 0) > 0;
}

/**
 * Lookup pre-aggregated economy for a round by number.
 *
 * @param demo - Parsed replay JSON, or `null`.
 * @param roundNumber - 1-based round index matching `demo.rounds[].number`.
 */
export function getRoundEconomy(
  demo: DemoReplayLike | null,
  roundNumber: number,
): DemoRoundEconomy | undefined {
  return (demo?.economy ?? []).find((e) => e.roundNumber === roundNumber);
}

/**
 * Resolve the round at a replay tick and return its economy block.
 *
 * @param demo - Parsed replay JSON, or `null`.
 * @param tick - Replay position in game ticks.
 */
export function getEconomyForTick(
  demo: DemoReplayLike | null,
  tick: number | undefined,
): { round: DemoRound | undefined; roundEconomy: DemoRoundEconomy | undefined } {
  if (!demo || tick === undefined) {
    return { round: undefined, roundEconomy: undefined };
  }

  const round = getRoundAtTick(demo, tick);
  if (!round) {
    return { round: undefined, roundEconomy: undefined };
  }

  return {
    round,
    roundEconomy: getRoundEconomy(demo, round.number),
  };
}

/**
 * Resolve economy from a frame index (`demo.frames[frameIndex].tick`).
 *
 * @param demo - Parsed replay JSON, or `null`.
 * @param frameIndex - Index into `demo.frames`.
 */
export function getEconomyForFrameIndex(
  demo: DemoReplayLike | null,
  frameIndex: number | undefined,
): { round: DemoRound | undefined; roundEconomy: DemoRoundEconomy | undefined } {
  if (!demo || frameIndex === undefined) {
    return { round: undefined, roundEconomy: undefined };
  }

  const tick = demo.frames[frameIndex]?.tick;
  return getEconomyForTick(demo, tick);
}

/**
 * Drop spectators and return a sorted copy of economy players.
 *
 * @param players - Raw player rows from `DemoRoundEconomy.players`.
 * @param sortBy - Sort key; default `"team"` (CT first, then T, alpha within team).
 */
export function sortEconomyPlayers(
  players: readonly DemoPlayerEconomy[],
  sortBy: EconomySortBy = "team",
): DemoPlayerEconomy[] {
  const filtered = players.filter((p) => p.team !== "SPEC");
  const sorted = [...filtered];

  switch (sortBy) {
    case "moneySpent":
      sorted.sort((a, b) => b.moneySpent - a.moneySpent || a.name.localeCompare(b.name));
      break;
    case "equipmentValue":
      sorted.sort(
        (a, b) => b.equipmentValue - a.equipmentValue || a.name.localeCompare(b.name),
      );
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "team":
    default:
      sorted.sort((a, b) => {
        const teamDiff = TEAM_ORDER[a.team] - TEAM_ORDER[b.team];
        return teamDiff !== 0 ? teamDiff : a.name.localeCompare(b.name);
      });
      break;
  }

  return sorted;
}

/**
 * Sum equipment value and spend per side for a round economy view.
 *
 * @param players - Player rows (typically after {@link sortEconomyPlayers}).
 */
export function computeTeamTotals(
  players: readonly DemoPlayerEconomy[],
): Record<"CT" | "T", EconomyTeamTotals> {
  const totals: Record<"CT" | "T", EconomyTeamTotals> = {
    CT: { equipmentValue: 0, moneySpent: 0, playerCount: 0 },
    T: { equipmentValue: 0, moneySpent: 0, playerCount: 0 },
  };

  for (const player of players) {
    if (player.team !== "CT" && player.team !== "T") continue;
    const bucket = totals[player.team];
    bucket.equipmentValue += player.equipmentValue;
    bucket.moneySpent += player.moneySpent;
    bucket.playerCount += 1;
  }

  return totals;
}

/**
 * Heuristic buy label for analyst-style round economy UI.
 *
 * Thresholds are tunable constants — parsers emit raw numbers only.
 *
 * @param player - Single player economy row.
 * @param roundNumber - When `1` or `13`, returns `"pistol"` (side-swap pistol round).
 */
export function classifyBuyType(
  player: DemoPlayerEconomy,
  roundNumber?: number,
): BuyType {
  if (roundNumber === 1 || roundNumber === 13) return "pistol";

  const { equipmentValue, startMoney, moneySpent } = player;

  const spendRatio =
    startMoney > 0 ? moneySpent / startMoney : moneySpent > 0 ? 1 : 0;

  if (startMoney < HALF_BUY_THRESHOLD && spendRatio > 0.8 && moneySpent > 1500) {
    return "force";
  }
  if (equipmentValue >= FULL_BUY_THRESHOLD) return "full";
  if (equipmentValue >= HALF_BUY_THRESHOLD) return "half";
  if (equipmentValue < HALF_BUY_THRESHOLD && moneySpent < 1000) return "eco";

  return "unknown";
}
