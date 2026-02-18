# Causal Factory: Evolution - Logic and Insights

## Auto-Pilot Heuristics

### Logistics Scaling
- If less than 10% of bots are idle, we are bottlenecked on logistics and should buy more bots.
- Bots are currently capped at 2000 for safety unless stress testing.
- Bots are spawned in batches of 10% of total count or 10, whichever is larger.

### Construction Strategy
- **Buffer:** Always keep at least $500 credits as a buffer for operations.
- **Priority 1: Iron Chain:** Maintain a 1:1:1 ratio of Extractor, Smelter, and Assembler.
- **Priority 2: Copper Chain:** Start copper setup (1:1 Extractor to Smelter) once at least 3 iron assemblers are making money.
- **Priority 3: Advanced Computing:** Aim for a 1:1:1 ratio between Advanced Assemblers, base Assemblers, and Copper Smelters.
- **Priority 4: Expansion:** If everything is balanced and credits exceed 2000, expand the base iron chain.

## Machine Simulation Logic

- **Batch Processing:** High speed multipliers allow multiple items to be produced in a single tick.
- **Greedy Input Check:** To handle extreme turbo modes, we calculate maximum possible production based on current input buffer levels before decrementing.
- **Urgency Vectors:** Logistics urgency is determined by the emptiest input buffers (demand) and the fullest output buffers (supply).

## State Management

- **Event Storm Compatibility:** Turbo mode checking happens at 10x the normal rate (100ms vs 1000ms) to ensure responsiveness during massive state changes.
- **Deep Freeze:** (Implemented in causaloop dispatcher) ensures no accidental mutations in large object graphs.
