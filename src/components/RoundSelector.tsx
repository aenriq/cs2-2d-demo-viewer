import type { ReactNode } from "react";
import type { DemoReplayInput } from "../replay/normalize-demo.ts";
import type { DemoRound } from "../types.ts";
import { teamStroke } from "../canvas/colors.ts";
import { getPlayableRounds } from "../utils/rounds.ts";

/** Winner team color — for custom round button styling. */
export function roundWinnerBorderColor(round: DemoRound): string {
  if (round.winner === "CT" || round.winner === "T") {
    return teamStroke(round.winner);
  }
  return "#666";
}

export interface RoundSelectorProps {
  demo: DemoReplayInput;
  currentRoundNumber?: number;
  onRoundSelect: (round: DemoRound) => void;
  className?: string;
  /** Insert a half separator after this round number. Default `12` (MR12). */
  halfAfterRound?: number;
  /** Custom round button. Default: unstyled native button. */
  renderRoundButton?: (props: {
    round: DemoRound;
    active: boolean;
    onSelect: () => void;
    borderColor: string;
    backgroundColor?: string;
  }) => ReactNode;
  /** Custom half separator. Default: unstyled `|`. */
  renderHalfSeparator?: () => ReactNode;
}

/** Unstyled round list — wire prev/next yourself via useDemoReplay. */
export function RoundSelector({
  demo,
  currentRoundNumber,
  onRoundSelect,
  className,
  halfAfterRound = 12,
  renderRoundButton,
  renderHalfSeparator,
}: RoundSelectorProps) {
  const rounds = getPlayableRounds(demo);
  const showHalfSeparator = rounds.some((round) => round.number > halfAfterRound);

  return (
    <div className={className}>
      {rounds.flatMap((round) => {
        const active = round.number === currentRoundNumber;
        const onSelect = () => onRoundSelect(round);
        const borderColor = roundWinnerBorderColor(round);
        const backgroundColor = active ? borderColor : undefined;

        const items: ReactNode[] = [
          renderRoundButton ? (
            renderRoundButton({
              round,
              active,
              onSelect,
              borderColor,
              backgroundColor,
            })
          ) : (
            <button
              key={round.number}
              type="button"
              aria-current={active ? "true" : undefined}
              data-round={round.number}
              data-winner={round.winner}
              data-active={active ? "" : undefined}
              onClick={onSelect}
            >
              {round.number}
            </button>
          ),
        ];

        if (showHalfSeparator && round.number === halfAfterRound) {
          items.push(
            renderHalfSeparator?.() ?? (
              <span key={`half-after-${round.number}`} aria-hidden="true" data-half-separator>
                |
              </span>
            ),
          );
        }

        return items;
      })}
    </div>
  );
}
