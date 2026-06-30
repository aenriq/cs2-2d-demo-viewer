import type { HTMLAttributes, ReactNode } from "react";
import type { KillfeedEntry } from "../utils/killfeed.ts";

/**
 * Default text for one killfeed row.
 *
 * Format: `attacker → victim (weapon)` — missing fields render as `?`.
 *
 * @param entry - Row from {@link useKillfeed} or {@link getKillfeedEntries}.
 * @returns Plain string suitable for unstyled list items or aria labels.
 *
 * @example
 * ```ts
 * formatKillfeedEntry(entry); // "s1mple → niko (ak47)"
 * ```
 */
export function formatKillfeedEntry(entry: KillfeedEntry): string {
  const { attacker, victim, weapon } = entry.event;
  return `${attacker ?? "?"} → ${victim ?? "?"}${weapon ? ` (${weapon})` : ""}`;
}

/**
 * Props for {@link DemoKillfeed}.
 */
export interface DemoKillfeedProps extends HTMLAttributes<HTMLUListElement> {
  /**
   * Visible killfeed rows — from {@link useKillfeed} `.entries` or
   * {@link getKillfeedEntries}.
   *
   * Order is newest-first; do not re-sort unless you have a specific UX reason.
   */
  entries: KillfeedEntry[];
  /**
   * Replace the default list item content.
   *
   * Receives each {@link KillfeedEntry} (includes `event` and `ageTicks`).
   * Use for team colors, weapon icons, headshot badges, etc.
   *
   * @example
   * ```tsx
   * renderEntry={(entry) => (
   *   <span className={entry.event.attackerTeam}>
   *     {formatKillfeedEntry(entry)}
   *   </span>
   * )}
   * ```
   */
  renderEntry?: (entry: KillfeedEntry) => ReactNode;
}

/**
 * Unstyled killfeed list (`<ul>`).
 *
 * Renders only kills that {@link useKillfeed} (or {@link getKillfeedEntries})
 * considers visible at the current replay tick. No CSS shipped — style via
 * `className`, `renderEntry`, or your design system.
 *
 * @example
 * ```tsx
 * const replay = useDemoReplay(demo);
 * const killfeed = useKillfeed(demo, { currentTick: replay.currentTick });
 *
 * <DemoKillfeed className="my-killfeed" entries={killfeed.entries} />
 * ```
 *
 * @example
 * Built into {@link DemoReplayPlayer}:
 * ```tsx
 * <DemoReplayPlayer demo={demo} showKillfeed />
 * ```
 */
export function DemoKillfeed({ entries, renderEntry, ...rest }: DemoKillfeedProps) {
  return (
    <ul {...rest}>
      {entries.map((entry) => {
        const key = `${entry.event.tick}-${entry.event.attacker ?? ""}-${entry.event.victim ?? ""}`;

        if (renderEntry) {
          return <li key={key}>{renderEntry(entry)}</li>;
        }

        return <li key={key}>{formatKillfeedEntry(entry)}</li>;
      })}
    </ul>
  );
}
