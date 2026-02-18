<p align="center">
  <h1 align="center">⚙️ Causal Factory: Evolution</h1>
  <p align="center">
    A real-time industrial logistics game powered by <a href="https://github.com/bitkojine/causaloop"><strong>causaloop</strong></a>
    <br />
    <em>100,000+ entities · deterministic replay · zero mutation bugs</em>
  </p>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-gameplay">Gameplay</a> ·
  <a href="#-causaloop-integration-map">Integration Map</a> ·
  <a href="#-stress-tests">Stress Tests</a> ·
  <a href="#-architecture">Architecture</a>
</p>

---

## 🚀 Quick Start

```bash
git clone https://github.com/bitkojine/causal-factory.git causal-factory \
  && git clone https://github.com/bitkojine/causaloop.git causaloop-repo \
  && cd causaloop-repo && pnpm install \
  && cd ../causal-factory && pnpm install && pnpm run dev
```

Open **http://localhost:3000** → Click **ENABLE AUTO-PILOT** → Click **TURBO MODE (x1000)** → Watch.

---

## 🎮 Gameplay

Build an automated industrial empire. Scale production chains, grow a bot swarm, maximize credit output.

### Production Lines

```
Iron Chain:     Extractor → Smelter → Assembler → Sink → 💰 Credits
Copper Chain:   Copper Extractor → Copper Smelter ─┐
Advanced:       Assembler (gear) + Copper Smelter ──┴→ Advanced Assembler → compute_core
```

| Machine | Input | Output | Cost |
|---|---|---|---|
| Extractor | — | `iron_ore` | $100 |
| Smelter | `iron_ore` | `iron_plate` | $500 |
| Assembler | `iron_plate` | `gear` | $1,200 |
| Copper Extractor | — | `copper_ore` | $100 |
| Copper Smelter | `copper_ore` | `copper_wire` | $500 |
| Advanced Assembler | `gear` + `copper_wire` | `compute_core` | $3,000 |
| Industrial Sink | `gear` | **Credits** | free |

### Bot Swarm

Autonomous bots handle all logistics. Each bot evaluates every machine each tick, prioritizing:
- **Highest-urgency demand** — machines with the emptiest input buffers
- **Most-clogged supply** — machines with the fullest output buffers

### Controls

| Button | Effect |
|---|---|
| **ENABLE AUTO-PILOT** | AI manages bots, builds machines, expands infrastructure |
| **TURBO MODE (x1000)** | Batch-processes 1,000 ticks per frame |
| **Hide UI** | Cinematic view — watch the swarm work |
| **TRIGGER EVENT STORM** | Market crash — resets every bot to idle simultaneously |
| **BURN-IN STRESS TEST** | Continuously spawns 200 bots every 50ms |
| **VERIFY DETERMINISM** | Replays entire message history and compares final state |

---

## 🔗 Causaloop Integration Map

Every system in this game maps directly to a causaloop API. No wrappers, no abstractions — raw engine usage.

### Dispatcher — Single Source of Truth

All state mutations flow through one dispatcher. Button clicks, bot movements, market crashes — everything is a message in a sequential queue.

```typescript
const dispatcher = createDispatcher({
    model: initialModel,       // Immutable game state
    update,                    // Pure function: (model, msg, ctx) → { model, effects }
    subscriptions,             // Declarative event sources
    onCommit: (snapshot) => {  // Fires after each batch — drives rendering
        renderer.render(snapshot, stats);
        latestSnapshot = snapshot;  // Feeds Auto-Pilot decisions
    },
    devMode: true,             // Enables deep freeze on all state
});
```

> **File:** [`main.ts`](src/main.ts)

### Pure Update Function — The Entire Simulation

Machine production, bot routing, inventory management, economic calculations — all in one pure function. No side effects. No mutation. Data in, data out.

```typescript
export const update: UpdateFn<FactoryModel, FactoryMsg, FactoryEffect> = (model, msg, ctx) => {
    switch (msg.kind) {
        case 'tick':         return handleTick(model, msg.delta);
        case 'buy_machine':  /* deduct credits, create machine with ctx.random() ID */
        case 'set_speed':    /* adjust simulation speed multiplier */
        case 'market_crash': /* reset all bots to idle */
        case 'spawn_bots':   /* create bots at ctx.random() positions */
    }
};
```

> **File:** [`update.ts`](src/core/update.ts)

### UpdateContext — Captured Randomness & Time

`ctx.random()` and `ctx.now()` look like `Math.random()` and `Date.now()`, but every value is recorded in the message log. This is what makes replay possible.

```typescript
// Every bot position and machine ID is reproducible
const bot = { x: ctx.random() * 800, y: ctx.random() * 600 };
const machine = { id: `m-${ctx.now()}-${ctx.random()}` };
```

> **File:** [`update.ts`](src/core/update.ts) — `spawnBots()`, `buy_machine` handler

### Managed Subscriptions — Declarative Game Loop

The `animationFrame` subscription drives the tick loop. It starts when the dispatcher initializes, stops on `shutdown()`, and could conditionally pause based on model state.

```typescript
export function subscriptions(_model: Snapshot<FactoryModel>): readonly Subscription<FactoryMsg>[] {
    return [{ kind: 'animationFrame', key: 'game-loop', onFrame: () => ({ kind: 'tick', delta: 1 }) }];
}
```

> **File:** [`subscriptions.ts`](src/core/subscriptions.ts)

### Deterministic Replay — Time Travel

Replays every message from the initial state using captured entropy. If even one bot coordinate drifts, the test fails.

```typescript
const { log, snapshot } = dispatcher.getReplayableState();
const replayed = replay({ initialModel, update, log });
alert(JSON.stringify(snapshot) === JSON.stringify(replayed) ? 'PASSED ✅' : 'FAILED ❌');
```

> **File:** [`main.ts`](src/main.ts) — `triggerReplay()`

### Deep Freeze — Zero Mutation Bugs

With `devMode: true`, the dispatcher recursively freezes the entire model after every update. Accidental `bot.x = newX` (instead of `{ ...bot, x: newX }`) throws immediately. Essential when managing 100,000+ mutable objects.

### BrowserRunner — Platform Abstraction

Core game logic (`update.ts`, `types.ts`, `autopilot.ts`) has zero browser dependencies. Only `main.ts` touches the browser-specific `BrowserRunner` for `requestAnimationFrame` and DOM events.

---

## 🧪 Stress Tests

| Test | Pressure | Validates |
|---|---|---|
| **State Throughput** | 100k+ bots | Immutable updates without GC jank |
| **Event Storm** | Market crash resets all bots | 10k+ transitions in one tick |
| **Batch Processing** | x1000 speed | Correct output at extreme time deltas |
| **Entropy Replay** | Full history replay | Bit-perfect determinism |
| **Deep Freeze** | 100k+ objects in devMode | Zero accidental mutations |
| **Managed Subs** | AnimationFrame lifecycle | Clean start/stop with dispatcher |

---

## 🏗️ Architecture

### Live-Link to causaloop Source

This game links directly to causaloop's raw `.ts` source — no `node_modules`, no build step. Changes to the library trigger instant Vite HMR.

```
causal-factory/          ← this repo
causaloop-repo/          ← sister folder (cloned separately)
├── packages/core/src/   ← linked via tsconfig paths + vite aliases
└── packages/platform-browser/src/
```

**tsconfig.json:**
```json
{ "paths": {
    "@causaloop/core": ["../causaloop-repo/packages/core/src"],
    "@causaloop/platform-browser": ["../causaloop-repo/packages/platform-browser/src"]
}}
```

**vite.config.ts:**
```typescript
alias: {
    '@causaloop/core': path.resolve(__dirname, '../causaloop-repo/packages/core/src'),
    '@causaloop/platform-browser': path.resolve(__dirname, '../causaloop-repo/packages/platform-browser/src'),
}
```

### Project Structure

```
src/
├── main.ts              # Dispatcher setup, UI bindings, Auto-Pilot wiring
├── core/
│   ├── types.ts         # FactoryModel, FactoryMsg, Machine, Bot, Resource
│   ├── update.ts        # Pure update function (all game logic)
│   ├── subscriptions.ts # AnimationFrame game loop
│   └── autopilot.ts     # AI player (bot management, construction heuristics)
└── ui/
    └── renderer.ts      # Canvas rendering
```

### Tech Stack

| Layer | Technology |
|---|---|
| State Management | [causaloop](https://github.com/bitkojine/causaloop) (MVU + deterministic dispatch) |
| Rendering | Canvas 2D |
| Build | Vite |
| Language | TypeScript (strict) |
| Package Manager | pnpm |

---

## 🛠️ Development

```bash
# Prerequisites: Node.js 18+, pnpm

# 1. Clone both repos as sister folders
git clone https://github.com/bitkojine/causal-factory.git
git clone https://github.com/bitkojine/causaloop.git causaloop-repo

# 2. Install
cd causaloop-repo && pnpm install && cd ../causal-factory && pnpm install

# 3. Run
pnpm run dev       # Opens at localhost:3000
```

### Verification Checklist

1. Let the game run for ~30 seconds
2. Click **VERIFY DETERMINISM** → should show `PASSED ✅`
3. Enable **Auto-Pilot** + **Turbo Mode** → credits should skyrocket
4. Click **TRIGGER EVENT STORM** → all bots reset, then recover

---

## 📄 License

MIT
