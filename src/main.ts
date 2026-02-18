import { createDispatcher, replay } from '@causaloop/core';
import { BrowserRunner } from '@causaloop/platform-browser';
import { update } from './core/update.js';
import { subscriptions } from './core/subscriptions.js';
import { FactoryModel, FactoryMsg, MachineType } from './core/types.js';
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

const runner = new BrowserRunner<FactoryMsg>();
const renderer = new CanvasRenderer('app');

let lastTime = performance.now();
let tickTimes: number[] = [];
let latestSnapshot: FactoryModel = initialModel;

const dispatcher = createDispatcher({
    model: initialModel,
    update,
    subscriptions,
    effectRunner: (eff, dispatch) => runner.run(eff, dispatch),
    subscriptionRunner: {
        start: (sub, dispatch) => runner.startSubscription(sub, dispatch),
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

declare global {
    interface Window {
        toggleAutoPilot: () => void;
        setGameSpeed: (speed: number) => void;
        buyMachine: (type: MachineType) => void;
        spawnBots: (count: number) => void;
        toggleStress: () => void;
        triggerMarketCrash: () => void;
        triggerReplay: () => void;
    }
}

window.toggleAutoPilot = () => autopilot.setEnabled(!autopilot.isEnabled());
window.setGameSpeed = (speed: number) => dispatcher.dispatch({ kind: 'set_speed', speed });

const setupScenario = () => {
    dispatcher.dispatch({
        kind: 'add_machine',
        machine: { id: 'ext1', x: 100, y: 300, type: 'extractor', inputRequirements: [], outputs: ['iron_ore'], inventory: { iron_ore: 0, iron_plate: 0, gear: 0, copper_ore: 0, copper_wire: 0, compute_core: 0 }, progress: 0, speed: 0.1 }
    });
    dispatcher.dispatch({
        kind: 'add_machine',
        machine: { id: 'sm1', x: 300, y: 300, type: 'smelter', inputRequirements: ['iron_ore'], outputs: ['iron_plate'], inventory: { iron_ore: 0, iron_plate: 0, gear: 0, copper_ore: 0, copper_wire: 0, compute_core: 0 }, progress: 0, speed: 0.05 }
    });
    dispatcher.dispatch({
        kind: 'add_machine',
        machine: { id: 'asm1', x: 500, y: 300, type: 'assembler', inputRequirements: ['iron_plate'], outputs: ['gear'], inventory: { iron_ore: 0, iron_plate: 0, gear: 0, copper_ore: 0, copper_wire: 0, compute_core: 0 }, progress: 0, speed: 0.03 }
    });
    dispatcher.dispatch({
        kind: 'add_machine',
        machine: { id: 'snk1', x: 700, y: 300, type: 'sink', inputRequirements: ['gear'], outputs: [], inventory: { iron_ore: 0, iron_plate: 0, gear: 0, copper_ore: 0, copper_wire: 0, compute_core: 0 }, progress: 0, speed: 1.0 }
    });

    dispatcher.dispatch({ kind: 'spawn_bots', count: 100 });
};

setupScenario();

window.buyMachine = (type: MachineType) => {
    const x = Math.random() * (window.innerWidth - 100) + 50;
    const y = Math.random() * (window.innerHeight - 200) + 100;
    dispatcher.dispatch({ kind: 'buy_machine', machineType: type, x, y });
};

window.spawnBots = (count: number) => {
    dispatcher.dispatch({ kind: 'spawn_bots', count });
};

let stressInterval: ReturnType<typeof setInterval> | null = null;
window.toggleStress = () => {
    if (stressInterval) {
        clearInterval(stressInterval);
        stressInterval = null;
    } else {
        stressInterval = setInterval(() => {
            dispatcher.dispatch({ kind: 'spawn_bots', count: 200 });
        }, 50);
    }
};

window.triggerMarketCrash = () => {
    dispatcher.dispatch({ kind: 'market_crash' });
};

window.triggerReplay = () => {
    const { log, snapshot: finalSnapshot } = dispatcher.getReplayableState();
    const replayedSnapshot = replay({ initialModel, update, log });
    const isMatch = JSON.stringify(finalSnapshot) === JSON.stringify(replayedSnapshot);
    alert(`Determinism Replay: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);
};
