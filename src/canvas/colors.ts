import type { Team } from "../types.ts";

/** CT / T player fill colors for radar markers. */
export function teamFill(team: Team | string): string {
  if (team === "CT") return "#5DA8F0";
  if (team === "T") return "#F0984A";
  return "#9aa3b2";
}

export function teamStroke(team: Team | string): string {
  if (team === "CT") return "#3D8AD4";
  if (team === "T") return "#D07A32";
  return "#666";
}

export function teamTracer(team: Team | string): string {
  if (team === "CT") return "rgba(93, 168, 240, 0.85)";
  if (team === "T") return "rgba(255, 255, 255, 0.75)";
  return "rgba(200, 200, 200, 0.7)";
}

export function teamVisionCone(team: Team | string): string {
  if (team === "CT") return "rgba(93, 168, 240, 0.22)";
  if (team === "T") return "rgba(240, 152, 74, 0.22)";
  return "rgba(160, 160, 160, 0.18)";
}

export function teamEmptyGlass(team: Team | string): string {
  if (team === "CT") return "rgba(93, 168, 240, 0.18)";
  if (team === "T") return "rgba(240, 152, 74, 0.18)";
  return "rgba(160, 160, 160, 0.18)";
}

export function teamHealthRing(team: Team | string, healthPct: number): string {
  if (healthPct <= 0.25) return "#ff6b6b";
  if (healthPct <= 0.5) return "#ffd166";
  if (team === "CT") return "#8ec8ff";
  if (team === "T") return "#ffc48a";
  return "#ccc";
}
