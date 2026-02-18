import { Snapshot } from "@causaloop/core";
import { FactoryModel, Machine, MachineType } from "../core/types.js";

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error("Container not found");

    this.canvas = document.createElement("canvas");
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext("2d", { alpha: false })!;

    this.resize();

    window.addEventListener("resize", () => {
      this.resize();
    });
  }

  private resize() {
    const dpr = window.devicePixelRatio || 1;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);

    this.ctx.scale(dpr, dpr);
  }

  public render(
    snapshot: Snapshot<FactoryModel>,
    metrics: { tickTime: number; fps: number },
  ) {
    const { ctx } = this;
    const width = window.innerWidth;
    const height = window.innerHeight;

    ctx.fillStyle = "#101010";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < width; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    for (const id in snapshot.machines) {
      const m = snapshot.machines[id];
      this.drawMachine(m);
    }

    for (const bot of Object.values(snapshot.bots)) {
      if (bot.payload) {
        ctx.fillStyle = "#00ff00";
        ctx.fillRect(bot.x - 3, bot.y - 3, 6, 6);
      } else {
        ctx.fillStyle = "#ffcc00";
        ctx.fillRect(bot.x - 2, bot.y - 2, 4, 4);
      }
    }

    this.updateOverlay(snapshot, metrics);
  }

  private drawMachine(m: Machine) {
    const ctx = this.ctx;
    const colors: Record<MachineType, string> = {
      extractor: "#4a9eff",
      smelter: "#ff8c00",
      assembler: "#a020f0",
      sink: "#ff4a4a",
      extractor_copper: "#4a9eff",
      smelter_copper: "#b87333",
      assembler_advanced: "#a020f0",
    };

    ctx.fillStyle = colors[m.type as MachineType] || "#fff";
    ctx.fillRect(m.x - 15, m.y - 15, 30, 30);

    let i = 0;
    for (const res of Object.keys(
      m.inventory,
    ) as (keyof typeof m.inventory)[]) {
      const count = m.inventory[res];
      if (count > 0) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(m.x - 10 + i * 8, m.y - 20, 3, 0, Math.PI * 2);
        ctx.fill();
        i++;
      }
    }

    ctx.fillStyle = "#333";
    ctx.fillRect(m.x - 15, m.y + 18, 30, 4);
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(m.x - 15, m.y + 18, (m.progress / 100) * 30, 4);
  }

  private updateOverlay(
    snapshot: Snapshot<FactoryModel>,
    metrics: { tickTime: number; fps: number },
  ) {
    const overlay = document.getElementById("ui-overlay");
    if (overlay) {
      overlay.innerHTML = `

        <div class="metric" style="color: #ffcc00; font-size: 1.2em; font-weight: bold; border-left-color: #ffcc00;">Credits: $${snapshot.credits}</div>
      <div class="metric">Bots: ${Object.keys(snapshot.bots).length}</div>
      <div class="metric">Machines: ${Object.keys(snapshot.machines).length}</div>
      <div class="metric">Tick Time: ${metrics.tickTime.toFixed(2)}ms</div>
      <div class="metric">FPS: ${metrics.fps}</div>
    `;
    }
  }
}
