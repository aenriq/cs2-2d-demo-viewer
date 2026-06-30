# Basic replay

The smallest end-to-end integration of **cs2-demo-viewer**.

Shows how to take **parsed demo JSON** (not a `.dem` file), draw the 2D radar, and wire playback controls. No player factory, no killfeed, no round navigation — just the core loop.

## What you need before using this package

1. **Parsed replay JSON** — this library is viewer-only. Something upstream (your parser, API, CLI) must turn a CS2 demo into JSON.
2. **React 18+** — hooks and components are React-only.
3. **A radar image URL** — set `demo.mapMeta.radarUrl` so `DemoRadar` can load the map background.

Minimum JSON shape:

```json
{
  "map": "de_dust2",
  "frames": [
    {
      "tick": 0,
      "players": [
        {
          "steamId": "1",
          "name": "Player",
          "team": "CT",
          "x": 0, "y": 0, "z": 0,
          "radar": { "x": 0.5, "y": 0.5 },
          "health": 100,
          "alive": true,
          "yaw": 90
        }
      ]
    }
  ],
  "mapMeta": { "radarUrl": "https://…/dust2.png" }
}
```

`radar.x` / `radar.y` are **0–1** normalized positions on the radar image.

See [`src/demo.json`](./src/demo.json) for the fixture used here — four frames, two players moving on de_dust2.

## How this example is wired

```
demo.json ──► useDemoReplay(demo) ──► frameIndex, playing, drawOptions
                      │                        │
                      ▼                        ▼
                 PlaybackControls          DemoRadar
                 (play + scrubber)        (canvas)
```

### `src/App.tsx`

1. **`useDemoReplay(demo)`** — owns playback state: current frame, play/pause, scrubbing. Also exposes `drawOptions` and `layerPreset` for the canvas.
2. **`DemoRadar`** — draws one frame. Pass `frameIndex` from the hook so the canvas updates when playback advances or the user scrubs.
3. **`PlaybackControls`** — optional bundled control bar (play button + range input). You can replace this with your own buttons; the hook is the source of truth.

We use `viewPreset: "minimal"` and `layerPreset: "minimal"` so only the map + player dots render. No tracers, utilities, or grenade paths — keeps the first integration simple.

### `src/demo.json`

Static fixture imported at build time. In a real app you would fetch this from an API or read it from your parser pipeline.

### `vite.config.ts`

Aliases `cs2-demo-viewer` to the repo's `src/` so the example works while developing the library locally. Published apps install the package normally:

```bash
npm install cs2-demo-viewer
```

## Run it

From the **repository root**:

```bash
npm run build
cd examples/basic-replay
npm install
npm run dev
```

Load a parsed JSON file is **not** required — the bundled `demo.json` is used automatically.

## Try next

- Add round jumps: `replay.goToRound(n)`, `replay.hasNextRound`
- Add killfeed: `useKillfeed` + `DemoKillfeed`
- Lock features at init: `createDemoReplayPlayer({ capabilities: { … } })`
- See the main [README](../../README.md) for the full API
