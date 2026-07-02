import type { KillEvent } from "../utils/killfeed.ts";

/** Default URL prefix when assets are served from `/killfeed` (see `assets/` + Vite publicDir). */
export const DEFAULT_KILLFEED_ICON_BASE = "/killfeed";

export type KillfeedModifierId =
  | "headshot"
  | "noscope"
  | "blind"
  | "smoke"
  | "penetrate"
  | "inair"
  | "revenge"
  | "flash_assist"
  | "domination"
  | "suicide";

/** Demo `weapon` strings → equipment SVG basename (no extension). */
const WEAPON_ICON_ALIASES: Record<string, string> = {
  ak47: "ak47",
  weapon_ak47: "ak47",
  aug: "aug",
  weapon_aug: "aug",
  awp: "awp",
  weapon_awp: "awp",
  bizon: "bizon",
  weapon_bizon: "bizon",
  c4: "c4",
  weapon_c4: "c4",
  cz75a: "cz75a",
  weapon_cz75a: "cz75a",
  deagle: "deagle",
  weapon_deagle: "deagle",
  decoy: "decoy",
  weapon_decoy: "decoy",
  elite: "elite",
  weapon_elite: "elite",
  famas: "famas",
  weapon_famas: "famas",
  fiveseven: "fiveseven",
  weapon_fiveseven: "fiveseven",
  flashbang: "flashbang",
  weapon_flashbang: "flashbang",
  g3sg1: "g3sg1",
  weapon_g3sg1: "g3sg1",
  galilar: "galilar",
  weapon_galilar: "galilar",
  glock: "glock",
  weapon_glock: "glock",
  hegrenade: "hegrenade",
  weapon_hegrenade: "hegrenade",
  hkp2000: "hkp2000",
  weapon_hkp2000: "hkp2000",
  p2000: "hkp2000",
  weapon_p2000: "hkp2000",
  incgrenade: "incgrenade",
  weapon_incgrenade: "incgrenade",
  inferno: "inferno",
  weapon_inferno: "inferno",
  knife: "knife",
  weapon_knife: "knife",
  weapon_knife_t: "knife_t",
  knife_t: "knife_t",
  knife_bowie: "knife_bowie",
  weapon_knife_bowie: "knife_bowie",
  knife_butterfly: "knife_butterfly",
  weapon_knife_butterfly: "knife_butterfly",
  knife_canis: "knife_canis",
  weapon_knife_canis: "knife_canis",
  knife_cord: "knife_cord",
  weapon_knife_cord: "knife_cord",
  knife_css: "knife_css",
  weapon_knife_css: "knife_css",
  knife_falchion: "knife_falchion",
  weapon_knife_falchion: "knife_falchion",
  knife_flip: "knife_flip",
  weapon_knife_flip: "knife_flip",
  knife_gut: "knife_gut",
  weapon_knife_gut: "knife_gut",
  knife_gypsy_jackknife: "knife_gypsy_jackknife",
  weapon_knife_gypsy_jackknife: "knife_gypsy_jackknife",
  knife_karambit: "knife_karambit",
  weapon_knife_karambit: "knife_karambit",
  knife_kukri: "knife_kukri",
  weapon_knife_kukri: "knife_kukri",
  knife_m9_bayonet: "knife_m9_bayonet",
  weapon_knife_m9_bayonet: "knife_m9_bayonet",
  knife_outdoor: "knife_outdoor",
  weapon_knife_outdoor: "knife_outdoor",
  knife_push: "knife_push",
  weapon_knife_push: "knife_push",
  knife_skeleton: "knife_skeleton",
  weapon_knife_skeleton: "knife_skeleton",
  knife_stiletto: "knife_stiletto",
  weapon_knife_stiletto: "knife_stiletto",
  knife_survival_bowie: "knife_survival_bowie",
  weapon_knife_survival_bowie: "knife_survival_bowie",
  knife_tactical: "knife_tactical",
  weapon_knife_tactical: "knife_tactical",
  knife_twinblade: "knife_twinblade",
  weapon_knife_twinblade: "knife_twinblade",
  knife_ursus: "knife_ursus",
  weapon_knife_ursus: "knife_ursus",
  knife_widowmaker: "knife_widowmaker",
  weapon_knife_widowmaker: "knife_widowmaker",
  m249: "m249",
  weapon_m249: "m249",
  m4a1: "m4a1",
  weapon_m4a1: "m4a1",
  m4a1_silencer: "m4a1_silencer",
  weapon_m4a1_silencer: "m4a1_silencer",
  m4a1_silencer_off: "m4a1_silencer_off",
  weapon_m4a1_silencer_off: "m4a1_silencer_off",
  mac10: "mac10",
  weapon_mac10: "mac10",
  mag7: "mag7",
  weapon_mag7: "mag7",
  molotov: "molotov",
  weapon_molotov: "molotov",
  mp5sd: "mp5sd",
  weapon_mp5sd: "mp5sd",
  mp7: "mp7",
  weapon_mp7: "mp7",
  mp9: "mp9",
  weapon_mp9: "mp9",
  negev: "negev",
  weapon_negev: "negev",
  nova: "nova",
  weapon_nova: "nova",
  p250: "p250",
  weapon_p250: "p250",
  p90: "p90",
  weapon_p90: "p90",
  revolver: "revolver",
  weapon_revolver: "revolver",
  sawedoff: "sawedoff",
  weapon_sawedoff: "sawedoff",
  scar20: "scar20",
  weapon_scar20: "scar20",
  sg556: "sg556",
  weapon_sg556: "sg556",
  smokegrenade: "smokegrenade",
  weapon_smokegrenade: "smokegrenade",
  ssg08: "ssg08",
  weapon_ssg08: "ssg08",
  taser: "taser",
  weapon_taser: "taser",
  tec9: "tec9",
  weapon_tec9: "tec9",
  ump45: "ump45",
  weapon_ump45: "ump45",
  usp_silencer: "usp_silencer",
  weapon_usp_silencer: "usp_silencer",
  usp_silencer_off: "usp_silencer_off",
  weapon_usp_silencer_off: "usp_silencer_off",
  xm1014: "xm1014",
  weapon_xm1014: "xm1014",
  world: "world",
  weapon_world: "world",
  prop_exploding_barrel: "prop_exploding_barrel",
};

const FALLBACK_WEAPON_ICON = "world";

/** Normalize demo weapon string to equipment icon basename. */
export function resolveWeaponIconId(weapon: string | undefined): string {
  if (!weapon) return FALLBACK_WEAPON_ICON;

  const normalized = weapon.trim().toLowerCase();
  if (WEAPON_ICON_ALIASES[normalized]) return WEAPON_ICON_ALIASES[normalized];

  const stripped = normalized.replace(/^weapon_/, "");
  if (WEAPON_ICON_ALIASES[stripped]) return WEAPON_ICON_ALIASES[stripped];

  return stripped || FALLBACK_WEAPON_ICON;
}

export function getWeaponIconUrl(
  weapon: string | undefined,
  baseUrl: string = DEFAULT_KILLFEED_ICON_BASE,
): string {
  const id = resolveWeaponIconId(weapon);
  return `${baseUrl}/equipment/${id}.svg`;
}

export function getModifierIconUrl(
  modifier: KillfeedModifierId,
  baseUrl: string = DEFAULT_KILLFEED_ICON_BASE,
): string {
  if (modifier === "flash_assist") {
    return `${baseUrl}/equipment/flashbang_assist.svg`;
  }
  return `${baseUrl}/modifiers/${modifier}.svg`;
}

/** Modifier icons to show for a kill, in killfeed display order. */
export function getKillModifiers(event: KillEvent): KillfeedModifierId[] {
  const mods: KillfeedModifierId[] = [];

  if (event.penetrated && event.penetrated > 0) mods.push("penetrate");
  if (event.headshot) mods.push("headshot");
  if (event.noscope) mods.push("noscope");
  if (event.thrusmoke) mods.push("smoke");
  if (event.attackerblind) mods.push("blind");
  if (event.attackerinair) mods.push("inair");
  if (event.assistedflash) mods.push("flash_assist");
  if (event.revenge) mods.push("revenge");

  return mods;
}

export const KILLFEED_MODIFIER_LABELS: Record<KillfeedModifierId, string> = {
  headshot: "Headshot",
  noscope: "No scope",
  blind: "Blinded",
  smoke: "Through smoke",
  penetrate: "Wallbang",
  inair: "Jump shot",
  revenge: "Revenge",
  flash_assist: "Flash assist",
  domination: "Domination",
  suicide: "Suicide",
};

export const KILLFEED_EQUIPMENT_ICONS = [
  "ak47",
  "awp",
  "deagle",
  "glock",
  "knife",
  "m4a1",
  "m4a1_silencer",
  "usp_silencer",
  "hegrenade",
  "smokegrenade",
  "flashbang",
  "molotov",
  "taser",
  "world",
] as const;

export const KILLFEED_MODIFIER_ICONS: KillfeedModifierId[] = [
  "headshot",
  "noscope",
  "blind",
  "smoke",
  "penetrate",
  "inair",
  "revenge",
  "flash_assist",
];
