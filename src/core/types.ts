import { CoreEffect, Model } from "@causaloop/core";

export type Resource =
  | "iron_ore"
  | "iron_plate"
  | "gear"
  | "copper_ore"
  | "copper_wire"
  | "compute_core";

export type MachineType =
  | "extractor"
  | "smelter"
  | "assembler"
  | "sink"
  | "extractor_copper"
  | "smelter_copper"
  | "assembler_advanced";

export interface Machine {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly type: MachineType;
  readonly inputRequirements: Resource[];
  readonly outputs: Resource[];
  readonly inventory: Record<Resource, number>;
  readonly progress: number;
  readonly speed: number;
}

export type BotState =
  | { readonly kind: "idle" }
  | {
    readonly kind: "moving_to_pickup";
    readonly machineId: string;
    readonly resource: Resource;
  }
  | {
    readonly kind: "moving_to_deliver";
    readonly machineId: string;
    readonly resource: Resource;
  };

export interface Bot {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly payload?: Resource;
  readonly state: BotState;
}

export interface FactoryModel extends Model {
  readonly machines: Record<string, Machine>;
  readonly bots: Record<string, Bot>;
  readonly credits: number;
  readonly gridWidth: number;
  readonly gridHeight: number;
  readonly tickCount: number;
  readonly speedMultiplier: number;
}

export type FactoryMsg =
  | { readonly kind: "tick"; readonly delta: number }
  | { readonly kind: "add_machine"; readonly machine: Machine }
  | { readonly kind: "spawn_bots"; readonly count: number }
  | {
    readonly kind: "buy_machine";
    readonly machineType: MachineType;
    readonly x: number;
    readonly y: number;
  }
  | { readonly kind: "market_crash" }
  | { readonly kind: "reset_bot"; readonly botId: string }
  | { readonly kind: "set_stress"; readonly level: number }
  | { readonly kind: "set_speed"; readonly speed: number };

export type FactoryEffect = CoreEffect<FactoryMsg>;
