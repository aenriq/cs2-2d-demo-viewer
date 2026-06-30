# Economy hook — design & implementation plan

Branch: `economy`  
Status: **planning** (no hook shipped yet)

## Goal

Add `useEconomy` — a React hook that returns per-player economy for the **current round** while replay is playing or scrubbing.

Consumers should be able to build a round economy panel showing, for each player:

- Identity (name, team, steamId)
- Money (start / spent / remaining)
- Loadout after buy period (primary, secondary, armor, utilities)
- Individual purchases during freeze time (what they bought)

This package is **viewer-only**. Economy data must arrive in parsed demo JSON from an upstream parser. The hook reads that data; it does not parse `.dem` files.

---

## Current state

| Area | Status |
|------|--------|
| `PlayerFrame` | Has `weapon?` only — no money, armor, or grenade slots |
| `DemoEvent` | `kill`, `round_start`, `round_end`, `bomb_*` — no buy events |
| `ParsedDemo` | No economy fields |
| Round resolution | `getRoundForFrameIndex`, `getRoundAtTick` in `src/utils/rounds.ts` |
| Hook pattern | `useKillfeed` — replay sync via `currentTick` / `frameIndex`, pure logic in `src/utils/` |

**Gap:** nothing in the schema today describes buys or round money. Parser + types work comes first.

---

## UX reference (what “round economy” means in CS2)

Typical analyst / HLTV-style round economy view:

```
Round 14 — CT full buy vs T force

CT  s1mple   $2400 → spent $4850   AK-47, Kevlar+Helmet, Smoke, Flash
CT  b1t      $3200 → spent $4050   M4A1-S, Kevlar+Helmet, Kit, HE
…
T   jL       $1800 → spent $2100   Galil, Kevlar, Smoke
```

Useful derived labels (optional, computed in hook/utils):

| Label | Heuristic |
|-------|-----------|
| Full buy | Equipment value ≥ ~$4000 (tunable) |
| Half buy | ~$2000–$4000 |
| Eco | Equipment value &lt; ~$2000, little spent |
| Force | Low start money but high spend % |
| Pistol | Round 1 or 13 (side swap) — special case |

These heuristics belong in utils, not the JSON schema, so parsers stay simple.

---

## Proposed JSON schema (parser contract)

Add optional top-level array on `ParsedDemo`:

```ts
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
```

Extend `ParsedDemo`:

```ts
export interface ParsedDemo {
  // …existing fields…
  /** Optional — omit when parser does not emit economy. */
  economy?: DemoRoundEconomy[];
}
```

### Example JSON fragment

```json
{
  "rounds": [{ "number": 14, "startTick": 17920, "endTick": 22144 }],
  "economy": [
    {
      "roundNumber": 14,
      "freezeEndTick": 18112,
      "players": [
        {
          "steamId": "765611980…",
          "name": "s1mple",
          "team": "CT",
          "startMoney": 2400,
          "moneySpent": 4850,
          "equipmentValue": 6100,
          "purchases": [
            { "item": "ak47", "cost": 2700 },
            { "item": "kevlar_helmet", "cost": 1000 },
            { "item": "smokegrenade", "cost": 300 }
          ],
          "primary": "ak47",
          "secondary": "glock",
          "armor": "kevlar_helmet",
          "utilities": ["smoke", "flash"]
        }
      ]
    }
  ]
}
```

### Alternative: buy events (future)

Could extend `DemoEvent` with `type: "buy"` instead of (or in addition to) pre-aggregated `economy[]`:

```ts
type: "buy";
player?: string;
steamId?: string;
item?: string;
cost?: number;
```

**Recommendation:** ship `economy[]` first — one row per player per round is what UI needs. Buy events are useful for parsers building that array or for a later “purchase timeline” view.

### Parser responsibilities (out of scope for this package)

Upstream parser should:

1. Detect round boundaries (already emits `rounds[]`).
2. Track `player_buy` / `item_purchase` game events during freeze.
3. Snapshot money + loadout at freeze end per player.
4. Emit `economy[]` keyed by `roundNumber`.

Libraries that may help parsers (not dependencies here): [demoinfocs-golang](https://github.com/markus-wa/demoinfocs-golang), [awpy](https://github.com/pnxenopoulos/awpy).

---

## Hook API design

Mirror `useKillfeed` — thin React wrapper over pure utils.

### `useEconomy(demo, options)`

```ts
export interface UseEconomyOptions {
  /**
   * Replay tick — economy resolves to the round containing this tick.
   * Typically `useDemoReplay(demo).currentTick`.
   */
  currentTick?: number;
  /**
   * Alternative — `demo.frames[frameIndex].tick` drives round lookup.
   */
  frameIndex?: number;
  /**
   * Pin to a specific round instead of deriving from replay position.
   * When set, ignores tick/frame for round selection.
   */
  roundNumber?: number;
  /**
   * Sort order for `players` in the result.
   * @defaultValue `"team"` — CT first, then T; alphabetical within team.
   */
  sortBy?: "team" | "moneySpent" | "equipmentValue" | "name";
}

export interface UseEconomyResult {
  /** Round resolved from replay position or `roundNumber`. */
  round: DemoRound | undefined;
  /** Raw economy block for this round. `undefined` if no data. */
  roundEconomy: DemoRoundEconomy | undefined;
  /** Players for the round (sorted per `sortBy`). Empty when no data. */
  players: DemoPlayerEconomy[];
  /** Team totals derived from `players`. */
  teamTotals: {
    CT: { equipmentValue: number; moneySpent: number; playerCount: number };
    T: { equipmentValue: number; moneySpent: number; playerCount: number };
  };
  /** `true` when `demo.economy` has an entry for the current round. */
  hasEconomyData: boolean;
  /** `true` when `demo.economy` exists at all (any round). */
  hasEconomy: boolean;
  /** Optional buy-type label per player id — from utils heuristics. */
  buyTypes?: Record<string, "full" | "half" | "eco" | "force" | "pistol" | "unknown">;
}
```

### Usage sketch

```tsx
const replay = useDemoReplay(demo);
const economy = useEconomy(demo, { currentTick: replay.currentTick });

if (!economy.hasEconomy) return <p>No economy data in JSON</p>;

return (
  <ul>
    {economy.players.map((p) => (
      <li key={p.steamId}>
        {p.name} — ${p.startMoney} spent ${p.moneySpent}
        {p.purchases.map((b) => b.item).join(", ")}
      </li>
    ))}
  </ul>
);
```

### Replay sync behavior

| Replay action | Hook behavior |
|---------------|---------------|
| Play / scrub within round 14 | Same `roundEconomy` (static for the round) |
| Scrub into round 15 | Switches to round 15 economy |
| `roundNumber: 3` option | Pinned to round 3 regardless of replay |
| No `economy` in JSON | `hasEconomy: false`, empty `players` |
| Round exists but no economy row | `hasEconomyData: false` for that round |

Economy is **round-scoped**, not tick-animated (unlike killfeed). Tick/frame input only picks **which round**.

---

## Pure utils layer (`src/utils/economy.ts`)

Keep testable logic out of the hook (same split as `killfeed.ts` / `useKillfeed.ts`).

| Function | Purpose |
|----------|---------|
| `getRoundEconomy(demo, roundNumber)` | Lookup `economy[]` by round |
| `getEconomyForTick(demo, tick)` | Resolve round from tick → economy |
| `getEconomyForFrameIndex(demo, frameIndex)` | Frame → tick → economy |
| `sortEconomyPlayers(players, sortBy)` | Sort helper |
| `computeTeamTotals(players)` | CT/T aggregates |
| `classifyBuyType(player)` | Optional eco/full/force heuristic |
| `hasEconomyData(demo)` | Boolean guard |

---

## File checklist (implementation order)

### Phase 1 — Types & utils (no React)

1. Add `DemoPurchase`, `DemoPlayerEconomy`, `DemoRoundEconomy` to `src/types.ts`
2. Add `economy?: DemoRoundEconomy[]` to `ParsedDemo`
3. `normalizeDemoReplay` — default `economy: input.economy ?? []`
4. Create `src/utils/economy.ts` with lookup + sort + totals
5. Unit-test utils with fixture JSON (small `economy` snippet)

### Phase 2 — Hook

6. Create `src/hooks/useEconomy.ts` with JSDoc (match `useKillfeed` depth)
7. Export from `src/index.ts`

### Phase 3 — UI (later, not this branch goal)

8. `DemoEconomyPanel` — unstyled list/table component
9. `DemoReplayPlayer` — optional `showEconomy` prop
10. `examples/economy-replay/` — example app with fixture JSON

### Phase 4 — Parser integration (external)

11. Document schema in README
12. Sample `economy` block in `examples/` fixture

---

## Open questions

1. **Freeze-end vs live money** — Should the hook expose money that updates mid-round from `frames`? That needs `money` on `PlayerFrame` and different semantics. **Proposal:** v1 = freeze-end snapshot only; v2 = optional `live: true` reading latest frame.
2. **Dead players** — Show economy for players who died early? **Proposal:** yes, round economy is about buy decisions, not alive state.
3. **Round number type** — Match `DemoRound.number` (1-based). Economy rows must use same indexing as `rounds[]`.
4. **SPEC / coaches** — Omit from `players` in parser, or include with `team: "SPEC"` filtered in hook? **Proposal:** parser omits; hook filters `SPEC` if present.
5. **Side swap** — Round 13 pistol round: parser should still emit economy; `classifyBuyType` handles `pistol` label.

---

## Success criteria

- [ ] `useEconomy(demo, { currentTick })` returns correct round when scrubbing
- [ ] Graceful empty state when `economy` omitted from JSON
- [ ] `hasEconomyData` false for rounds missing from `economy[]` but present in `rounds[]`
- [ ] Full JSDoc on hook + types for IntelliSense
- [ ] No canvas / layer changes required for v1

---

## Related code

| File | Relevance |
|------|-----------|
| `src/hooks/useKillfeed.ts` | Hook + replay sync pattern |
| `src/utils/killfeed.ts` | Pure utils pattern |
| `src/utils/rounds.ts` | Round lookup from tick/frame |
| `src/hooks/useDemoReplay.ts` | `currentRound`, `currentTick` source |
| `src/types.ts` | Schema extensions |
| `src/replay/normalize-demo.ts` | Default empty `economy[]` |
