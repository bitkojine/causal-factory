
import { FactoryModel, FactoryMsg, MachineType } from './types.js';

export class AutoPilot {
    private dispatch: (msg: FactoryMsg) => void;
    private enabled: boolean = false;

    constructor(dispatch: (msg: FactoryMsg) => void) {
        this.dispatch = dispatch;
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        console.log(`Auto-Pilot ${enabled ? 'ENGAGED' : 'DISENGAGED'}`);
    }

    public isEnabled() {
        return this.enabled;
    }

    public tick(model: FactoryModel) {
        if (!this.enabled) return;

        this.manageBots(model);
        this.manageConstruction(model);
    }

    private manageBots(model: FactoryModel) {
        const totalBots = model.bots.length;
        if (totalBots === 0) {
            this.dispatch({ kind: 'spawn_bots', count: 10 });
            return;
        }

        const idleBots = model.bots.filter(b => b.state.kind === 'idle').length;
        const idleRatio = idleBots / totalBots;

        // If less than 10% bots are idle, we are bottlenecked on logistics -> Buy more bots
        if (idleRatio < 0.10) {
            // Check performance: don't spawn if we are lagging? 
            // For now just hard cap at 2000 for safety unless stress testing
            if (totalBots < 2000) {
                const batch = Math.max(10, Math.floor(totalBots * 0.1));
                console.log(`[AutoPilot] Low idle bots (${(idleRatio * 100).toFixed(1)}%). Spawning ${batch} bots.`);
                this.dispatch({ kind: 'spawn_bots', count: batch });
            }
        }
    }

    private manageConstruction(model: FactoryModel) {
        // Costs (hardcoded for heuristics, should ideally come from specs)
        const COSTS = {
            extractor: 100,
            smelter: 500,
            assembler: 1200,
            extractor_copper: 100,
            smelter_copper: 500,
            assembler_advanced: 3000,
        };

        const BUFFER = 500; // Always keep this much cash
        const credits = model.credits;

        if (credits < 100 + BUFFER) return; // Can't buy anything

        // Count machines
        const m = Object.values(model.machines);
        const counts = {
            extractor: m.filter(x => x.type === 'extractor').length,
            smelter: m.filter(x => x.type === 'smelter').length,
            assembler: m.filter(x => x.type === 'assembler').length,
            extractor_copper: m.filter(x => x.type === 'extractor_copper').length,
            smelter_copper: m.filter(x => x.type === 'smelter_copper').length,
            assembler_advanced: m.filter(x => x.type === 'assembler_advanced').length,
        };

        // PRIORITIES

        // 1. Basic Iron Chain (1:1:1)
        // We want at least 1 full chain to make money
        if (counts.extractor < counts.smelter && credits > COSTS.extractor + BUFFER) {
            this.buy('extractor'); return;
        }
        if (counts.smelter < counts.extractor && credits > COSTS.smelter + BUFFER) {
            this.buy('smelter'); return;
        }
        if (counts.assembler < counts.smelter && credits > COSTS.assembler + BUFFER) {
            this.buy('assembler'); return;
        }

        // 2. Copper Setup (for Advanced) (1:1)
        // Only start if we have a basic iron setup (at least 3 assemblers making money)
        if (counts.assembler >= 3) {
            if (counts.extractor_copper < counts.smelter_copper + 1 && credits > COSTS.extractor_copper + BUFFER) {
                this.buy('extractor_copper'); return;
            }
            if (counts.smelter_copper < counts.extractor_copper && credits > COSTS.smelter_copper + BUFFER) {
                this.buy('smelter_copper'); return;
            }
        }

        // 3. Advanced Assembler (Needs Gear + Copper Wire)
        // Rule: 1 Advanced needs ~1 Gear Assembler and ~1 Copper Smelter
        // So we target: Adv < min(Assembler, CopperSmelter)
        if (counts.assembler_advanced < Math.min(counts.assembler, counts.smelter_copper) && credits > COSTS.assembler_advanced + BUFFER) {
            this.buy('assembler_advanced'); return;
        }

        // 4. Expansion Loop
        // If everything is balanced, expand the base iron chain again to generate more credits
        // But only if we are rich. Lowered to 2000 to encourage growth.
        if (credits > 2000) {
            if (counts.extractor <= counts.smelter) {
                this.buy('extractor');
            } else if (counts.smelter <= counts.assembler) {
                this.buy('smelter');
            } else {
                this.buy('assembler');
            }
        }
    }

    private buy(type: MachineType) {
        const x = Math.random() * 800 + 50;
        const y = Math.random() * 600 + 100;
        console.log(`[AutoPilot] Buying ${type}`);
        this.dispatch({
            kind: 'buy_machine',
            machineType: type,
            x,
            y
        });
    }
}
