import { createDispatcher, replay } from '@causaloop/core';
import { BrowserRunner } from '@causaloop/platform-browser';
import { update } from './core/update.js';
import { subscriptions } from './core/subscriptions.js';
import { FactoryModel } from './core/types.js';
import { CanvasRenderer } from './ui/renderer.js';
import { AutoPilot } from './core/autopilot.js';

const initialModel: FactoryModel = {
    machines: {},
    bots: [],
    credits: 1000,
    gridWidth: 50,
    gridHeight: 50,
    tickCount: 0,
    speedMultiplier: 1,
};

const runner = new BrowserRunner();
const renderer = new CanvasRenderer('app');

let lastTime = performance.now();
let tickTimes: number[] = [];
let latestSnapshot: FactoryModel = initialModel;

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

        latestSnapshot = snapshot;
        lastTime = now;
    },
    devMode: true,
});

const autopilot = new AutoPilot((msg) => dispatcher.dispatch(msg));

setInterval(() => {
    autopilot.tick(latestSnapshot);
}, 100); // 10x faster checking for turbo mode compatibility

(window as any).toggleAutoPilot = () => autopilot.setEnabled(!autopilot.isEnabled());
(window as any).setGameSpeed = (speed: number) => dispatcher.dispatch({ kind: 'set_speed', speed });

// Setup Initial Industrial Zone
const setupScenario = () => {
    // 1. Extractor
    dispatcher.dispatch({
        kind: 'add_machine',
        machine: { id: 'ext1', x: 100, y: 300, type: 'extractor', inputRequirements: [], outputs: ['iron_ore'], inventory: { iron_ore: 0, iron_plate: 0, gear: 0, copper_ore: 0, copper_wire: 0, compute_core: 0 }, progress: 0, speed: 0.1 }
    });
    // 2. Smelter
    dispatcher.dispatch({
        kind: 'add_machine',
        machine: { id: 'sm1', x: 300, y: 300, type: 'smelter', inputRequirements: ['iron_ore'], outputs: ['iron_plate'], inventory: { iron_ore: 0, iron_plate: 0, gear: 0, copper_ore: 0, copper_wire: 0, compute_core: 0 }, progress: 0, speed: 0.05 }
    });
    // 3. Assembler
    dispatcher.dispatch({
        kind: 'add_machine',
        machine: { id: 'asm1', x: 500, y: 300, type: 'assembler', inputRequirements: ['iron_plate'], outputs: ['gear'], inventory: { iron_ore: 0, iron_plate: 0, gear: 0, copper_ore: 0, copper_wire: 0, compute_core: 0 }, progress: 0, speed: 0.03 }
    });
    // 4. Sink
    dispatcher.dispatch({
        kind: 'add_machine',
        machine: { id: 'snk1', x: 700, y: 300, type: 'sink', inputRequirements: ['gear'], outputs: [], inventory: { iron_ore: 0, iron_plate: 0, gear: 0, copper_ore: 0, copper_wire: 0, compute_core: 0 }, progress: 0, speed: 1.0 }
    });

    dispatcher.dispatch({ kind: 'spawn_bots', count: 100 });
};

setupScenario();

// UI Bindings
(window as any).buyMachine = (type: any) => {
    const x = Math.random() * (window.innerWidth - 100) + 50;
    const y = Math.random() * (window.innerHeight - 200) + 100;
    dispatcher.dispatch({ kind: 'buy_machine', machineType: type, x, y });
};

(window as any).spawnBots = (count: number) => {
    dispatcher.dispatch({ kind: 'spawn_bots', count });
};

let stressInterval: any = null;
(window as any).toggleStress = () => {
    if (stressInterval) {
        clearInterval(stressInterval);
        stressInterval = null;
    } else {
        stressInterval = setInterval(() => {
            dispatcher.dispatch({ kind: 'spawn_bots', count: 200 });
        }, 50);
    }
};

(window as any).triggerMarketCrash = () => {
    dispatcher.dispatch({ kind: 'market_crash' });
};

(window as any).triggerReplay = () => {
    const { log, snapshot: finalSnapshot } = dispatcher.getReplayableState();
    const replayedSnapshot = replay({ initialModel, update, log });
    const isMatch = JSON.stringify(finalSnapshot) === JSON.stringify(replayedSnapshot);
    alert(`Determinism Replay: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);
};
