import type { HTMLAttributes, ReactNode } from "react";
import type { DemoEvent } from "../types.ts";

export function formatDemoEvent(event: DemoEvent): string {
  if (event.type === "kill") {
    return `${event.attacker ?? "?"} → ${event.victim ?? "?"} (${event.weapon ?? "?"})`;
  }
  if (event.type === "round_end") {
    return `Round end — ${event.winner ?? "?"} win`;
  }
  return event.type;
}

export interface DemoEventListProps extends HTMLAttributes<HTMLUListElement> {
  events: DemoEvent[];
  currentTick?: number;
  renderItem?: (event: DemoEvent, active: boolean) => ReactNode;
}

/** Unstyled kill/event log. */
export function DemoEventList({
  events,
  currentTick,
  renderItem,
  ...rest
}: DemoEventListProps) {
  return (
    <ul {...rest}>
      {events.map((event, i) => {
        const active = currentTick !== undefined && event.tick <= currentTick;
        const key = `${event.tick}-${event.type}-${i}`;

        if (renderItem) {
          return <li key={key}>{renderItem(event, active)}</li>;
        }

        return (
          <li key={key} data-active={active ? "" : undefined}>
            [{event.tick}] {formatDemoEvent(event)}
          </li>
        );
      })}
    </ul>
  );
}
