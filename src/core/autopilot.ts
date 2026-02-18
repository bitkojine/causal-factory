import { FactoryModel, FactoryMsg, MachineType } from "./types.js";

export class AutoPilot {
  private dispatch: (msg: FactoryMsg) => void;
  private enabled: boolean = false;

  constructor(dispatch: (msg: FactoryMsg) => void) {
    this.dispatch = dispatch;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled() {
    return this.enabled;
  }

  public tick(model: FactoryModel) {
    if (!this.enabled) return;

    this.manageBots(model);
    this.manageConstruction(model);
  }

  private manageBots(model: FactoryModel) {
    const allBots = Object.values(model.bots);
    const totalBots = allBots.length;
    if (totalBots === 0) {
      this.dispatch({ kind: "spawn_bots", count: 10 });
      return;
    }

    const idleBots = allBots.filter((b) => b.state.kind === "idle").length;
    const idleRatio = idleBots / totalBots;

    if (idleRatio < 0.1) {
      if (totalBots < 2000) {
        const batch = Math.max(10, Math.floor(totalBots * 0.1));
        this.dispatch({ kind: "spawn_bots", count: batch });
      }
    }
  }

  private manageConstruction(model: FactoryModel) {
    const COSTS = {
      extractor: 100,
      smelter: 500,
      assembler: 1200,
      extractor_copper: 100,
      smelter_copper: 500,
      assembler_advanced: 3000,
    };

    const BUFFER = 500;
    const credits = model.credits;

    if (credits < 100 + BUFFER) return;

    const m = Object.values(model.machines);
    const counts = {
      extractor: m.filter((x) => x.type === "extractor").length,
      smelter: m.filter((x) => x.type === "smelter").length,
      assembler: m.filter((x) => x.type === "assembler").length,
      extractor_copper: m.filter((x) => x.type === "extractor_copper").length,
      smelter_copper: m.filter((x) => x.type === "smelter_copper").length,
      assembler_advanced: m.filter((x) => x.type === "assembler_advanced")
        .length,
    };

    if (
      counts.extractor < counts.smelter &&
      credits > COSTS.extractor + BUFFER
    ) {
      this.buy("extractor");
      return;
    }
    if (counts.smelter < counts.extractor && credits > COSTS.smelter + BUFFER) {
      this.buy("smelter");
      return;
    }
    if (
      counts.assembler < counts.smelter &&
      credits > COSTS.assembler + BUFFER
    ) {
      this.buy("assembler");
      return;
    }

    if (counts.assembler >= 3) {
      if (
        counts.extractor_copper < counts.smelter_copper + 1 &&
        credits > COSTS.extractor_copper + BUFFER
      ) {
        this.buy("extractor_copper");
        return;
      }
      if (
        counts.smelter_copper < counts.extractor_copper &&
        credits > COSTS.smelter_copper + BUFFER
      ) {
        this.buy("smelter_copper");
        return;
      }
    }

    if (
      counts.assembler_advanced <
        Math.min(counts.assembler, counts.smelter_copper) &&
      credits > COSTS.assembler_advanced + BUFFER
    ) {
      this.buy("assembler_advanced");
      return;
    }

    if (credits > 2000) {
      if (counts.extractor <= counts.smelter) {
        this.buy("extractor");
      } else if (counts.smelter <= counts.assembler) {
        this.buy("smelter");
      } else {
        this.buy("assembler");
      }
    }
  }

  private buy(type: MachineType) {
    const x = Math.random() * 800 + 50;
    const y = Math.random() * 600 + 100;
    this.dispatch({
      kind: "buy_machine",
      machineType: type,
      x,
      y,
    });
  }
}
