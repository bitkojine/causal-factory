## 🚀 Quick Start (One-Command Setup)

To clone and set up both the game and the required `causaloop` library in one go, run:

```bash
git clone https://github.com/bitkojine/causal-factory.git causal-factory && git clone https://github.com/bitkojine/causaloop.git causaloop-repo && cd causaloop-repo && pnpm install && cd ../causal-factory && pnpm install && pnpm run dev
```

---

## 🏗️ Technical Architecture: The "Live-Link"

Unlike typical projects that install dependencies via `npm`, this game is hard-wired to the `causaloop` source code for real-time development and brutal transparency.

### How it finds the source
The project uses a **dual-link** strategy to locate the `causaloop` core packages:

1.  **TypeScript Path Mapping (`tsconfig.json`)**:
    ```json
    "paths": {
      "@causaloop/core": ["../causaloop-repo/packages/core/src"],
      "@causaloop/platform-browser": ["../causaloop-repo/packages/platform-browser/src"]
    }
    ```
    This tells the TypeScript compiler effectively: "Don't look in `node_modules`; go up one directory and find the raw `.ts` files."

2.  **Vite Path Aliasing (`vite.config.ts`)**:
    ```typescript
    alias: {
      '@causaloop/core': path.resolve(__dirname, '../causaloop-repo/packages/core/src'),
      // ...
    }
    ```
    This ensures the development server serves the library's source directly to the browser.

### Why it works
- **No-Build Workflow**: Because the links point to the library's `/src` directory (not `dist`), the game's development server (Vite) treats the library as part of its own source tree.
- **Instant HMR**: Changes made to any file in `../causaloop-repo/packages/core/src` trigger an immediate Hot Module Replacement or full page reload in the game. You do **not** need to run a separate build step for the library.

### Verified Instant Feedback Loop
I have verified this architecture by:
1.  Launching the game at `localhost:3000`.
2.  Modifying the library's core `dispatcher.ts` (e.g., adding a `console.log` inside the `dispatch` function).
3.  Observing the running game's console.
4.  **Result**: The game reflected the library's internal code change **instantly** without a restart, proving a perfect local development cycle for engine building.

---

## 🎮 Gameplay Features

The game is a full industrial logistics chain. Your goal is to automate gear production to earn credits.

### Core Systems
- **Supply Chains**: 
    - `Extractor`: Pulls `iron_ore` from the ground.
    - `Smelter`: Consumes `iron_ore` to produce `iron_plate`.
    - `Assembler`: Consumes `iron_plate` to produce `gear`.
    - `Industrial Sink`: Consumes `gear` to generate **Credits**.
- **The Bot Swarm**: Thousands of autonomous bots handle all logistics. They dynamically re-evaluate the world state every tick to find the most urgent supply or demand.
- **The Economy**: Credits earned from the Sink are used to purchase new infrastructure.

### How to Play
1.  **Initial Setup**: The game starts with a starter line (one of each machine).
2.  **Scale**: Use the **Industrial Fabrication Shop** at the bottom to:
    - Add more Extractors/Smelters/Assemblers.
    - Spawn thousands of additional bots.
3.  **Optimize**: Watch the machines. If an Assembler is "Idle" (grey progress bar), you need more Smelters and more Bots.

---

## 🧪 Causaloop Stress Testing Objectives

This game is more than a demo; it is a **brutal validation suite** for `causaloop`. We test:

1.  **State Throughput (100k+ Entities)**:
    - We push the bot count to **100,000+**. 
    - *The Test*: Does the dispatcher's `onCommit` and immutable update cycle hold up without causing memory fragmentation or GC jank?

2.  **Event Storm Handling (Market Crash)**:
    - Clicking **TRIGGER EVENT STORM** (Market Crash) sends a message that resets every single bot's state to `idle` simultaneously.
    - *The Test*: Can the system handle a localized burst of 10,000+ state transitions and re-routing calculations in a **single tick**?

3.  **Entropy Consistency (Deterministic Replay)**:
    - Every movement and decision in the game is powered by `UpdateContext.random()`.
    - *The Test*: Click **VERIFY DETERMINISM**. We take the entire history of thousands of messages (including captured random seeds) and replay them from scratch. If the final replayed state differs by even a single bot's X coordinate, the test fails.

4.  **Managed Subscriptions**:
    - The simulation tick is a managed `AnimationFrame` subscription.
    - *The Test*: We verify that the tick loop is perfectly locked to the dispatcher state and ceases entirely when the application is idle or replaying.

---

## 🛠️ Run Instructions

1.  **Position folders**: Ensure `causal-factory` and `causaloop-repo` are sister folders.
2.  **Install**: `cd causal-factory && pnpm install`.
3.  **Run**: `pnpm run dev`.
4.  **Verify**: Click "VERIFY DETERMINISM" in the UI after letting the game run for a minute.
