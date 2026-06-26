# cs2-demo-viewer

Unstyled React components + hooks for CS2 2D demo replay **from parsed JSON**.

This package is viewer-only — bring your own parsed demo JSON (from any parser or backend).

## Philosophy

**Hooks hold behavior. You bring buttons.**

No special button components for prev/next round — use `useDemoReplay` and your own `<button>` elements.

## Initialize once, use anywhere

Create player at app setup with **capabilities** — hard caps on what renders, even when JSON has more data.

Omit options or pass `{}` to enable everything (full layers, all toggles):

```tsx
const player = createDemoReplayPlayer(); // or createDemoReplayPlayer({})
```

Disable specific features at init:

```tsx
import { createDemoReplayPlayer } from "cs2-demo-viewer";

const player = createDemoReplayPlayer({
  viewPreset: "full",
  capabilities: {
    tracers: true,
    utilities: true,
    grenadePaths: false,   // never draw paths
    flashOverlay: false,   // ignore flash data on players
    playerNames: true,
  },
});

function App() {
  return (
    <player.Provider>
      <MatchPage />
    </player.Provider>
  );
}

function MatchPage({ demo }) {
  const replay = player.useDemo(demo);

  return (
    <>
      <player.Radar demo={demo} frameIndex={replay.frameIndex} drawOptions={replay.drawOptions} />
      {replay.canToggleTracers && (
        <button type="button" onClick={replay.toggleTracers}>Tracers</button>
      )}
    </>
  );
}
```

| Capability | Layer / effect |
|------------|----------------|
| `tracers` | `shots` layer |
| `utilities` | `utilities` layer |
| `grenadePaths` | `grenadePaths` layer |
| `flashOverlay` | white overlay on flashed players |
| `playerNames` | name labels |

`false` at init → layer excluded + toggles hidden (`canToggle*` false).

Provider optional if you use the same factory's `.useDemo()` / `.Radar()` — they fall back to factory config.

## Full vs minimal replay

`DemoRadar` accepts **partial JSON**. Only `map` + `frames` required:

```json
{
  "map": "de_dust2",
  "frames": [{ "tick": 0, "players": [...] }]
}
```

Optional fields (`shots`, `utilities`, `grenadePaths`, `rounds`, `events`) are filled with empty arrays by `normalizeDemoReplay()` (default in `DemoRadar`).

| Preset | Layers | View toggles |
|--------|--------|--------------|
| `minimal` | map + players | no tracers/util/paths/flash |
| `standard` | + utilities + shots | no grenade paths |
| `full` | everything | all on |

```tsx
const replay = useDemoReplay(demo, { viewPreset: "minimal", layerPreset: "minimal" });

<DemoRadar
  demo={demo}
  frameIndex={replay.frameIndex}
  drawOptions={replay.drawOptions}
  layerPreset={replay.layerPreset}
/>
```

## Modular canvas layers

Drawing is split into pluggable layers. Compose with `createReplayLayers()`:

```tsx
import {
  createReplayLayers,
  mapLayer,
  playersLayer,
  type ReplayLayer,
} from "cs2-demo-viewer";

const myLayer: ReplayLayer = {
  id: "killFeed",
  order: 50,
  draw({ ctx, frame, size }) {
    // custom overlay
  },
};

<DemoRadar
  demo={demo}
  frameIndex={0}
  layers={createReplayLayers({
    preset: "standard",
    custom: [myLayer],
    exclude: ["grenadePaths"],
  })}
/>
```

Built-in layers: `map`, `grenadePaths`, `utilities`, `shots`, `players`.

Each layer can define `isAvailable(demo)` — skipped when data missing (e.g. no `shots` in JSON).

## Primary hook: `useDemoReplay`

```tsx
import { DemoRadar, RoundSelector, useDemoReplay } from "cs2-demo-viewer";

function Replay({ demo }) {
  const replay = useDemoReplay(demo, { viewPreset: "standard" });

  return (
    <>
      <button
        type="button"
        disabled={!replay.hasPreviousRound}
        onClick={replay.goToPreviousRound}
      >
        ← Prev round
      </button>

      <DemoRadar
        demo={demo}
        frameIndex={replay.frameIndex}
        drawOptions={replay.drawOptions}
        layerPreset={replay.layerPreset}
      />

      <button
        type="button"
        disabled={!replay.hasNextRound}
        onClick={replay.goToNextRound}
      >
        Next round →
      </button>

      <RoundSelector
        demo={demo}
        currentRoundNumber={replay.currentRound?.number}
        onRoundSelect={(r) => replay.goToRound(r.number)}
        renderRoundButton={({ round, active, onSelect }) => (
          <button type="button" className={active ? "active" : ""} onClick={onSelect}>
            R{round.number}
          </button>
        )}
      />

      <button type="button" onClick={replay.toggleTracers}>
        Tracers {replay.showTracers ? "on" : "off"}
      </button>
    </>
  );
}
```

### Hook API

| Area | Members |
|------|---------|
| Playback | `frameIndex`, `setFrameIndex`, `play`, `pause`, `togglePlay`, `currentTick`, `maxFrameIndex` |
| Rounds | `goToRound(n)`, `goToNextRound`, `goToPreviousRound`, `hasPreviousRound`, `hasNextRound`, `currentRound` |
| View | `showTracers`, `setShowTracers`, `toggleTracers`, `showPlayerNames`, `drawOptions`, `layerPreset` |

## Components

| Component | Purpose |
|-----------|---------|
| `DemoRadar` | Canvas replay — accepts `layerPreset`, `layers`, partial `demo` |
| `RoundSelector` | Round button list (optional `renderRoundButton`) |
| `PlaybackControls` | Optional play + scrubber group |
| `DemoEventList` | Optional event log |
| `DemoReplayPlayer` | Reference layout only |

`RoundNavButton` / `RoundButton` were removed — use native buttons + hook callbacks.

## Dev preview

```bash
cd cs2-demo-viewer
bun install
bun run dev
```

Load a parsed `replay.json` via the file picker in the dev app.

Styles in `dev/App.css` are preview-only.

## Publishing

Library builds to `dist/` via [tsup](https://tsup.egoist.dev):

```bash
bun run build
npm publish   # after npm login + setting repository field
```

Install in any React app:

```bash
npm install cs2-demo-viewer
```

```tsx
import { createDemoReplayPlayer, DemoRadar, useDemoReplay } from "cs2-demo-viewer";
```
