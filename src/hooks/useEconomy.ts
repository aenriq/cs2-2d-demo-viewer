import { useMemo } from "react";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";
import type { DemoPlayerEconomy, DemoRound, DemoRoundEconomy } from "../types.ts";
import {
  classifyBuyType,
  computeTeamTotals,
  getEconomyForFrameIndex,
  getEconomyForTick,
  getRoundEconomy,
  hasEconomyInDemo,
  sortEconomyPlayers,
  type BuyType,
  type EconomySortBy,
  type EconomyTeamTotals,
} from "../utils/economy.ts";

/**
 * Options for {@link useEconomy}.
 *
 * Provide **either** `currentTick` or `frameIndex` to sync with replay playback,
 * or pin with `roundNumber`. `roundNumber` wins when set.
 */
export interface UseEconomyOptions {
  /**
   * Replay tick — economy resolves to the round containing this tick.
   *
   * Typically `useDemoReplay(demo).currentTick`.
   */
  currentTick?: number;
  /**
   * Alternative — `demo.frames[frameIndex].tick` drives round lookup.
   */
  frameIndex?: number;
  /**
   * Pin to a specific round instead of deriving from replay position.
   *
   * When set, ignores tick/frame for round selection.
   */
  roundNumber?: number;
  /**
   * Sort order for `players` in the result.
   *
   * @defaultValue `"team"` — CT first, then T; alphabetical within team.
   */
  sortBy?: EconomySortBy;
  /**
   * When `true`, include {@link UseEconomyResult.buyTypes} keyed by `steamId`.
   *
   * @defaultValue `false`
   */
  includeBuyTypes?: boolean;
}

/**
 * Return value of {@link useEconomy}.
 */
export interface UseEconomyResult {
  /** Round resolved from replay position or `roundNumber`. */
  round: DemoRound | undefined;
  /** Raw economy block for this round. `undefined` if no data. */
  roundEconomy: DemoRoundEconomy | undefined;
  /** Players for the round (sorted per `sortBy`). Empty when no data. */
  players: DemoPlayerEconomy[];
  /** Team totals derived from `players`. */
  teamTotals: Record<"CT" | "T", EconomyTeamTotals>;
  /** `true` when `demo.economy` has an entry for the current round. */
  hasEconomyData: boolean;
  /** `true` when `demo.economy` exists at all (any round). */
  hasEconomy: boolean;
  /** Optional buy-type label per player id — from utils heuristics. */
  buyTypes?: Record<string, BuyType>;
}

const EMPTY_TEAM_TOTALS: Record<"CT" | "T", EconomyTeamTotals> = {
  CT: { equipmentValue: 0, moneySpent: 0, playerCount: 0 },
  T: { equipmentValue: 0, moneySpent: 0, playerCount: 0 },
};

/**
 * React hook that returns per-player economy for the current replay round.
 *
 * Economy is **round-scoped** — tick/frame input only selects which round.
 * Data must be pre-aggregated in `demo.economy` by the upstream parser.
 *
 * **Unstyled** — build your own round economy panel from `players` and
 * `teamTotals`.
 *
 * @param demo - Parsed replay JSON, or `null`.
 * @param options - Replay position, round pin, and sort order.
 * @returns Round economy rows and derived team totals.
 *
 * @example
 * Basic usage with `useDemoReplay`:
 * ```tsx
 * import { useDemoReplay, useEconomy } from "cs2-demo-viewer";
 *
 * function RoundEconomy({ demo }) {
 *   const replay = useDemoReplay(demo);
 *   const economy = useEconomy(demo, { currentTick: replay.currentTick });
 *
 *   if (!economy.hasEconomy) return <p>No economy data in JSON</p>;
 *   if (!economy.hasEconomyData) return <p>No economy for this round</p>;
 *
 *   return (
 *     <ul>
 *       {economy.players.map((p) => (
 *         <li key={p.steamId}>
 *           {p.name} — ${p.startMoney} spent ${p.moneySpent}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * @example
 * Pin to a specific round:
 * ```tsx
 * const economy = useEconomy(demo, { roundNumber: 14, includeBuyTypes: true });
 * ```
 */
export function useEconomy(
  demo: DemoReplayLike | null,
  options: UseEconomyOptions = {},
): UseEconomyResult {
  const {
    currentTick: tickOption,
    frameIndex,
    roundNumber,
    sortBy = "team",
    includeBuyTypes = false,
  } = options;

  const hasEconomy = useMemo(() => hasEconomyInDemo(demo), [demo]);

  const resolved = useMemo(() => {
    if (!demo) {
      return { round: undefined as DemoRound | undefined, roundEconomy: undefined as DemoRoundEconomy | undefined };
    }

    if (roundNumber !== undefined) {
      const round = (demo.rounds ?? []).find((r) => r.number === roundNumber);
      return {
        round,
        roundEconomy: getRoundEconomy(demo, roundNumber),
      };
    }

    if (tickOption !== undefined) {
      return getEconomyForTick(demo, tickOption);
    }

    if (frameIndex !== undefined) {
      return getEconomyForFrameIndex(demo, frameIndex);
    }

    return { round: undefined, roundEconomy: undefined };
  }, [demo, roundNumber, tickOption, frameIndex]);

  const players = useMemo(() => {
    if (!resolved.roundEconomy) return [];
    return sortEconomyPlayers(resolved.roundEconomy.players, sortBy);
  }, [resolved.roundEconomy, sortBy]);

  const teamTotals = useMemo(
    () => (players.length > 0 ? computeTeamTotals(players) : EMPTY_TEAM_TOTALS),
    [players],
  );

  const buyTypes = useMemo(() => {
    if (!includeBuyTypes || players.length === 0) return undefined;

    const roundNum = resolved.round?.number ?? roundNumber;
    const map: Record<string, BuyType> = {};
    for (const player of players) {
      map[player.steamId] = classifyBuyType(player, roundNum);
    }
    return map;
  }, [includeBuyTypes, players, resolved.round?.number, roundNumber]);

  const hasEconomyData = resolved.roundEconomy !== undefined;

  return {
    round: resolved.round,
    roundEconomy: resolved.roundEconomy,
    players,
    teamTotals,
    hasEconomyData,
    hasEconomy,
    buyTypes,
  };
}
