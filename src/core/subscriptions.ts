import { AnimationFrameSubscription, Snapshot } from '@causaloop/core';
import { FactoryModel, FactoryMsg } from './types.js';

export function subscriptions(_model: Snapshot<FactoryModel>): readonly AnimationFrameSubscription<FactoryMsg>[] {
    return [{
        kind: 'animationFrame',
        key: 'game-loop',
        onFrame: (_time: number) => ({ kind: 'tick', delta: 1 }),
    }];
}
