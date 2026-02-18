import { Snapshot, Subscription } from '@causaloop/core';
import { FactoryModel, FactoryMsg } from './types.js';

export function subscriptions(_model: Snapshot<FactoryModel>): readonly Subscription<FactoryMsg>[] {
    const subs: Subscription<FactoryMsg>[] = [];

    // Always sub to animation frame for the game loop
    subs.push({
        kind: 'animationFrame',
        key: 'game-loop',
        onFrame: (_time: number) => ({ kind: 'tick', delta: 1 }), // Simple delta for now
    } as any);

    return subs;
}
