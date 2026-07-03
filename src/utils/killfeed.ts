import type { DemoEvent } from "../types.ts";
import type { DemoReplayLike } from "../replay/normalize-demo.ts";

/**
 * A {@link DemoEvent} narrowed to `type: "kill"`.
 *
 * Kill events are expected in `demo.events` with at least `tick`, `attacker`,
 * `victim`, and optionally `weapon`.
 */
export type KillEvent = DemoEvent & { type: "kill" };

/**
 * One row in the killfeed at a specific replay position.
 *
 * Produced by {@link getKillfeedEntries} and {@link useKillfeed}.
 */
export interface KillfeedEntry {
  /** The underlying kill event from `demo.events`. */
  event: KillEvent;
  /**
   * How many game ticks have elapsed since this kill at the current replay
   * position (`currentTick - event.tick`).
   *
   * Useful for fade-out animations or showing kill age in custom UI.
   */
  ageTicks: number;
}

/**
 * Options that control which kills appear in the feed and how long they linger.
 *
 * Passed to {@link getKillfeedEntries}, {@link getKillfeedEntriesForDemo}, and
 * {@link useKillfeed}.
 */
export interface GetKillfeedEntriesOptions {
  /**
   * Maximum number of kills shown at once. Oldest visible kill drops off when
   * a newer one arrives. Omit for no limit.
   *
   * @defaultValue `5` in {@link getKillfeedEntriesForDemo}; no limit in
   * {@link useKillfeed} when `scopeToRound` is true.
   */
  maxEntries?: number;
  /**
   * How long each kill stays visible after it happens, measured in **game
   * ticks** (not wall-clock ms).
   *
   * When omitted, {@link getKillfeedDisplayDurationTicks} derives ~5 seconds
   * from `demo.tickRate` (e.g. `320` at 64 tick, `640` at 128 tick).
   */
  displayDurationTicks?: number;
  /**
   * Only include kills at or after this tick — use the current round's
   * `startTick` so the feed clears when entering a new round.
   */
  minEventTick?: number;
}

const DEFAULT_MAX_ENTRIES = 5;
const DEFAULT_DISPLAY_SECONDS = 5;

/**
 * Type guard — narrows a {@link DemoEvent} to {@link KillEvent}.
 *
 * @example
 * ```ts
 * const kills = (demo.events ?? []).filter(isKillEvent);
 * ```
 */
export function isKillEvent(event: DemoEvent): event is KillEvent {
  return event.type === "kill";
}

/**
 * Default killfeed visibility window in ticks (~5 seconds of game time).
 *
 * @param demo - Replay JSON; uses `demo.tickRate` when set, otherwise `64`.
 * @returns `tickRate * 5` — e.g. `320` on a 64-tick server.
 */
export function getKillfeedDisplayDurationTicks(demo: DemoReplayLike): number {
  return (demo.tickRate ?? 64) * DEFAULT_DISPLAY_SECONDS;
}

/**
 * Compute killfeed rows visible at a given replay tick.
 *
 * Filtering rules (mirrors in-game killfeed behavior):
 * 1. Kill must have already happened (`event.tick <= currentTick`).
 * 2. Kill must still be within the display window
 *    (`currentTick - event.tick <= displayDurationTicks`).
 * 3. When `minEventTick` is set, kill must be in the current segment
 *    (`event.tick >= minEventTick`).
 * 4. Results are **newest first**, capped at `maxEntries`.
 *
 * With round scoping ({@link useKillfeed} `scopeToRound`), pass a
 * `displayDurationTicks` of `currentTick - minEventTick` so kills linger
 * for the whole round instead of ~5 seconds.
 *
 * Scrubbing backward removes kills that have not happened yet; scrubbing
 * forward reveals them as their tick is reached.
 *
 * @param kills - Pre-filtered kill events (see {@link isKillEvent}).
 * @param currentTick - Replay position in game ticks. `undefined` → empty array.
 * @param options - Cap and linger duration; see {@link GetKillfeedEntriesOptions}.
 * @returns Visible killfeed entries, newest first.
 *
 * @example
 * ```ts
 * const kills = (demo.events ?? []).filter(isKillEvent);
 * const entries = getKillfeedEntries(kills, replay.currentTick, {
 *   maxEntries: 5,
 * });
 * ```
 */
export function getKillfeedEntries(
  kills: readonly KillEvent[],
  currentTick: number | undefined,
  options: GetKillfeedEntriesOptions = {},
): KillfeedEntry[] {
  if (currentTick === undefined) return [];

  const maxEntries = options.maxEntries;
  const displayDurationTicks = options.displayDurationTicks ?? 64 * DEFAULT_DISPLAY_SECONDS;
  const minEventTick = options.minEventTick;

  const visible: KillfeedEntry[] = [];

  for (let i = kills.length - 1; i >= 0; i--) {
    const event = kills[i]!;
    if (minEventTick !== undefined && event.tick < minEventTick) continue;
    if (event.tick > currentTick) continue;

    const ageTicks = currentTick - event.tick;
    if (ageTicks > displayDurationTicks) continue;

    visible.push({ event, ageTicks });
    if (maxEntries !== undefined && visible.length >= maxEntries) break;
  }

  return visible;
}

/**
 * Convenience wrapper — extracts kills from `demo.events` and applies tick-rate
 * aware defaults before calling {@link getKillfeedEntries}.
 *
 * Use this outside React (e.g. tests, SSR, canvas layers). Inside components,
 * prefer {@link useKillfeed} for memoization.
 *
 * @param demo - Parsed replay JSON, or `null` → empty array.
 * @param currentTick - Replay position in game ticks.
 * @param options - See {@link GetKillfeedEntriesOptions}.
 * @returns Visible killfeed entries, newest first.
 */
export function getKillfeedEntriesForDemo(
  demo: DemoReplayLike | null,
  currentTick: number | undefined,
  options: GetKillfeedEntriesOptions = {},
): KillfeedEntry[] {
  if (!demo) return [];

  const kills = (demo.events ?? []).filter(isKillEvent);
  const displayDurationTicks =
    options.displayDurationTicks ?? getKillfeedDisplayDurationTicks(demo);

  return getKillfeedEntries(kills, currentTick, {
    ...options,
    maxEntries: options.maxEntries ?? DEFAULT_MAX_ENTRIES,
    displayDurationTicks,
  });
}
