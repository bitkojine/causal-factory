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

## 📼 Determinism Verification

The demo includes a "Verify Determinism (Replay)" button. This button:
1.  Captures the current message log and final model snapshot.
2.  Creates a clean, isolated dispatcher instance.
3.  Replays the entire log.
4.  Compares the final snapshots (deep JSON comparison).
5.  Alerts "PASSED" only if the states are identical.
