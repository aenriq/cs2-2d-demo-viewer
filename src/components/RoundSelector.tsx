import type { ReactNode } from "react";
import type { DemoReplayInput } from "../replay/normalize-demo.ts";
import type { DemoRound } from "../types.ts";

export interface RoundSelectorProps {
  demo: DemoReplayInput;
  currentRoundNumber?: number;
  onRoundSelect: (round: DemoRound) => void;
  className?: string;
  /** Custom round button. Default: unstyled native button. */
  renderRoundButton?: (props: {
    round: DemoRound;
    active: boolean;
    onSelect: () => void;
  }) => ReactNode;
}

/** Unstyled round list — wire prev/next yourself via useDemoReplay. */
export function RoundSelector({
  demo,
  currentRoundNumber,
  onRoundSelect,
  className,
  renderRoundButton,
}: RoundSelectorProps) {
  return (
    <div className={className}>
      {(demo.rounds ?? []).map((round) => {
        const active = round.number === currentRoundNumber;
        const onSelect = () => onRoundSelect(round);

        if (renderRoundButton) {
          return (
            <span key={round.number}>
              {renderRoundButton({ round, active, onSelect })}
            </span>
          );
        }

        return (
          <button
            key={round.number}
            type="button"
            aria-current={active ? "true" : undefined}
            data-round={round.number}
            data-active={active ? "" : undefined}
            onClick={onSelect}
          >
            {round.number}
          </button>
        );
      })}
    </div>
  );
}
