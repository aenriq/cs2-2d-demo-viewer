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

/** One item bought during freeze time. */
export interface DemoPurchase {
  /** Item id — weapon (`ak47`, `m4a1_silencer`) or gear (`kevlar`, `kevlar_helmet`, `defuser`). */
  item: string;
  /** Cost in dollars. Omit if unknown. */
  cost?: number;
}

/** Per-player economy snapshot for a single round. */
export interface DemoPlayerEconomy {
  steamId: string;
  name: string;
  team: Team;
  /** Money at freeze end (start of playable round). */
  startMoney: number;
  /** Total spent during buy time this round. */
  moneySpent: number;
  /** Money at round end. Omit if round still in progress in replay. */
  endMoney?: number;
  /** Total equipment value at freeze end. */
  equipmentValue: number;
  /** Chronological buys during freeze. */
  purchases: DemoPurchase[];
  /** Resolved loadout after buys (convenience for UI). */
  primary?: string;
  secondary?: string;
  armor?: "none" | "kevlar" | "kevlar_helmet";
  /** Grenades owned after buys — e.g. `["smoke", "flash", "he"]`. */
  utilities?: string[];
}

/** Economy data for one round. */
export interface DemoRoundEconomy {
  roundNumber: number;
  /** Tick when freeze ends / buys lock. Optional — for replay sync markers. */
  freezeEndTick?: number;
  players: DemoPlayerEconomy[];
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
  /** Optional — omit when parser does not emit economy. */
  economy?: DemoRoundEconomy[];
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
