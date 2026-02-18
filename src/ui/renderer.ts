import { Snapshot } from '@causaloop/core';
import { FactoryModel } from '../core/types.js';

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
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Render machines
        for (const id in snapshot.machines) {
            const m = snapshot.machines[id];
            ctx.fillStyle = m.type === 'extractor' ? '#4a9eff' : '#ff4a4a';
            ctx.fillRect(m.x - 10, m.y - 10, 20, 20);

            // Progress bar
            ctx.fillStyle = '#333';
            ctx.fillRect(m.x - 10, m.y + 12, 20, 4);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(m.x - 10, m.y + 12, (m.progress / 100) * 20, 4);
        }

        // Render bots
        ctx.fillStyle = '#ffcc00';
        for (const bot of snapshot.bots) {
            ctx.fillRect(bot.x - 2, bot.y - 2, 4, 4);
        }

        // Update overlay
        this.updateOverlay(snapshot, metrics);
    }

    private updateOverlay(snapshot: Snapshot<FactoryModel>, metrics: { tickTime: number; fps: number }) {
        const overlay = document.getElementById('ui-overlay');
        if (!overlay) return;
        overlay.innerHTML = `
      <div class="metric">Bots: ${snapshot.bots.length}</div>
      <div class="metric">Tick Time: ${metrics.tickTime.toFixed(2)}ms</div>
      <div class="metric">FPS: ${metrics.fps}</div>
      <div class="metric">Ticks: ${snapshot.tickCount}</div>
    `;
    }
}
