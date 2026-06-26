import type { Team } from "../types.ts";

export function teamFill(team: Team | string): string {
  if (team === "CT") return "#8ecae6";
  if (team === "T") return "#d4a574";
  return "#888";
}

export function teamStroke(team: Team | string): string {
  if (team === "CT") return "#5a9ec4";
  if (team === "T") return "#a67c52";
  return "#666";
}

export function teamTracer(team: Team | string): string {
  if (team === "CT") return "rgba(142, 202, 230, 0.95)";
  if (team === "T") return "rgba(255, 255, 255, 0.9)";
  return "rgba(200, 200, 200, 0.8)";
}

export function teamEmptyGlass(team: Team | string): string {
  if (team === "CT") return "rgba(142, 202, 230, 0.18)";
  if (team === "T") return "rgba(212, 165, 116, 0.18)";
  return "rgba(160, 160, 160, 0.18)";
}
