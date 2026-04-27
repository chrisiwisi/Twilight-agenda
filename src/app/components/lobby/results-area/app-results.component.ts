import { Component, inject, computed, effect, ElementRef, viewChild } from '@angular/core';
import { Chart } from 'chart.js/auto';
import {VotingService} from "../../../services/vote.service";

@Component({
  selector: 'app-results',
  template: `
        <div class="metrics">
            <div class="metric-card">
                <p class="metric-label">total influence</p>
                <p class="metric-value">{{ chartData().total }}</p>
            </div>
            <div class="metric-card">
                <p class="metric-label">winning choice</p>
                <p class="metric-value">{{ chartData().winner }}</p>
            </div>
        </div>
        <div class="chart-wrapper">
            <canvas #chart role="img" aria-label="Vote results by influence"></canvas>
        </div>
    `,
  styles: [`
        .metrics {
            display: flex;
            gap: 16px;
            margin-bottom: 1.5rem;
        }
        .metric-card {
            flex: 1;
            background: var(--nz-color-bg-container-secondary, #fafafa);
            border-radius: 8px;
            padding: 1rem;
        }
        .metric-label {
            font-size: 13px;
            color: var(--nz-color-text-description);
            margin: 0 0 4px;
        }
        .metric-value {
            font-size: 24px;
            font-weight: 500;
            margin: 0;
        }
        .chart-wrapper {
            position: relative;
            width: 100%;
            height: 280px;
        }
    `],
})
export class ResultsComponent {
  private votingService = inject(VotingService);
  private chartCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chart');
  private chartInstance: Chart | null = null;

  private readonly colors = ['#1D9E75', '#534AB7', '#888780', '#D85A30', '#D4537E', '#378ADD'];

  chartData = computed(() => {
    const raw = this.votingService.vote()?.results;
    if (!raw) return { labels: [], data: [], total: 0, winner: '—' };
    const labels = Object.keys(raw).sort((a, b) => raw[b] - raw[a]);
    const data = labels.map(l => raw[l]);
    const total = data.reduce((a, b) => a + b, 0);
    return { labels, data, total, winner: labels[0] ?? '—' };
  });

  constructor() {
    effect(() => {
      const { labels, data } = this.chartData();
      if (!labels.length) return;

      if (this.chartInstance) {
        this.chartInstance.data.labels = labels;
        this.chartInstance.data.datasets[0].data = data;
        this.chartInstance.update();
        return;
      }

      this.chartInstance = new Chart(this.chartCanvas().nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Influence',
            data,
            backgroundColor: labels.map((_, i) => this.colors[i % this.colors.length] + 'CC'),
            borderColor: labels.map((_, i) => this.colors[i % this.colors.length]),
            borderWidth: 1.5,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 900, easing: 'easeOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                  return ` ${ctx.parsed.y} influence (${Math.round(ctx.parsed.y ?? 0 / total * 100)}%)`;
                }
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true }
          }
        }
      });
    });
  }
}