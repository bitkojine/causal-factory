import { UpdateFn, UpdateResult, UpdateContext } from '@causaloop/core';
import { FactoryModel, FactoryMsg, FactoryEffect, Bot } from './types.js';

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
        case 'set_stress':
            return {
                model: { ...model, stressLevel: msg.level },
                effects: [],
            };
    }
};

function handleTick(model: FactoryModel, delta: number, ctx: UpdateContext): UpdateResult<FactoryModel, FactoryEffect> {
    const nextTickCount = model.tickCount + 1;
    const nextMachines = { ...model.machines };

    // Update machines (production)
    for (const id in nextMachines) {
        const machine = nextMachines[id];
        if (machine.type === 'extractor') {
            const nextProgress = machine.progress + delta * 0.1;
            if (nextProgress >= 100) {
                nextMachines[id] = {
                    ...machine,
                    progress: 0,
                    inventory: { ...machine.inventory, [machine.outputs[0]]: (machine.inventory[machine.outputs[0]] || 0) + 1 },
                };
            } else {
                nextMachines[id] = { ...machine, progress: nextProgress };
            }
        }
        // TODO: Add converter logic
    }

    // Update bots (movement)
    const nextBots = model.bots.map((bot) => {
        if (bot.state === 'moving') {
            const dx = bot.targetX - bot.x;
            const dy = bot.targetY - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const speed = 2 * delta;

            if (dist < speed) {
                return { ...bot, x: bot.targetX, y: bot.targetY, state: 'idle' as const };
            } else {
                return {
                    ...bot,
                    x: bot.x + (dx / dist) * speed,
                    y: bot.y + (dy / dist) * speed,
                };
            }
        } else if (bot.state === 'idle') {
            // Pick a random machine and move towards it
            const machineIds = Object.keys(model.machines);
            if (machineIds.length === 0) return bot;
            const targetId = machineIds[Math.floor(ctx.random() * machineIds.length)];
            const target = model.machines[targetId];
            return {
                ...bot,
                targetX: target.x,
                targetY: target.y,
                state: 'moving' as const,
            };
        }
        return bot;
    });

    return {
        model: {
            ...model,
            tickCount: nextTickCount,
            machines: nextMachines,
            bots: nextBots,
        },
        effects: [],
    };
}

function spawnBots(count: number, model: FactoryModel, ctx: UpdateContext): Bot[] {
    const bots: Bot[] = [];
    for (let i = 0; i < count; i++) {
        bots.push({
            id: `bot-${model.bots.length + i}`,
            x: ctx.random() * model.gridWidth * 20,
            y: ctx.random() * model.gridHeight * 20,
            targetX: 0,
            targetY: 0,
            state: 'idle',
        });
    }
    return bots;
}
