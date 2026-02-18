# Causal Factory: Evolution

A real-time industrial logistics game built entirely on the **[causaloop](https://github.com/bitkojine/causaloop)** MVU (Model–View–Update) framework. Every bot movement, machine cycle, and economic transaction flows through causaloop's deterministic dispatcher — making this game both a playable demo and a brutal stress test for the engine.

---

## 🚀 Quick Start

```bash
git clone https://github.com/bitkojine/causal-factory.git causal-factory && git clone https://github.com/bitkojine/causaloop.git causaloop-repo && cd causaloop-repo && pnpm install && cd ../causal-factory && pnpm install && pnpm run dev
```

---

## 🎮 Gameplay

Build an automated industrial empire. Your goal is to scale production chains, grow a bot swarm, and maximize credit output.

### Supply Chains

| Machine | Input | Output | Cost |
|---|---|---|---|
| **Extractor** | — | `iron_ore` | $100 |
| **Smelter** | `iron_ore` | `iron_plate` | $500 |
| **Assembler** | `iron_plate` | `gear` | $1,200 |
| **Copper Extractor** | — | `copper_ore` | $100 |
| **Copper Smelter** | `copper_ore` | `copper_wire` | $500 |
| **Advanced Assembler** | `gear` + `copper_wire` | `compute_core` | $3,000 |
| **Industrial Sink** | `gear` | **Credits** | — |

### Bot Swarm
Thousands of autonomous bots handle all logistics. Each bot independently evaluates all machines every tick, prioritizing **the most urgent demand** (lowest inventory) and **the most clogged supply** (highest output buffer).

### Auto-Pilot Mode
Click **ENABLE AUTO-PILOT** and the game plays itself. The AI manages bot populations, maintains production ratios (Extractor → Smelter → Assembler → Sink), and expands infrastructure when profitable.

### Turbo Mode (x1000)
Click **TURBO MODE** to simulate 1,000 ticks per frame using batch processing. Combined with Auto-Pilot, watch an entire industrial empire emerge in seconds. Click **Hide UI** for a cinematic view.

---

## ⚙️ How Causaloop Powers Every System

This game is not just built *with* causaloop — it is built **on** causaloop. Every system below is a direct usage of a causaloop API.

### 1. The Dispatcher — Central Nervous System

```typescript
import { createDispatcher } from '@causaloop/core';

const dispatcher = createDispatcher({
    model: initialModel,
    update,
    subscriptions,
    effectRunner: (eff, dispatch) => runner.run(eff, dispatch),
    subscriptionRunner: { start, stop },
    onCommit: (snapshot) => renderer.render(snapshot, stats),
    devMode: true,
});
```

**What causaloop provides**: `createDispatcher` is the single entry point. It takes the initial game state, the update function, and wiring for effects/subscriptions. From that point forward, **all** state changes flow through `dispatcher.dispatch(msg)`. There are no side-channel mutations.

**What the game gains**: A single source of truth. Every button click (`buyMachine`), every bot movement (`tick`), every market crash (`market_crash`) — all are messages dispatched to the same queue. The dispatcher processes them sequentially, guaranteeing no race conditions even under 100,000+ entities.

---

### 2. The Update Function — Pure Game Logic

```typescript
import { UpdateFn, UpdateResult, UpdateContext } from '@causaloop/core';

export const update: UpdateFn<FactoryModel, FactoryMsg, FactoryEffect> = (
    model, msg, ctx
): UpdateResult<FactoryModel, FactoryEffect> => {
    switch (msg.kind) {
        case 'tick': return handleTick(model, msg.delta);
        case 'buy_machine': /* ... */
        case 'market_crash': /* ... */
    }
};
```

**What causaloop provides**: The `UpdateFn<M, G, E>` type signature enforces a pure function contract: `(model, msg, ctx) → { model, effects }`. No side effects. No mutation. Just data in, data out.

**What the game gains**: The entire game simulation — machine production, bot routing, inventory management, economic calculations — is a **single pure function**. This is what makes deterministic replay possible. It also means any bug in game logic can be reproduced by replaying the same message sequence.

---

### 3. UpdateContext — Managed Randomness & Time

```typescript
const newMachine: Machine = {
    id: `m-${ctx.now()}-${ctx.random()}`,  // Deterministic ID generation
    // ...
};

// Bot spawning with recorded random positions
bots.push({
    x: ctx.random() * 800,
    y: ctx.random() * 600,
});
```

**What causaloop provides**: `UpdateContext` gives the update function access to `random()` and `now()` — but unlike `Math.random()` and `Date.now()`, these are **captured by the dispatcher**. Every random number and timestamp is recorded in the message log's `Entropy` field.

**What the game gains**: Bot positions, machine IDs, and all non-deterministic decisions are reproducible. When the dispatcher replays the message log, it feeds back the exact same random numbers, producing an identical game state. This is the foundation of the **VERIFY DETERMINISM** feature.

---

### 4. Immutable State & Deep Freeze — Zero Mutation Bugs

**What causaloop provides**: In `devMode`, the dispatcher calls `Object.freeze()` recursively on the entire model after every update. Any accidental mutation throws an immediate runtime error.

**What the game gains**: With 100,000+ bot objects and hundreds of machines, accidental mutation is a constant risk (e.g., `bot.x = newX` instead of `{ ...bot, x: newX }`). Deep freeze catches these bugs instantly during development instead of letting them cause subtle state corruption.

---

### 5. Managed Subscriptions — The Game Loop

```typescript
import { Subscription } from '@causaloop/core';

export function subscriptions(_model: Snapshot<FactoryModel>): readonly Subscription<FactoryMsg>[] {
    return [{
        kind: 'animationFrame',
        key: 'game-loop',
        onFrame: () => ({ kind: 'tick', delta: 1 }),
    }];
}
```

**What causaloop provides**: The `subscriptions` function declaratively describes what external event sources should be active based on the current model state. The dispatcher handles starting/stopping subscriptions via `diffSubscriptions`.

**What the game gains**: The game loop itself is a managed subscription. It starts when the dispatcher initializes and stops cleanly on `shutdown()`. Because subscriptions are derived from model state, the game could conditionally pause the tick loop (e.g., when replaying or when no machines exist) simply by returning an empty array.

---

### 6. onCommit — Rendering & Performance Monitoring

```typescript
onCommit: (snapshot) => {
    const tickTime = now - lastTime;
    renderer.render(snapshot, { tickTime, fps });
    latestSnapshot = snapshot; // Feed to AutoPilot
},
```

**What causaloop provides**: `onCommit` fires once per batch of processed messages, providing the latest frozen `Snapshot<M>`. This is the only place the game reads state for rendering.

**What the game gains**: Clean separation between update logic and view rendering. The renderer never sees intermediate states — only committed snapshots. This also powers the Auto-Pilot, which reads `latestSnapshot` to make economic decisions.

---

### 7. Deterministic Replay — Time Travel

```typescript
import { replay } from '@causaloop/core';

const { log, snapshot: finalSnapshot } = dispatcher.getReplayableState();
const replayedSnapshot = replay({ initialModel, update, log });
const isMatch = JSON.stringify(finalSnapshot) === JSON.stringify(replayedSnapshot);
```

**What causaloop provides**: `replay()` takes the initial model, the update function, and a message log (including captured entropy), and replays every message from scratch. `getReplayableState()` returns the current log and snapshot.

**What the game gains**: Click **VERIFY DETERMINISM** after letting the game run with thousands of bots for a minute. The engine replays the entire history and compares the result. If even a single bot's X coordinate differs, the test fails. This proves that the entire game — randomness, timing, and all — is fully deterministic.

---

### 8. BrowserRunner — Platform Abstraction

```typescript
import { BrowserRunner } from '@causaloop/platform-browser';

const runner = new BrowserRunner();
// Used for effect execution and subscription management
```

**What causaloop provides**: `BrowserRunner` is the browser-specific implementation of effect execution (`requestAnimationFrame`, DOM events, etc.) and subscription lifecycle management.

**What the game gains**: The game's core logic (`update.ts`, `types.ts`) has zero browser dependencies. It could theoretically run in Node.js, a Web Worker, or a server. Only `main.ts` touches the browser-specific runner.

---

## 🧪 Stress Testing Objectives

| Test | What We Push | What We Validate |
|---|---|---|
| **State Throughput** | 100,000+ bots | Dispatcher handles immutable updates without GC jank |
| **Event Storm** | Market Crash resets all bots simultaneously | 10,000+ state transitions in a single tick |
| **Batch Processing** | x1000 speed multiplier | Machines produce correct output counts at extreme time deltas |
| **Entropy Consistency** | Full deterministic replay | Replayed state matches live state exactly |
| **Managed Subscriptions** | AnimationFrame game loop | Tick loop starts/stops cleanly with dispatcher lifecycle |
| **Deep Freeze** | 100,000+ mutable objects | Zero accidental mutations in devMode |

---

## 🏗️ Technical Architecture: The "Live-Link"

This game is hard-wired to the causaloop source code via a dual-link strategy:

**TypeScript Path Mapping** (`tsconfig.json`):
```json
"paths": {
    "@causaloop/core": ["../causaloop-repo/packages/core/src"],
    "@causaloop/platform-browser": ["../causaloop-repo/packages/platform-browser/src"]
}
```

**Vite Path Aliasing** (`vite.config.ts`):
```typescript
alias: {
    '@causaloop/core': path.resolve(__dirname, '../causaloop-repo/packages/core/src'),
    '@causaloop/platform-browser': path.resolve(__dirname, '../causaloop-repo/packages/platform-browser/src'),
}
```

Changes to the causaloop library source are reflected **instantly** via Vite HMR — no separate build step required.

---

## 🛠️ Run Instructions

1. **Position folders**: Ensure `causal-factory` and `causaloop-repo` are sister folders.
2. **Install**: `cd causal-factory && pnpm install`.
3. **Run**: `pnpm run dev`.
4. **Auto-Pilot**: Click "ENABLE AUTO-PILOT" + "TURBO MODE" and watch it build an empire.
5. **Verify**: Click "VERIFY DETERMINISM" after letting the game run.
