export type Team = "CT" | "T" | "SPEC";

export interface MapMeta {
  name: string;
  posX: number;
  posY: number;
  scale: number;
  /** Z cutoff for lower radar on multi-floor maps (e.g. de_nuke). */
  thresholdZ?: number;
  radarUrl: string;
  lowerRadarUrl?: string;
}

export interface RadarPoint {
  x: number;
  y: number;
}

export interface PlayerFrame {
  steamId: string;
  name: string;
  team: Team;
  x: number;
  y: number;
  z: number;
  radar: RadarPoint;
  health: number;
  alive: boolean;
  yaw: number;
  weapon?: string;
  /** Seconds remaining blinded (0 = not flashed). */
  flashDuration?: number;
  /** 0–255 flash overlay intensity. */
  flashAlpha?: number;
}

export type UtilityType = "smoke" | "flash" | "he" | "molotov" | "decoy";

export interface DemoUtilityEffect {
  id: string;
  type: UtilityType;
  entityId?: number;
  startTick: number;
  endTick: number;
  radar: RadarPoint;
  throwerName?: string;
  throwerTeam?: Team;
}

export interface DemoGrenadePath {
  entityId: number;
  type: UtilityType;
  throwerName?: string;
  throwerTeam?: Team;
  endTick: number;
  points: Array<{ tick: number; radar: RadarPoint }>;
}

export interface DemoFrame {
  tick: number;
  players: PlayerFrame[];
}

export interface DemoEvent {
  tick: number;
  type: "kill" | "round_start" | "round_end" | "bomb_planted" | "bomb_defused";
  attacker?: string;
  victim?: string;
  weapon?: string;
  winner?: Team;
}

export interface DemoShot {
  tick: number;
  team: Team;
  from: RadarPoint;
  to: RadarPoint;
}

export interface DemoRound {
  number: number;
  startTick: number;
  endTick: number;
  winner?: Team;
}

/** Parsed demo JSON schema consumed by the viewer. */
export interface ParsedDemo {
  map: string;
  tickRate: number;
  totalTicks: number;
  rounds: DemoRound[];
  frames: DemoFrame[];
  events: DemoEvent[];
  /** Optional — omit for minimal position-only replay JSON. */
  shots?: DemoShot[];
  utilities?: DemoUtilityEffect[];
  grenadePaths?: DemoGrenadePath[];
}

export interface DemoMapMeta {
  radarUrl: string;
  lowerRadarUrl?: string;
  thresholdZ?: number;
}

/** Demo JSON with optional radar image URLs for the canvas. */
export interface DemoReplayData extends ParsedDemo {
  mapMeta?: DemoMapMeta | null;
}
