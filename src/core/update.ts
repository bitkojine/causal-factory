import { UpdateFn, UpdateResult, UpdateContext } from '@causaloop/core';
import { FactoryModel, FactoryMsg, FactoryEffect, Bot, Machine, Resource, MachineType, BotState } from './types.js';

const MACHINE_SPECS: Record<MachineType, { cost: number; inputs: Resource[]; outputs: Resource[]; speed: number }> = {
    extractor: { cost: 100, inputs: [], outputs: ['iron_ore'], speed: 0.05 },
    smelter: { cost: 500, inputs: ['iron_ore'], outputs: ['iron_plate'], speed: 0.03 },
    assembler: { cost: 1200, inputs: ['iron_plate'], outputs: ['gear'], speed: 0.02 },
    sink: { cost: 0, inputs: ['gear'], outputs: [], speed: 1.0 },
};

export const update: UpdateFn<FactoryModel, FactoryMsg, FactoryEffect> = (
    model: FactoryModel,
    msg: FactoryMsg,
    ctx: UpdateContext,
): UpdateResult<FactoryModel, FactoryEffect> => {
    switch (msg.kind) {
        case 'tick':
            return handleTick(model, msg.delta, ctx);
        case 'add_machine':
            return {
                model: {
                    ...model,
                    machines: { ...model.machines, [msg.machine.id]: msg.machine },
                },
                effects: [],
            };
        case 'spawn_bots':
            return {
                model: {
                    ...model,
                    bots: [...model.bots, ...spawnBots(msg.count, model, ctx)],
                },
                effects: [],
            };
        case 'buy_machine':
            const spec = MACHINE_SPECS[msg.machineType];
            if (model.credits < spec.cost) return { model, effects: [] };
            const newMachine: Machine = {
                id: `m-${ctx.now()}-${ctx.random()}`,
                x: msg.x,
                y: msg.y,
                type: msg.machineType,
                inputRequirements: spec.inputs,
                outputs: spec.outputs,
                inventory: {
                    iron_ore: 0, iron_plate: 0, gear: 0, copper_ore: 0, copper_wire: 0, compute_core: 0
                } as Record<Resource, number>,
                progress: 0,
                speed: spec.speed,
            };
            return {
                model: {
                    ...model,
                    credits: model.credits - spec.cost,
                    machines: { ...model.machines, [newMachine.id]: newMachine },
                },
                effects: [],
            };
        case 'market_crash':
            return {
                model: {
                    ...model,
                    bots: model.bots.map(b => ({ ...b, state: { kind: 'idle' } as BotState })),
                },
                effects: [],
            };
        case 'set_stress':
            return { model, effects: [] };
        default:
            return { model, effects: [] };
    }
};

function handleTick(model: FactoryModel, delta: number, _ctx: UpdateContext): UpdateResult<FactoryModel, FactoryEffect> {
    let nextCredits = model.credits;
    const nextMachines = { ...model.machines };

    // 1. Process Machines
    for (const id in nextMachines) {
        const m = nextMachines[id];
        const canProcess = m.inputRequirements.every(r => (m.inventory[r] || 0) > 0);

        if (canProcess && (m.type !== 'sink' || m.inputRequirements.length > 0)) {
            const nextProgress = m.progress + m.speed * delta;
            if (nextProgress >= 100) {
                const nextInv = { ...m.inventory };
                m.inputRequirements.forEach(r => { nextInv[r] = (nextInv[r] || 1) - 1; });
                m.outputs.forEach(r => { nextInv[r] = (nextInv[r] || 0) + 1; });

                if (m.type === 'sink') {
                    nextCredits += 50;
                }

                nextMachines[id] = { ...m, progress: 0, inventory: nextInv };
            } else {
                nextMachines[id] = { ...m, progress: nextProgress };
            }
        }
    }

    // 2. Identify Supply and Demand
    const supply: { machineId: string; resource: Resource }[] = [];
    const demand: { machineId: string; resource: Resource }[] = [];

    for (const id in nextMachines) {
        const m = nextMachines[id];
        m.outputs.forEach(r => {
            if ((m.inventory[r] || 0) > 0) supply.push({ machineId: id, resource: r });
        });
        m.inputRequirements.forEach(r => {
            if ((m.inventory[r] || 0) < 5) demand.push({ machineId: id, resource: r });
        });
    }

    // 3. Update Bots
    const nextBots: Bot[] = model.bots.map(bot => {
        switch (bot.state.kind) {
            case 'idle':
                if (bot.payload) {
                    const target = demand.find(d => d.resource === bot.payload);
                    if (target) {
                        return {
                            ...bot,
                            state: { kind: 'moving_to_deliver', machineId: target.machineId, resource: target.resource } as BotState
                        };
                    }
                } else {
                    const target = supply.find(_ => true);
                    if (target) {
                        return {
                            ...bot,
                            state: { kind: 'moving_to_pickup', machineId: target.machineId, resource: target.resource } as BotState
                        };
                    }
                }
                return bot;

            case 'moving_to_pickup': {
                const target = nextMachines[bot.state.machineId];
                if (!target) return { ...bot, state: { kind: 'idle' } as BotState };

                const { x, y, arrived } = moveTowards(bot.x, bot.y, target.x, target.y, delta * 5);
                if (arrived) {
                    if ((target.inventory[bot.state.resource] || 0) > 0) {
                        const nextInv = { ...target.inventory };
                        nextInv[bot.state.resource]--;
                        nextMachines[target.id] = { ...target, inventory: nextInv };
                        return { ...bot, x, y, payload: bot.state.resource, state: { kind: 'idle' } as BotState };
                    }
                    return { ...bot, x, y, state: { kind: 'idle' } as BotState };
                }
                return { ...bot, x, y };
            }

            case 'moving_to_deliver': {
                const target = nextMachines[bot.state.machineId];
                if (!target) return { ...bot, state: { kind: 'idle' } as BotState };

                const { x, y, arrived } = moveTowards(bot.x, bot.y, target.x, target.y, delta * 5);
                if (arrived) {
                    const nextInv = { ...target.inventory };
                    nextInv[bot.state.resource] = (nextInv[bot.state.resource] || 0) + 1;
                    nextMachines[target.id] = { ...target, inventory: nextInv };
                    return { ...bot, x, y, payload: undefined, state: { kind: 'idle' } as BotState };
                }
                return { ...bot, x, y };
            }
            default:
                return bot;
        }
    });

    return {
        model: {
            ...model,
            tickCount: model.tickCount + 1,
            credits: nextCredits,
            machines: nextMachines,
            bots: nextBots,
        },
        effects: [],
    };
}

function moveTowards(x: number, y: number, tx: number, ty: number, speed: number) {
    const dx = tx - x;
    const dy = ty - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < speed) return { x: tx, y: ty, arrived: true };
    return {
        x: x + (dx / dist) * speed,
        y: y + (dy / dist) * speed,
        arrived: false,
    };
}

function spawnBots(count: number, model: FactoryModel, ctx: UpdateContext): Bot[] {
    const bots: Bot[] = [];
    for (let i = 0; i < count; i++) {
        bots.push({
            id: `bot-${model.bots.length + i}`,
            x: ctx.random() * 800,
            y: ctx.random() * 600,
            state: { kind: 'idle' },
        });
    }
    return bots;
}
