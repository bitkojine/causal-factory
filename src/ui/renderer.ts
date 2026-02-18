import { Snapshot } from '@causaloop/core';
import { FactoryModel, MachineType } from '../core/types.js';
import { __CAUSALOOP_DEV_IDENTITY__ } from '@causaloop/core';

export class CanvasRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

    constructor(containerId: string) {
        const container = document.getElementById(containerId);
        if (!container) throw new Error('Container not found');

        this.canvas = document.createElement('canvas');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        container.appendChild(this.canvas);

        this.ctx = this.canvas.getContext('2d', { alpha: false })!;

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }

    public render(snapshot: Snapshot<FactoryModel>, metrics: { tickTime: number; fps: number }) {
        const { ctx } = this;
        ctx.fillStyle = '#101010'; // Darker background
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw Grid (subtle)
        ctx.strokeStyle = '#222';
        ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 40) {
            ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height);
        }
        for (let y = 0; y < this.canvas.height; y += 40) {
            ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y);
        }
        ctx.stroke();

        // Render machines
        for (const id in snapshot.machines) {
            const m = snapshot.machines[id];
            this.drawMachine(m);
        }

        // Render bots (batched)
        ctx.fillStyle = '#ffcc00';
        for (const bot of snapshot.bots) {
            if (bot.payload) {
                ctx.fillStyle = '#00ff00'; // Carrying
                ctx.fillRect(bot.x - 3, bot.y - 3, 6, 6);
            } else {
                ctx.fillStyle = '#ffcc00';
                ctx.fillRect(bot.x - 2, bot.y - 2, 4, 4);
            }
        }

        // Update overlay
        this.updateOverlay(snapshot, metrics);
    }

    private drawMachine(m: any) {
        const ctx = this.ctx;
        const colors: Record<MachineType, string> = {
            extractor: '#4a9eff',
            smelter: '#ff8c00',
            assembler: '#a020f0',
            sink: '#ff4a4a'
        };

        ctx.fillStyle = colors[m.type as MachineType] || '#fff';
        ctx.fillRect(m.x - 15, m.y - 15, 30, 30);

        // Inventory dots
        let i = 0;
        for (const res in m.inventory) {
            const count = m.inventory[res];
            if (count > 0) {
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(m.x - 10 + (i * 8), m.y - 20, 3, 0, Math.PI * 2);
                ctx.fill();
                i++;
            }
        }

        // Progress bar
        ctx.fillStyle = '#333';
        ctx.fillRect(m.x - 15, m.y + 18, 30, 4);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(m.x - 15, m.y + 18, (m.progress / 100) * 30, 4);
    }

    private updateOverlay(snapshot: Snapshot<FactoryModel>, metrics: { tickTime: number; fps: number }) {
        const overlay = document.getElementById('ui-overlay');
        if (overlay) {
            overlay.innerHTML = `
        <div class="metric" style="padding: 0; background: transparent; border: none;">
            <pre style="margin: 0; color: #ffcc00; line-height: 1; font-size: 8px; font-family: monospace;">${__CAUSALOOP_DEV_IDENTITY__}</pre>
        </div>
        <div class="metric" style="color: #ffcc00; font-size: 1.2em; font-weight: bold; border-left-color: #ffcc00;">Credits: $${snapshot.credits}</div>
      <div class="metric">Bots: ${snapshot.bots.length}</div>
      <div class="metric">Machines: ${Object.keys(snapshot.machines).length}</div>
      <div class="metric">Tick Time: ${metrics.tickTime.toFixed(2)}ms</div>
      <div class="metric">FPS: ${metrics.fps}</div>
    `;
        }
    }
}
