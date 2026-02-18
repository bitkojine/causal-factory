import { UpdateFn, UpdateResult, UpdateContext } from "@causaloop/core";
import {
  FactoryModel,
  FactoryMsg,
  FactoryEffect,
  Bot,
  Machine,
  Resource,
  MachineType,
  BotState,
} from "./types.js";

const MACHINE_SPECS: Record<
  MachineType,
  { cost: number; inputs: Resource[]; outputs: Resource[]; speed: number }
> = {
  extractor: { cost: 100, inputs: [], outputs: ["iron_ore"], speed: 0.05 },
  smelter: {
    cost: 500,
    inputs: ["iron_ore"],
    outputs: ["iron_plate"],
    speed: 0.03,
  },
  assembler: {
    cost: 1200,
    inputs: ["iron_plate"],
    outputs: ["gear"],
    speed: 0.02,
  },
  sink: { cost: 0, inputs: ["gear"], outputs: [], speed: 1.0 },
  extractor_copper: {
    cost: 100,
    inputs: [],
    outputs: ["copper_ore"],
    speed: 0.05,
  },
  smelter_copper: {
    cost: 500,
    inputs: ["copper_ore"],
    outputs: ["copper_wire"],
    speed: 0.03,
  },
  assembler_advanced: {
    cost: 3000,
    inputs: ["gear", "copper_wire"],
    outputs: ["compute_core"],
    speed: 0.01,
  },
};

export const update: UpdateFn<FactoryModel, FactoryMsg, FactoryEffect> = (
  model: FactoryModel,
  msg: FactoryMsg,
  ctx: UpdateContext,
): UpdateResult<FactoryModel, FactoryEffect> => {
  switch (msg.kind) {
    case "tick":
      return handleTick(model, msg.delta);
    case "set_speed":
      return { model: { ...model, speedMultiplier: msg.speed }, effects: [] };
    case "add_machine":
      return {
        model: {
          ...model,
          machines: { ...model.machines, [msg.machine.id]: msg.machine },
        },
        effects: [],
      };
    case "spawn_bots":
      return {
        model: {
          ...model,
          bots: { ...model.bots, ...spawnBots(msg.count, model, ctx) },
        },
        effects: [],
      };
    case "buy_machine": {
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
          iron_ore: 0,
          iron_plate: 0,
          gear: 0,
          copper_ore: 0,
          copper_wire: 0,
          compute_core: 0,
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
    }
    case "market_crash": {
      const resetBots: Record<string, Bot> = {};
      for (const id in model.bots) {
        resetBots[id] = {
          ...model.bots[id],
          state: { kind: "idle" } as BotState,
        };
      }
      return {
        model: { ...model, bots: resetBots },
        effects: [],
      };
    }
    case "reset_bot":
      return {
        model: {
          ...model,
          bots: {
            ...model.bots,
            [msg.botId]: {
              ...model.bots[msg.botId],
              state: { kind: "idle" } as BotState,
            },
          },
        },
        effects: [],
      };
    case "set_stress":
      return { model, effects: [] };
    default:
      return { model, effects: [] };
  }
};

export function handleTick(
  model: FactoryModel,
  delta: number,
): UpdateResult<FactoryModel, FactoryEffect> {
  let nextCredits = model.credits;
  const nextMachines = { ...model.machines };

  const effectiveDelta = delta * (model.speedMultiplier || 1);

  for (const id in nextMachines) {
    const m = nextMachines[id];
    const canProcess = m.inputRequirements.every(
      (r) => (m.inventory[r] || 0) > 0,
    );

    if (canProcess && (m.type !== "sink" || m.inputRequirements.length > 0)) {
      let nextProgress = m.progress + m.speed * effectiveDelta;
      let producedCount = 0;

      while (nextProgress >= 100) {
        producedCount++;
        nextProgress -= 100;

        const maxAfford =
          m.inputRequirements.length > 0
            ? Math.min(...m.inputRequirements.map((r) => m.inventory[r] || 0))
            : 999999;

        if (producedCount > maxAfford) {
          producedCount--;
          nextProgress = 0;
          break;
        }
      }

      if (producedCount > 0) {
        const nextInv = { ...m.inventory };
        m.inputRequirements.forEach((r) => {
          nextInv[r] = (nextInv[r] || 0) - producedCount;
        });
        m.outputs.forEach((r) => {
          nextInv[r] = (nextInv[r] || 0) + producedCount;
        });

        if (m.type === "sink") {
          nextCredits += 50 * producedCount;
        }

        nextMachines[id] = { ...m, progress: nextProgress, inventory: nextInv };
      } else {
        nextMachines[id] = { ...m, progress: nextProgress };
      }
    }
  }

  const supply: { machineId: string; resource: Resource; count: number }[] = [];
  const demand: { machineId: string; resource: Resource; count: number }[] = [];

  for (const id in nextMachines) {
    const m = nextMachines[id];
    m.outputs.forEach((r) => {
      const count = m.inventory[r] || 0;
      if (count > 0) supply.push({ machineId: id, resource: r, count });
    });
    m.inputRequirements.forEach((r) => {
      const count = m.inventory[r] || 0;
      if (count < 10) demand.push({ machineId: id, resource: r, count });
    });
  }

  demand.sort((a, b) => a.count - b.count);
  supply.sort((a, b) => b.count - a.count);

  const nextBots: Record<string, Bot> = {};
  for (const id in model.bots) {
    const bot = model.bots[id];
    switch (bot.state.kind) {
      case "idle":
        if (bot.payload) {
          const target = demand.find((d) => d.resource === bot.payload);
          if (target) {
            nextBots[id] = {
              ...bot,
              state: {
                kind: "moving_to_deliver",
                machineId: target.machineId,
                resource: target.resource,
              } as BotState,
            };
            break;
          }
        } else {
          const target = supply.find(() => true);
          if (target) {
            nextBots[id] = {
              ...bot,
              state: {
                kind: "moving_to_pickup",
                machineId: target.machineId,
                resource: target.resource,
              } as BotState,
            };
            break;
          }
        }
        nextBots[id] = bot;
        break;

      case "moving_to_pickup": {
        const target = nextMachines[bot.state.machineId];
        if (!target) {
          nextBots[id] = { ...bot, state: { kind: "idle" } as BotState };
          break;
        }

        const { x, y, arrived } = moveTowards(
          bot.x,
          bot.y,
          target.x,
          target.y,
          delta * 5,
        );
        if (arrived) {
          if ((target.inventory[bot.state.resource] || 0) > 0) {
            const nextInv = { ...target.inventory };
            nextInv[bot.state.resource]--;
            nextMachines[target.id] = { ...target, inventory: nextInv };
            nextBots[id] = {
              ...bot,
              x,
              y,
              payload: bot.state.resource,
              state: { kind: "idle" } as BotState,
            };
          } else {
            nextBots[id] = {
              ...bot,
              x,
              y,
              state: { kind: "idle" } as BotState,
            };
          }
        } else {
          nextBots[id] = { ...bot, x, y };
        }
        break;
      }

      case "moving_to_deliver": {
        const target = nextMachines[bot.state.machineId];
        if (!target) {
          nextBots[id] = { ...bot, state: { kind: "idle" } as BotState };
          break;
        }

        const { x, y, arrived } = moveTowards(
          bot.x,
          bot.y,
          target.x,
          target.y,
          delta * 5,
        );
        if (arrived) {
          const nextInv = { ...target.inventory };
          nextInv[bot.state.resource] = (nextInv[bot.state.resource] || 0) + 1;
          nextMachines[target.id] = { ...target, inventory: nextInv };
          nextBots[id] = {
            ...bot,
            x,
            y,
            payload: undefined,
            state: { kind: "idle" } as BotState,
          };
        } else {
          nextBots[id] = { ...bot, x, y };
        }
        break;
      }
      default:
        nextBots[id] = bot;
        break;
    }
  }

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

function moveTowards(
  x: number,
  y: number,
  tx: number,
  ty: number,
  speed: number,
) {
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

function spawnBots(
  count: number,
  model: FactoryModel,
  ctx: UpdateContext,
): Record<string, Bot> {
  const existingCount = Object.keys(model.bots).length;
  const bots: Record<string, Bot> = {};
  for (let i = 0; i < count; i++) {
    const id = `bot-${existingCount + i}`;
    bots[id] = {
      id,
      x: ctx.random() * 800,
      y: ctx.random() * 600,
      state: { kind: "idle" },
    };
  }
  return bots;
}
