import { AnimationFrameSubscription, TimerSubscription } from "@causaloop/core";
import { FactoryModel, FactoryMsg } from "./types.js";

export function subscriptions(model: FactoryModel): readonly (AnimationFrameSubscription<FactoryMsg> | TimerSubscription<FactoryMsg>)[] {
  const subs: (AnimationFrameSubscription<FactoryMsg> | TimerSubscription<FactoryMsg>)[] = [
    {
      kind: "animationFrame",
      key: "game-loop",
      onFrame: () => ({ kind: "tick", delta: 1 }),
    },
  ];

  if (model.autoPilotEnabled) {
    subs.push({
      kind: "timer",
      key: "autopilot",
      intervalMs: 100,
      onTick: () => ({ kind: "autopilot_tick" }),
    });
  }

  return subs;
}
