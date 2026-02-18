# Causal Factory: Deterministic Swarm

A production-quality demo showcasing the power of `causaloop`.

## 🚀 Overview

Causal Factory is a deterministic simulation of a resource-gathering bot swarm. It serves as a stress test for the `causaloop` architecture, pushing its limits with high entity counts and dense event throughput.

### Key Features
- **Deterministic Simulation**: Every bot movement and resource extraction is perfectly reproducible.
- **Extreme Stress Mode**: Scale from 1k to 10k+ bots to test the dispatcher's throughput.
- **Real-time Metrics**: Live tracking of FPS, Tick Time, and event counts.
- **Instant Replay**: Verify determinism by replaying the entire session from the message log.

## 🛠️ Setup & Run

### Prerequisites
- [Node.js](https://nodejs.org/) >= 20.0.0
- [pnpm](https://pnpm.io/) >= 10.0.0

### Installation
1.  Clone the repository and its submodules.
2.  Install dependencies:
    ```bash
    pnpm install
    ```

### Development
Launch the demo in your browser:
```bash
pnpm run dev
```

### Benchmarking
1.  Open the demo in Chrome.
2.  Open DevTools -> Performance tab to profile GC and CPU.
3.  Use the "Toggle Extreme Stress" button to push the simulation beyond 10k entities.

## 🏗️ How it uses Causaloop

This game does not merely "use" `causaloop`; it is **architected around it**. Every major gameplay system is managed by the library's core dispatcher.

### 1. The Single Source of Truth (`Model`)
The entire world state—including the position, target, and state of over 10,000 bots—lives inside a single, immutable `FactoryModel`. It is JSON-serializable, allowing for perfect snapshots at any point in time.

### 2. Pure Update Logic (`Update`)
The `update` function in `src/core/update.ts` is the heart of the simulation. It is a strictly pure function that takes the current state and a message (like `tick` or `spawn_bots`) and returns the next state. It contains **zero side effects**.

### 3. Managed Time & Entropy (`UpdateContext`)
Determinism is achieved by using the `UpdateContext` provided by `causaloop`. 
- **Time**: Instead of using `Date.now()`, the simulation uses `ctx.now()`, which is recorded in the message log.
- **Randomness**: All bot spawning and target selection uses `ctx.random()`. During replay, `causaloop` feeds the recorded random numbers back into the system, ensuring identical outcomes.

### 4. Declarative Loops (`Subscriptions`)
The simulation tick is not a `setInterval` or a rogue loop. It is a **managed subscription**. The `subscriptions` function declares that the game wants an `AnimationFrame` tick whenever it's running. `causaloop` handles starting and stopping this loop automatically.

### 5. Platform Purity (`BrowserRunner`)
All browser-specific APIs (Canvas, requestAnimationFrame) are isolated in the `ui` and `BrowserRunner` layers. The core game logic remains platform-agnostic, interacting only via data-driven Effects and Messages.

---

## 📼 Determinism Verification

The demo includes a "Verify Determinism (Replay)" button. This button:
1.  Captures the current message log and final model snapshot.
2.  Creates a clean, isolated dispatcher instance.
3.  Replays the entire log.
4.  Compares the final snapshots (deep JSON comparison).
5.  Alerts "PASSED" only if the states are identical.
