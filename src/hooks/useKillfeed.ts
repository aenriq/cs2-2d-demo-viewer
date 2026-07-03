import { useMemo } from "react";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";
import {
  getKillfeedDisplayDurationTicks,
  getKillfeedEntries,
  isKillEvent,
  type GetKillfeedEntriesOptions,
  type KillfeedEntry,
} from "../utils/killfeed.ts";
import { getRoundAtTick } from "../utils/rounds.ts";

/**
 * Options for {@link useKillfeed}.
 *
 * Provide **either** `currentTick` or `frameIndex` so the feed stays synced
 * with replay playback. `currentTick` wins when both are set.
 */
export interface UseKillfeedOptions extends GetKillfeedEntriesOptions {
  /**
   * When true (default), only show kills from the current round/phase and keep
   * each kill visible for the rest of that round (not the default ~5s window).
   */
  scopeToRound?: boolean;
  /**
   * Current replay tick — typically `useDemoReplay(demo).currentTick`.
   *
   * Updates every frame while playing or scrubbing, keeping the killfeed in sync
   * with the radar and playback controls.
   */
  currentTick?: number;
  /**
   * Alternative to `currentTick` — resolved as `demo.frames[frameIndex].tick`.
   *
   * Useful when you already track `frameIndex` from {@link usePlayback} or
   * {@link useDemoReplay} and do not want to look up the tick yourself.
   */
  frameIndex?: number;
}

/**
 * Return value of {@link useKillfeed}.
 */
export interface UseKillfeedResult {
  /**
   * Killfeed rows visible at the current replay position.
   *
   * Newest kill first. Empty when `currentTick` is unknown or no kills are in
   * range. Pass to {@link DemoKillfeed} or render yourself.
   */
  entries: KillfeedEntry[];
  /**
   * Resolved replay tick used for filtering — from `options.currentTick` or
   * derived from `options.frameIndex`.
   */
  currentTick: number | undefined;
  /**
   * Resolved display window in ticks (from options or `tickRate * 5`).
   *
   * Exposed so custom UI can match the same linger duration (e.g. CSS
   * transitions keyed to `ageTicks / displayDurationTicks`).
   */
  displayDurationTicks: number;
}

/**
 * React hook that returns a replay-synced killfeed.
 *
 * Reads `demo.events`, keeps only kills, and filters to those visible at the
 * current tick — same rules as {@link getKillfeedEntries}. Recomputes when
 * playback advances, pauses, or the user scrubs.
 *
 * **Unstyled** — pair with {@link DemoKillfeed} or your own markup.
 *
 * @param demo - Parsed replay JSON (`demo.events` must include kill events), or `null`.
 * @param options - Replay position and feed limits; see {@link UseKillfeedOptions}.
 * @returns Visible entries and resolved tick/duration values.
 *
 * @example
 * Basic usage with `useDemoReplay`:
 * ```tsx
 * import { DemoKillfeed, useDemoReplay, useKillfeed } from "cs2-demo-viewer";
 *
 * function Replay({ demo }) {
 *   const replay = useDemoReplay(demo);
 *   const killfeed = useKillfeed(demo, { currentTick: replay.currentTick });
 *
 *   return (
 *     <>
 *       <DemoRadar demo={demo} frameIndex={replay.frameIndex} />
 *       <DemoKillfeed entries={killfeed.entries} />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * Using `frameIndex` instead of `currentTick`:
 * ```tsx
 * const killfeed = useKillfeed(demo, { frameIndex: replay.frameIndex });
 * ```
 *
 * @example
 * Custom row rendering:
 * ```tsx
 * <DemoKillfeed
 *   entries={killfeed.entries}
 *   renderEntry={(entry) => (
 *     <span>
 *       {entry.event.attacker} killed {entry.event.victim}
 *     </span>
 *   )}
 * />
 * ```
 */
export function useKillfeed(
  demo: DemoReplayLike | null,
  options: UseKillfeedOptions = {},
): UseKillfeedResult {
  const { currentTick: tickOption, frameIndex, maxEntries, displayDurationTicks, minEventTick, scopeToRound = true } = options;

  const kills = useMemo(
    () => (demo?.events ?? []).filter(isKillEvent),
    [demo?.events],
  );

  const currentTick = useMemo(() => {
    if (tickOption !== undefined) return tickOption;
    if (demo && frameIndex !== undefined) return demo.frames[frameIndex]?.tick;
    return undefined;
  }, [tickOption, demo, frameIndex]);

  const resolvedDisplayDurationTicks = useMemo(
    () => (demo ? displayDurationTicks ?? getKillfeedDisplayDurationTicks(demo) : 64 * 5),
    [demo, displayDurationTicks],
  );

  const resolvedMinEventTick = useMemo(() => {
    if (minEventTick !== undefined) return minEventTick;
    if (!scopeToRound || !demo || currentTick === undefined) return undefined;
    return getRoundAtTick(demo, currentTick)?.startTick;
  }, [minEventTick, scopeToRound, demo, currentTick]);

  const effectiveDisplayDurationTicks = useMemo(() => {
    if (displayDurationTicks !== undefined) return displayDurationTicks;
    if (
      scopeToRound &&
      resolvedMinEventTick !== undefined &&
      currentTick !== undefined
    ) {
      return Math.max(1, currentTick - resolvedMinEventTick + 1);
    }
    return resolvedDisplayDurationTicks;
  }, [
    displayDurationTicks,
    scopeToRound,
    resolvedMinEventTick,
    currentTick,
    resolvedDisplayDurationTicks,
  ]);

  const effectiveMaxEntries = useMemo(() => {
    if (maxEntries !== undefined) return maxEntries;
    return scopeToRound ? undefined : 5;
  }, [maxEntries, scopeToRound]);

  const entries = useMemo(
    () =>
      getKillfeedEntries(kills, currentTick, {
        maxEntries: effectiveMaxEntries,
        displayDurationTicks: effectiveDisplayDurationTicks,
        minEventTick: resolvedMinEventTick,
      }),
    [kills, currentTick, effectiveMaxEntries, effectiveDisplayDurationTicks, resolvedMinEventTick],
  );

  return {
    entries,
    currentTick,
    displayDurationTicks: effectiveDisplayDurationTicks,
  };
}
