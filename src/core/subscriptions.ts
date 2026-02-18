import { AnimationFrameSubscription } from "@causaloop/core";
import { FactoryMsg } from "./types.js";

export function subscriptions(): readonly AnimationFrameSubscription<FactoryMsg>[] {
  return [
    {
      kind: "animationFrame",
      key: "game-loop",
      onFrame: () => ({ kind: "tick", delta: 1 }),
    },
  ];
}
