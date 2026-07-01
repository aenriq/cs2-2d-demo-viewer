# Full replay

Kitchen-sink example — every major feature of **cs2-demo-viewer** in one composed layout.

Compare with [basic-replay](../basic-replay/) if you only need radar + play/scrub.

## What's included

| Feature | How it's used |
|---------|----------------|
| `createDemoReplayPlayer` | Init with `viewPreset: "full"` — all layers enabled |
| `player.Provider` + `player.useDemo` | Playback + view toggles |
| `player.Radar` | Canvas with map, players, tracers, utilities, grenade paths, flash |
| `useDemoReplay` | Frame index, play/pause, round navigation, layer toggles |
| `useKillfeed` | Replay-synced killfeed |
| `useEconomy` | Per-round buys, loadout, team totals, buy-type labels |
| `PlaybackControls` | Play + scrubber |
| `RoundSelector` | Round buttons + prev/next |
| `DemoKillfeed` | Kill list with custom `renderEntry` |
| `DemoEventList` | Full event log synced to tick |

## Fixture (`src/demo.json`)

Bundled JSON includes **all optional fields** the viewer supports:

- `frames` — 4 players, 2 rounds, flash overlay on one frame
- `rounds` — round boundaries + winners
- `events` — kills, round start/end, bomb plant
- `shots` — team-colored tracers
- `utilities` — smoke + flash effects
- `grenadePaths` — smoke trajectory
- `economy` — per-player purchases for both rounds
- `mapMeta.radarUrl` — de_dust2 radar image

## Layout

```
┌─────────────────────────────────┬──────────────┐
│  Toolbar (presets + toggles)    │              │
├─────────────────────────────────┤   Killfeed   │
│                                 ├──────────────┤
│  DemoRadar (full layers)        │   Economy    │
│                                 ├──────────────┤
│  PlaybackControls               │   Events     │
│  RoundSelector + prev/next      │              │
└─────────────────────────────────┴──────────────┘
```

Scrub between rounds — economy panel updates to that round's buys. Killfeed and events follow the current tick.

## Run

From the repository root:

```bash
npm run build
cd examples/full-replay
npm install
npm run dev
```

Opens on **http://localhost:5175** (basic-replay uses 5174).

## Try

1. Play through round 1 — watch killfeed + kill event highlight.
2. Jump to round 2 — economy switches to gun-round buys.
3. Scrub to tick ~104 — flash overlay on Charlie (toggle in toolbar).
4. Toggle grenade paths / utilities / tracers independently.
5. Switch preset to `minimal` — layers drop off; toggles hide when unavailable.

## Production usage

Same pattern works with real parser output — replace `demo.json` with your API response. Economy requires `economy[]` in JSON; other fields are optional and layers no-op when missing.
