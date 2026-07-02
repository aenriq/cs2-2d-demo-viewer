#!/usr/bin/env bun
/**
 * Download CS2 killfeed SVGs from Juknum/counter-strike-icons (game-extracted).
 *
 * Usage: bun run scripts/fetch-killfeed-icons.ts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const REPO = "Juknum/counter-strike-icons";
const BRANCH = "main";
const ROOT = resolve(import.meta.dir, "../assets/killfeed");

const EQUIPMENT_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/cs2/panorama/images/icons/equipment`;
const DEATHNOTICE_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/cs2/panorama/images/hud/deathnotice`;

/** Weapons + utilities shown in killfeed. Matches CS2 equipment icon names. */
const EQUIPMENT_ICONS = [
  "ak47",
  "aug",
  "awp",
  "bizon",
  "c4",
  "cz75a",
  "deagle",
  "decoy",
  "elite",
  "famas",
  "fiveseven",
  "flashbang",
  "flashbang_assist",
  "g3sg1",
  "galilar",
  "glock",
  "hegrenade",
  "hkp2000",
  "incgrenade",
  "inferno",
  "knife",
  "knife_bowie",
  "knife_butterfly",
  "knife_canis",
  "knife_cord",
  "knife_css",
  "knife_falchion",
  "knife_flip",
  "knife_gut",
  "knife_gypsy_jackknife",
  "knife_karambit",
  "knife_kukri",
  "knife_m9_bayonet",
  "knife_outdoor",
  "knife_push",
  "knife_skeleton",
  "knife_stiletto",
  "knife_survival_bowie",
  "knife_t",
  "knife_tactical",
  "knife_twinblade",
  "knife_ursus",
  "knife_widowmaker",
  "m249",
  "m4a1",
  "m4a1_silencer",
  "m4a1_silencer_off",
  "mac10",
  "mag7",
  "molotov",
  "mp5sd",
  "mp7",
  "mp9",
  "negev",
  "nova",
  "p2000",
  "p250",
  "p90",
  "prop_exploding_barrel",
  "revolver",
  "sawedoff",
  "scar20",
  "sg556",
  "smokegrenade",
  "ssg08",
  "taser",
  "tec9",
  "ump45",
  "usp_silencer",
  "usp_silencer_off",
  "world",
  "xm1014",
] as const;

/** [remote filename, local filename] under modifiers/ */
const MODIFIER_ICONS: Array<[string, string]> = [
  ["icon_headshot", "headshot"],
  ["noscope", "noscope"],
  ["blind_kill", "blind"],
  ["smoke_kill", "smoke"],
  ["penetrate", "penetrate"],
  ["inairkill", "inair"],
  ["revenge", "revenge"],
  ["domination", "domination"],
  ["icon_suicide", "suicide"],
];

async function fetchSvg(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.includes("<svg")) return null;
    return text;
  } catch {
    return null;
  }
}

async function downloadEquipment(name: string): Promise<boolean> {
  const url = `${EQUIPMENT_BASE}/${name}.svg`;
  const svg = await fetchSvg(url);
  if (!svg) {
    console.warn(`  miss equipment: ${name}`);
    return false;
  }
  const out = resolve(ROOT, "equipment", `${name}.svg`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, svg);
  return true;
}

async function downloadModifier(remote: string, local: string): Promise<boolean> {
  const url = `${DEATHNOTICE_BASE}/${remote}.svg`;
  const svg = await fetchSvg(url);
  if (!svg) {
    console.warn(`  miss modifier: ${remote}`);
    return false;
  }
  const out = resolve(ROOT, "modifiers", `${local}.svg`);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, svg);
  return true;
}

async function main() {
  console.log(`Saving to ${ROOT}`);

  let ok = 0;
  let fail = 0;

  for (const name of EQUIPMENT_ICONS) {
    if (await downloadEquipment(name)) ok++;
    else fail++;
  }

  for (const [remote, local] of MODIFIER_ICONS) {
    if (await downloadModifier(remote, local)) ok++;
    else fail++;
  }

  console.log(`Done — ${ok} saved, ${fail} missing`);
}

main();
