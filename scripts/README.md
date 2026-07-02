# Demo parser

Turns a CS2 `.dem` into `replay.json` for [cs2-demo-viewer](../README.md).

Uses [@laihoe/demoparser2](https://github.com/LaihoE/demoparser) (Rust, Node bindings).

```bash
cd scripts
bun install
bun run parse ../path/to/match.dem --out ../replay.json
bun run parse ../path/to/match.dem --full   # shots, utilities, grenade paths
```

| Flag | Default | Purpose |
|------|---------|---------|
| `--out` | `replay.json` | Output path |
| `--interval` | `4` | Sample every N ticks — `4` (~16 Hz) or `8` (~8 Hz) at 64 tick |
| `--full` | off | Also extract tracers, utility circles, grenade arcs |

Load output in dev app: `bun run dev` → file picker.

Killfeed icons (weapons + modifiers): `bun run fetch-icons` → `assets/killfeed/`.

---

## What demo data maps to 2D radar

Viewer consumes parsed JSON — not raw `.dem`. Below: what parsers expose, what this script extracts, what viewer uses.

### Required (minimal replay)

| Demo source | Fields | Viewer field | 2D use |
|-------------|--------|--------------|--------|
| Header | `map_name` | `map` | Pick radar image + world→radar transform |
| Tick snapshots | `X`, `Y`, `Z` | `frames[].players.{x,y,z,radar}` | Dots on map |
| Tick snapshots | `player_steamid`, `player_name` | `steamId`, `name` | Identity / labels |
| Tick snapshots | `team_num` (2=T, 3=CT) | `team` | Color |
| Tick snapshots | `health`, `is_alive` | `health`, `alive` | HP ring, death marker |
| Tick snapshots | `yaw` | `yaw` | View direction beak |

### Events & rounds (timeline UI)

| Demo event | Viewer `events[]` | 2D use |
|------------|-------------------|--------|
| `player_death` | `kill` | Killfeed, event log — includes `headshot`, `noscope`, `thrusmoke`, `attackerblind`, `penetrated`, etc. |
| `round_start` / `round_end` | same | Round scrubber, round bounds |
| `bomb_planted` / `bomb_defused` | same | Event log (bomb icon later) |

| Derived | Viewer field | 2D use |
|---------|--------------|--------|
| Round start/end ticks | `rounds[]` | Jump between rounds |

### Optional layers (`--full`)

| Demo source | Viewer field | 2D use |
|-------------|--------------|--------|
| `weapon_fire` + position/yaw | `shots[]` | Bullet tracers |
| `*_detonate` / `inferno_*` / `decoy_*` | `utilities[]` | Smoke/molly/flash/HE circles |
| `parseGrenades()` trajectories | `grenadePaths[]` | In-flight grenade arcs |
| `flash_duration`, `flash_max_alpha` | on `PlayerFrame` | White flash overlay |

### Map metadata (not in demo file)

Radar PNGs + `posX` / `posY` / `scale` come from game VDFs (`resource/overviews/<map>.txt`), not the demo.

| Field | Purpose |
|-------|---------|
| `posX`, `posY`, `scale` | World units → normalized 0–1 radar coords |
| `thresholdZ` | Multi-floor maps (nuke): pick upper/lower radar |
| `radarUrl` | Background image URL in `mapMeta` |
| `lowerRadarUrl` | Lower-floor radar (nuke, train, vertigo) |

Built-in map table: [`map-meta.ts`](./map-meta.ts). Extend for workshop maps.

**Radar PNGs:** parser fills `mapMeta.radarUrl` from official game overviews via [MurkyYT/cs2-map-icons](https://github.com/MurkyYT/cs2-map-icons):

```
https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/{map}_radar_psd.png
https://raw.githubusercontent.com/MurkyYT/cs2-map-icons/main/images/radars/{map}_lower_radar_psd.png
```

Viewer also backfills missing URLs at runtime (`resolveDemoMapMeta`).

---

## Rich demo data (not wired yet)

Useful for future layers / analytics — available from demoparser2 but not exported by default:

| Category | Example fields | Possible 2D use |
|----------|----------------|-----------------|
| Economy | `balance`, buys, equip value | Round economy strip |
| Combat | `damage`, `shots_fired`, `is_scoped` | Damage ticks, scope indicator |
| Utility state | `has_defuser`, `is_defusing`, `in_bomb_zone` | Defuse animation, zone tint |
| Spotted | `spotted`, `approximate_spotted_by` | Fog-of-war / last-known-pos |
| Movement | `velocity`, `is_walking`, buttons | Speed trails |
| Rank/MMR | `rank`, `comp_wins` | Match context header |
| Voice | `parseVoice()` | Audio sync (not canvas) |
| Nav mesh | awpy `.nav` parse | Pathing, distance, visibility |

---

## Parser backends

| Tool | Lang | Style |
|------|------|-------|
| [@laihoe/demoparser2](https://github.com/LaihoE/demoparser) | Rust + Node/Python | Query / columnar |
| [demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang) | Go | Stream + callbacks |
| [awpy](https://github.com/pnxenopoulos/awpy) | Python | Analytics wrapper over demoparser2 |

This repo uses demoparser2 because the viewer stack is already TS/Bun.

---

## Output schema

Matches [`src/types.ts`](../src/types.ts) → `DemoReplayData`.

Minimal example:

```json
{
  "map": "de_dust2",
  "tickRate": 64,
  "totalTicks": 120000,
  "rounds": [{ "number": 1, "startTick": 0, "endTick": 8000 }],
  "frames": [{
    "tick": 0,
    "players": [{
      "steamId": "7656119…",
      "name": "Player",
      "team": "CT",
      "x": 100, "y": 200, "z": 0,
      "radar": { "x": 0.42, "y": 0.55 },
      "health": 100,
      "alive": true,
      "yaw": 90
    }]
  }],
  "events": []
}
```
