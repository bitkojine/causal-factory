import { describe, it, expect } from "vitest";
import { handleTick } from "./update.js";
import { FactoryModel } from "./types.js";

describe("Game Logic Smoke Test", () => {
  it("should increment ticks on handleTick", () => {
    const initialModel: FactoryModel = {
      credits: 1000,
      machines: {},
      bots: {},
      gridWidth: 800,
      gridHeight: 600,
      tickCount: 0,
      speedMultiplier: 1,
      autoPilotEnabled: false,
    };

    const result = handleTick(initialModel, 16);
    expect(result.model.tickCount).toBe(1);
  });
});
