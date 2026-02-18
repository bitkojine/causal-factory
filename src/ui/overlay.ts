import { h, VNode, PerformanceMetrics } from "@causaloop/core";
import { FactoryModel } from "../core/types.js";

export function view(model: FactoryModel, metrics: PerformanceMetrics): VNode {
    return h("div", { attrs: { id: "ui-overlay" } }, [
        h(
            "div",
            {
                class: { metric: true },
                style: {
                    color: "#ffcc00",
                    "font-size": "1.2em",
                    "font-weight": "bold",
                    "border-left-color": "#ffcc00",
                },
            },
            [`Credits: $${model.credits}`],
        ),
        h("div", { class: { metric: true } }, [
            `Bots: ${Object.keys(model.bots).length}`,
        ]),
        h("div", { class: { metric: true } }, [
            `Machines: ${Object.keys(model.machines).length}`,
        ]),
        h("div", { class: { metric: true } }, [
            `Tick Time: ${metrics.avgUpdateMs.toFixed(2)}ms`,
        ]),
        h("div", { class: { metric: true } }, [
            `FPS: ${metrics.fps}`,
        ]),
        model.autoPilotEnabled
            ? h(
                "div",
                {
                    class: { metric: true },
                    style: { color: "#00ff00", "border-left-color": "#00ff00" },
                },
                ["AutoPilot: ACTIVE"],
            )
            : h("div", { style: { display: "none" } }, []),
    ]);
}
