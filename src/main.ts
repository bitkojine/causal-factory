import { createDispatcher, replay } from '@causaloop/core';
import { BrowserRunner } from '@causaloop/platform-browser';
import { update } from './core/update.js';
import { subscriptions } from './core/subscriptions.js';
import { FactoryModel } from './core/types.js';
import { CanvasRenderer } from './ui/renderer.js';

const initialModel: FactoryModel = {
    machines: {},
    bots: [],
    gridWidth: 50,
    gridHeight: 50,
    tickCount: 0,
    stressLevel: 1,
};

const runner = new BrowserRunner();
const renderer = new CanvasRenderer('app');

let lastTime = performance.now();
let tickTimes: number[] = [];

const dispatcher = createDispatcher({
    model: initialModel,
    update,
    subscriptions,
    effectRunner: (eff, dispatch) => runner.run(eff as any, dispatch as any),
    subscriptionRunner: {
        start: (sub, dispatch) => runner.startSubscription(sub as any, dispatch as any),
        stop: (key) => runner.stopSubscription(key),
    },
    onCommit: (snapshot) => {
        const now = performance.now();
        const tickTime = now - lastTime;
        tickTimes.push(tickTime);
        if (tickTimes.length > 60) tickTimes.shift();

        const avgTickTime = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length;
        renderer.render(snapshot, { tickTime: avgTickTime, fps: Math.round(1000 / tickTime) });
        lastTime = now;
    },
    devMode: true,
});

// Setup Initial Scene
dispatcher.dispatch({
    kind: 'add_machine',
    machine: {
        id: 'm1',
        x: 100,
        y: 100,
        type: 'extractor',
        outputs: ['iron'],
        inputs: [],
        inventory: { iron: 0, copper: 0, gear: 0, wire: 0, compute_core: 0 },
        progress: 0,
    },
});

dispatcher.dispatch({ kind: 'spawn_bots', count: 1000 });

// Expose for debugging and UI
(window as any).dispatcher = dispatcher;
(window as any).spawnBots = (count: number) => {
    dispatcher.dispatch({ kind: 'spawn_bots', count });
};

let stressInterval: any = null;
(window as any).toggleStress = () => {
    if (stressInterval) {
        clearInterval(stressInterval);
        stressInterval = null;
        console.log('Stress mode OFF');
    } else {
        stressInterval = setInterval(() => {
            dispatcher.dispatch({ kind: 'spawn_bots', count: 500 });
        }, 100);
        console.log('Stress mode ON');
    }
};

(window as any).triggerReplay = () => {
    const { log, snapshot: finalSnapshot } = dispatcher.getReplayableState();
    console.log('Starting replay of', log.length, 'messages');

    const startTime = performance.now();

    // Use the dedicated replay utility which synchronously processes the log
    const replayedSnapshot = replay({
        initialModel: initialModel,
        update,
        log,
    });

    const duration = performance.now() - startTime;

    // Verify determinism
    const isMatch = JSON.stringify(finalSnapshot) === JSON.stringify(replayedSnapshot);

    alert(`Replay completed in ${duration.toFixed(2)}ms\nDeterminism: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log('Final Snapshot:', finalSnapshot);
    console.log('Replayed Snapshot:', replayedSnapshot);
};
