import { useState, type ChangeEvent } from "react";
import {
  createDemoReplayPlayer,
  DemoEventList,
  DemoReplayPlayer,
  PlaybackControls,
  RoundSelector,
  type ReplayViewPreset,
} from "../src/index.ts";
import type { DemoReplayData } from "../src/types.ts";
import "./App.css";

/** Init once — capabilities lock what renders even when JSON has more data. */
const replayPlayer = createDemoReplayPlayer({
  viewPreset: "full",
  capabilities: {
    flashOverlay: false,
    grenadePaths: false,
  },
});

export function App() {
  const [demo, setDemo] = useState<DemoReplayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"composed" | "manual">("manual");

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setDemo(JSON.parse(text) as DemoReplayData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse JSON");
      setDemo(null);
    }
  }

  return (
    <replayPlayer.Provider>
      <div className="app">
        <header className="app__header">
          <h1>CS2 2D Replay</h1>
          <div className="app__header-actions">
            <label className="app__mode">
              <input
                type="radio"
                name="mode"
                checked={mode === "composed"}
                onChange={() => setMode("composed")}
              />
              DemoReplayPlayer
            </label>
            <label className="app__mode">
              <input
                type="radio"
                name="mode"
                checked={mode === "manual"}
                onChange={() => setMode("manual")}
              />
              createDemoReplayPlayer
            </label>
            <label className="app__file-btn">
              Load JSON
              <input type="file" accept="application/json" hidden onChange={onFileChange} />
            </label>
          </div>
        </header>

        {error && <p className="app__error">{error}</p>}

        {!demo ? (
        <p className="app__hint">
          Load a parsed replay JSON file to preview the viewer.
        </p>
        ) : mode === "composed" ? (
          <DemoReplayPlayer demo={demo} className="app__player" showEventLog />
        ) : (
          <ManualCompose demo={demo} />
        )}
      </div>
    </replayPlayer.Provider>
  );
}

function ManualCompose({ demo }: { demo: DemoReplayData }) {
  const [viewPreset, setViewPreset] = useState<ReplayViewPreset>("full");
  const replay = replayPlayer.useDemo(demo, { viewPreset });

  return (
    <div className="app__player">
      <div className="app__toolbar">
        <label>
          Preset
          <select
            value={viewPreset}
            onChange={(e) => setViewPreset(e.target.value as ReplayViewPreset)}
          >
            <option value="minimal">Minimal</option>
            <option value="standard">Standard</option>
            <option value="full">Full</option>
          </select>
        </label>
        {replay.canToggleTracers && (
          <label>
            <input
              type="checkbox"
              checked={replay.showTracers}
              onChange={(e) => replay.setShowTracers(e.target.checked)}
            />
            Tracers
          </label>
        )}
        {replay.canTogglePlayerNames && (
          <label>
            <input
              type="checkbox"
              checked={replay.showPlayerNames}
              onChange={(e) => replay.setShowPlayerNames(e.target.checked)}
            />
            Names
          </label>
        )}
        {replay.canToggleUtilities && (
          <label>
            <input
              type="checkbox"
              checked={replay.showUtilities}
              onChange={(e) => replay.setShowUtilities(e.target.checked)}
            />
            Utilities
          </label>
        )}
        {replay.canToggleGrenadePaths && (
          <label>
            <input
              type="checkbox"
              checked={replay.showGrenadePaths}
              onChange={(e) => replay.setShowGrenadePaths(e.target.checked)}
            />
            Grenade paths
          </label>
        )}
        {replay.canToggleFlashOverlay && (
          <label>
            <input
              type="checkbox"
              checked={replay.showFlashOverlay}
              onChange={(e) => replay.setShowFlashOverlay(e.target.checked)}
            />
            Flash overlay
          </label>
        )}
      </div>

      <replayPlayer.Radar
        demo={demo}
        frameIndex={replay.frameIndex}
        drawOptions={replay.drawOptions}
        className="app__radar-wrap"
        canvasClassName="app__radar-canvas"
      />

      <PlaybackControls
        className="app__playback"
        playing={replay.playing}
        onTogglePlay={replay.togglePlay}
        frameIndex={replay.frameIndex}
        maxFrameIndex={replay.maxFrameIndex}
        onFrameIndexChange={replay.setFrameIndex}
      />

      <div className="app__round-nav">
        <button
          type="button"
          disabled={!replay.hasPreviousRound}
          onClick={replay.goToPreviousRound}
        >
          Previous round
        </button>

        <RoundSelector
          className="app__rounds"
          demo={demo}
          currentRoundNumber={replay.currentRound?.number}
          onRoundSelect={(round) => replay.goToRound(round.number)}
          renderRoundButton={({ round, active, onSelect }) => (
            <button
              type="button"
              className={`app__round-btn${active ? " is-active" : ""}`}
              onClick={onSelect}
            >
              R{round.number}
            </button>
          )}
        />

        <button
          type="button"
          disabled={!replay.hasNextRound}
          onClick={replay.goToNextRound}
        >
          Next round
        </button>
      </div>

      <p className="app__meta">
        tick {replay.currentTick ?? "—"} · round {replay.currentRound?.number ?? "—"}
      </p>

      <DemoEventList
        className="app__events"
        events={demo.events}
        currentTick={replay.currentTick}
      />
    </div>
  );
}
