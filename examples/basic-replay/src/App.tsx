import type { CSSProperties } from "react";
import {
  DemoRadar,
  PlaybackControls,
  useDemoReplay,
  type DemoReplayData,
} from "cs2-demo-viewer";
import demoJson from "./demo.json";

const demo = demoJson as DemoReplayData;

export function App() {
  const replay = useDemoReplay(demo, {
    viewPreset: "minimal",
    layerPreset: "minimal",
  });

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Basic replay</h1>
      <p style={styles.hint}>
        Parsed JSON → <code>useDemoReplay</code> → <code>DemoRadar</code>
      </p>

      <div style={styles.radar}>
        <DemoRadar
          demo={demo}
          frameIndex={replay.frameIndex}
          drawOptions={replay.drawOptions}
          layerPreset={replay.layerPreset}
        />
      </div>

      <PlaybackControls
        playing={replay.playing}
        onTogglePlay={replay.togglePlay}
        frameIndex={replay.frameIndex}
        maxFrameIndex={replay.maxFrameIndex}
        onFrameIndexChange={replay.setFrameIndex}
        style={styles.controls}
      />

      <p style={styles.meta}>
        tick {replay.currentTick ?? "—"} · frame {replay.frameIndex} /{" "}
        {replay.maxFrameIndex}
      </p>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  main: {
    fontFamily: "system-ui, sans-serif",
    padding: 24,
    maxWidth: 720,
    margin: "0 auto",
  },
  title: { margin: "0 0 8px", fontSize: "1.25rem" },
  hint: { margin: "0 0 16px", color: "#555", fontSize: 14 },
  radar: { maxWidth: 640 },
  controls: { display: "flex", gap: 8, alignItems: "center", marginTop: 12 },
  meta: { margin: "8px 0 0", fontSize: 13, color: "#666" },
};
