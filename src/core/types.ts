import { Effect, Model } from '@causaloop/core';

export type Resource = 'iron' | 'copper' | 'gear' | 'wire' | 'compute_core';

export interface Machine {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly type: 'extractor' | 'converter' | 'sink';
    readonly outputs: Resource[];
    readonly inputs: Resource[];
    readonly inventory: Record<Resource, number>;
    readonly progress: number; // 0 to 100
}

export interface Bot {
    readonly id: string;
    readonly x: number;
    readonly y: number;
    readonly targetX: number;
    readonly targetY: number;
    readonly payload?: Resource;
    readonly state: 'idle' | 'moving' | 'loading' | 'unloading';
}

export interface FactoryModel extends Model {
    readonly machines: Record<string, Machine>;
    readonly bots: Bot[];
    readonly gridWidth: number;
    readonly gridHeight: number;
    readonly tickCount: number;
    readonly stressLevel: number; // multiplier for bot count
}

export type FactoryMsg =
    | { readonly kind: 'tick'; readonly delta: number }
    | { readonly kind: 'add_machine'; readonly machine: Machine }
    | { readonly kind: 'spawn_bots'; readonly count: number }
    | { readonly kind: 'set_stress'; readonly level: number };

export type FactoryEffect = Effect;
