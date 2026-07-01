import {
  createDemoReplayPlayer,
  DemoEventList,
  DemoKillfeed,
  formatKillfeedEntry,
  PlaybackControls,
  RoundSelector,
  useEconomy,
  useKillfeed,
  type DemoReplayData,
  type ReplayViewPreset,
} from "cs2-demo-viewer";
import { useState } from "react";
import demoJson from "./demo.json";

const demo = demoJson as DemoReplayData;

/** All capabilities on — matches a fully parsed demo JSON. */
const replayPlayer = createDemoReplayPlayer({
  viewPreset: "full",
});

export function App() {
  return (
    <replayPlayer.Provider>
      <ReplayLayout />
    </replayPlayer.Provider>
  );
}

function ReplayLayout() {
  const [viewPreset, setViewPreset] = useState<ReplayViewPreset>("full");
  const replay = replayPlayer.useDemo(demo, { viewPreset });
  const killfeed = useKillfeed(demo, { currentTick: replay.currentTick });
  const economy = useEconomy(demo, {
    currentTick: replay.currentTick,
    includeBuyTypes: true,
  });

  return (
    <div className="layout">
        <header className="header">
          <h1>Full replay</h1>
          <p className="subtitle">
            Every hook, layer, and panel — <code>createDemoReplayPlayer</code> + composed UI
          </p>
        </header>

        <div className="toolbar">
          <label>
            Preset
            <select
              value={viewPreset}
              onChange={(e) => setViewPreset(e.target.value as ReplayViewPreset)}
            >
              <option value="minimal">minimal</option>
              <option value="standard">standard</option>
              <option value="full">full</option>
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

        <div className="main">
          <section className="radar-section">
            <replayPlayer.Radar
              demo={demo}
              frameIndex={replay.frameIndex}
              drawOptions={replay.drawOptions}
              className="radar-wrap"
              canvasClassName="radar-canvas"
            />

            <PlaybackControls
              className="playback"
              playing={replay.playing}
              onTogglePlay={replay.togglePlay}
              frameIndex={replay.frameIndex}
              maxFrameIndex={replay.maxFrameIndex}
              onFrameIndexChange={replay.setFrameIndex}
            />

            <div className="round-nav">
              <button
                type="button"
                disabled={!replay.hasPreviousRound}
                onClick={replay.goToPreviousRound}
              >
                ← Prev round
              </button>

              <RoundSelector
                className="rounds"
                demo={demo}
                currentRoundNumber={replay.currentRound?.number}
                onRoundSelect={(round) => replay.goToRound(round.number)}
                renderRoundButton={({ round, active, onSelect }) => (
                  <button
                    type="button"
                    className={`round-btn${active ? " is-active" : ""}`}
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
                Next round →
              </button>
            </div>

            <p className="meta">
              tick {replay.currentTick ?? "—"} · round {replay.currentRound?.number ?? "—"} ·
              frame {replay.frameIndex}/{replay.maxFrameIndex}
            </p>
          </section>

          <aside className="sidebar">
            <section className="panel">
              <h2>Killfeed</h2>
              <DemoKillfeed
                className="killfeed"
                entries={killfeed.entries}
                renderEntry={(entry) => (
                  <span className={`killfeed-row killfeed-row--${entry.event.attacker ?? "?"}`}>
                    {formatKillfeedEntry(entry)}
                  </span>
                )}
              />
            </section>

            <section className="panel">
              <h2>
                Economy
                {economy.round ? ` — round ${economy.round.number}` : ""}
              </h2>
              {!economy.hasEconomy ? (
                <p className="empty">No economy data in JSON.</p>
              ) : !economy.hasEconomyData ? (
                <p className="empty">No economy row for this round.</p>
              ) : (
                <>
                  <div className="team-totals">
                    <span className="team-totals__ct">
                      CT ${economy.teamTotals.CT.equipmentValue.toLocaleString()} eq · $
                      {economy.teamTotals.CT.moneySpent.toLocaleString()} spent
                    </span>
                    <span className="team-totals__t">
                      T ${economy.teamTotals.T.equipmentValue.toLocaleString()} eq · $
                      {economy.teamTotals.T.moneySpent.toLocaleString()} spent
                    </span>
                  </div>
                  <ul className="economy-list">
                    {economy.players.map((player) => (
                      <li key={player.steamId} className={`economy-row economy-row--${player.team}`}>
                        <div className="economy-row__head">
                          <strong>{player.name}</strong>
                          {economy.buyTypes?.[player.steamId] && (
                            <span className="buy-type">{economy.buyTypes[player.steamId]}</span>
                          )}
                        </div>
                        <div className="economy-row__money">
                          ${player.startMoney} → spent ${player.moneySpent} · eq $
                          {player.equipmentValue}
                        </div>
                        <div className="economy-row__loadout">
                          {[player.primary, player.armor, ...(player.utilities ?? [])]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                        {player.purchases.length > 0 && (
                          <div className="economy-row__buys">
                            {player.purchases.map((buy) => buy.item).join(", ")}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section className="panel panel--grow">
              <h2>Events</h2>
              <DemoEventList
                className="events"
                events={demo.events ?? []}
                currentTick={replay.currentTick}
                renderItem={(event, active) => (
                  <span className={active ? "event event--active" : "event"}>
                    [{event.tick}] {event.type}
                    {event.attacker && event.victim
                      ? ` — ${event.attacker} → ${event.victim}`
                      : ""}
                    {event.winner ? ` (${event.winner})` : ""}
                  </span>
                )}
              />
            </section>
          </aside>
        </div>

        <footer className="footer">
          Fixture includes: frames, rounds, events, shots, utilities, grenadePaths, economy
        </footer>
      </div>
  );
}
