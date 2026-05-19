import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideArrowDownRight,
  LucideArrowUpRight,
  LucideCircleAlert,
  LucideGauge,
  LucideSlidersHorizontal,
  LucideSparkles,
  LucideTarget,
} from '@lucide/angular';

import { IsmsStore } from '../core/isms-store';

@Component({
  standalone: true,
  selector: 'app-criteria',
  imports: [
    FormsModule,
    LucideArrowDownRight,
    LucideArrowUpRight,
    LucideCircleAlert,
    LucideGauge,
    LucideSlidersHorizontal,
    LucideSparkles,
    LucideTarget,
  ],
  template: `
    <div class="px-10 pt-10 pb-24 max-w-[1280px] mx-auto">
      <!-- Page header -->
      <header class="pb-7 mb-8 border-b border-line-soft">
        <div class="flex items-center gap-3 flex-wrap mb-3">
          <h1 class="text-3xl font-semibold tracking-tight text-fg">Risk criteria configurator</h1>
          <span class="tok tok-default">ISO 27005 · 8.3</span>
        </div>
        <p class="text-[14.5px] leading-relaxed text-fg-2 max-w-[680px]">
          Set the 1-5 ordinal scales the rest of the workflow runs against, and define the
          <b class="text-fg">acceptance threshold</b> — the score where a risk shifts from acceptable to
          requiring treatment. The matrix below recomputes its severity tints from these signals in real time.
        </p>
      </header>

      <!-- 3-column layout: left scales | center matrix | right threshold -->
      <div class="grid grid-cols-[320px_minmax(0,1fr)_320px] gap-7">
        <!-- LEFT: scales -->
        <section class="flex flex-col gap-6">
          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideArrowUpRight class="w-3.5 h-3.5 text-accent"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Likelihood scale</div>
              <span class="ml-auto font-mono text-[10px] text-fg-4 tracking-wider">1 → 5</span>
            </div>
            <div class="flex flex-col">
              @for (point of store.likelihoodScale(); track point.value; let i = $index) {
                <label class="grid grid-cols-[28px_1fr] gap-3 items-center px-4 py-2.5 border-b border-line-soft last:border-b-0">
                  <span class="font-mono text-[11px] text-fg-3">{{ point.value }}</span>
                  <input
                    type="text"
                    class="bg-bg border border-line rounded-md px-2.5 h-8 text-[13px] text-fg outline-none focus:border-accent focus:shadow-[0_0_0_2px_var(--accent-dim)]"
                    [ngModel]="point.label"
                    (ngModelChange)="store.setLikelihoodLabel(i, $event)" />
                </label>
              }
            </div>
          </article>

          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideArrowDownRight class="w-3.5 h-3.5 text-warn"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Impact scale</div>
              <span class="ml-auto font-mono text-[10px] text-fg-4 tracking-wider">1 → 5</span>
            </div>
            <div class="flex flex-col">
              @for (point of store.impactScale(); track point.value; let i = $index) {
                <label class="grid grid-cols-[28px_1fr] gap-3 items-center px-4 py-2.5 border-b border-line-soft last:border-b-0">
                  <span class="font-mono text-[11px] text-fg-3">{{ point.value }}</span>
                  <input
                    type="text"
                    class="bg-bg border border-line rounded-md px-2.5 h-8 text-[13px] text-fg outline-none focus:border-accent focus:shadow-[0_0_0_2px_var(--accent-dim)]"
                    [ngModel]="point.label"
                    (ngModelChange)="store.setImpactLabel(i, $event)" />
                </label>
              }
            </div>
          </article>
        </section>

        <!-- CENTER: matrix -->
        <section>
          <div class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideSparkles class="w-3.5 h-3.5 text-accent"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Risk matrix · {{ store.likelihoodMax() }}×{{ store.impactMax() }}</div>
              <span class="ml-auto font-mono text-[10px] text-fg-4 tracking-wider">Score = L × I</span>
            </div>

            <div class="p-6 preview-grid">
              <div class="grid grid-cols-[18px_104px_minmax(0,1fr)] gap-x-3 items-stretch">
                <div class="flex items-center justify-center font-mono text-[9.5px] text-fg-4 tracking-[0.12em]"
                     style="writing-mode: vertical-rl; transform: rotate(180deg);">
                  LIKELIHOOD ↑
                </div>
                <div class="flex flex-col justify-around text-right">
                  @for (point of likelihoodReversed(); track point.value) {
                    <span class="text-[10.5px] text-fg-3 truncate" [title]="point.label">{{ point.label }}</span>
                  }
                </div>
                <div class="grid grid-cols-5 grid-rows-5 gap-1.5">
                  @for (cell of cells(); track cell.key) {
                    <div class="aspect-square grid place-items-center rounded-md text-[13px] font-semibold transition relative"
                         [class]="cell.tierClass"
                         [class.ring-2]="cell.score === currentSelected()"
                         [class.ring-accent]="cell.score === currentSelected()">
                      <span>{{ cell.score }}</span>
                      @if (cell.breaches) {
                        <span class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-danger"></span>
                      }
                    </div>
                  }
                </div>
              </div>

              <div class="grid grid-cols-[18px_104px_minmax(0,1fr)] gap-x-3 mt-3">
                <div></div><div></div>
                <div class="grid grid-cols-5 gap-1.5 text-[10.5px] text-fg-3 text-center">
                  @for (point of store.impactScale(); track point.value) {
                    <span class="truncate" [title]="point.label">{{ point.label }}</span>
                  }
                </div>
              </div>
              <div class="grid grid-cols-[18px_104px_minmax(0,1fr)] gap-x-3 mt-1">
                <div></div><div></div>
                <div class="text-center font-mono text-[9.5px] text-fg-4 tracking-[0.12em]">IMPACT →</div>
              </div>
            </div>

            <!-- Severity legend -->
            <div class="px-5 py-4 border-t border-line-soft grid grid-cols-2 gap-2.5">
              @for (tier of tierLegend(); track tier.key) {
                <div class="flex items-center gap-2.5 px-3 py-2 rounded-md border border-line-soft bg-bg-2">
                  <span class="w-3 h-3 rounded-sm" [style.background]="tier.swatch"></span>
                  <span class="text-[12.5px] text-fg-2">{{ tier.label }}</span>
                  <span class="ml-auto font-mono text-[11px] text-fg-4">{{ tier.range }}</span>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- RIGHT: threshold & summary -->
        <section class="flex flex-col gap-6">
          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideTarget class="w-3.5 h-3.5 text-danger"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Acceptance threshold</div>
            </div>
            <div class="px-5 py-5">
              <div class="flex items-baseline justify-between mb-3">
                <div class="text-[10.5px] font-mono tracking-[0.12em] text-fg-4">UNACCEPTABLE AT OR ABOVE</div>
                <div class="font-mono text-[18px] font-semibold text-fg">
                  {{ store.acceptanceThreshold() }}
                  <span class="text-fg-4 text-[11px]">/ {{ store.maxScore() }}</span>
                </div>
              </div>
              <input type="range"
                     class="brand"
                     min="2"
                     [max]="store.maxScore()"
                     [ngModel]="store.acceptanceThreshold()"
                     (ngModelChange)="store.setThreshold(+$event)"
                     [style.--pct.%]="sliderPct()" />
              <div class="flex items-center justify-between mt-2 text-[10.5px] font-mono text-fg-4">
                <span>2 · Acceptable</span>
                <span>{{ store.maxScore() }} · Critical</span>
              </div>

              <div class="mt-5 p-3 rounded-md border border-line-soft bg-bg-2 text-[12.5px] text-fg-2 leading-snug">
                <div class="flex items-start gap-2">
                  <svg lucideCircleAlert class="w-3.5 h-3.5 mt-0.5 shrink-0 text-warn"></svg>
                  <div>
                    Risks scoring <b class="text-fg">{{ store.acceptanceThreshold() }}+</b> are routed to the
                    Treatment Plan and force an ISO 27005 treatment decision.
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideGauge class="w-3.5 h-3.5 text-info"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Calibration summary</div>
            </div>
            <dl class="divide-y divide-line-soft">
              <div class="flex items-center justify-between px-5 py-2.5">
                <dt class="text-[12.5px] text-fg-3">Max possible score</dt>
                <dd class="font-mono text-[12px] text-fg">{{ store.maxScore() }}</dd>
              </div>
              <div class="flex items-center justify-between px-5 py-2.5">
                <dt class="text-[12.5px] text-fg-3">Cells unacceptable</dt>
                <dd class="font-mono text-[12px]"
                    [class.text-danger]="breachingCells() > 0"
                    [class.text-fg]="breachingCells() === 0">
                  {{ breachingCells() }} / {{ totalCells() }}
                </dd>
              </div>
              <div class="flex items-center justify-between px-5 py-2.5">
                <dt class="text-[12.5px] text-fg-3">Threshold ratio</dt>
                <dd class="font-mono text-[12px] text-fg">{{ thresholdRatio() }}%</dd>
              </div>
              <div class="flex items-center justify-between px-5 py-2.5">
                <dt class="text-[12.5px] text-fg-3">Register risks above</dt>
                <dd class="font-mono text-[12px]"
                    [class.text-danger]="store.registerSummary().breaching > 0"
                    [class.text-fg]="store.registerSummary().breaching === 0">
                  {{ store.registerSummary().breaching }} / {{ store.registerSummary().total }}
                </dd>
              </div>
            </dl>
          </article>

          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideSlidersHorizontal class="w-3.5 h-3.5 text-fg-3"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Quick presets</div>
            </div>
            <div class="px-3 py-3 flex flex-col gap-1.5">
              @for (preset of presets; track preset.value) {
                <button class="flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-bg-2 text-left transition-colors"
                        [class.bg-bg-2]="store.acceptanceThreshold() === preset.value"
                        (click)="store.setThreshold(preset.value)">
                  <span class="flex flex-col">
                    <span class="text-[12.5px] text-fg">{{ preset.label }}</span>
                    <span class="text-[10.5px] text-fg-4">{{ preset.hint }}</span>
                  </span>
                  <span class="font-mono text-[12px] text-fg-2">≥ {{ preset.value }}</span>
                </button>
              }
            </div>
          </article>
        </section>
      </div>
    </div>
  `,
})
export class CriteriaView {
  readonly store = inject(IsmsStore);

  readonly presets = [
    { value: 6, label: 'Conservative', hint: 'Highly regulated · zero-tolerance scope' },
    { value: 10, label: 'Balanced', hint: 'Default ISO 27001 calibration' },
    { value: 15, label: 'Aggressive', hint: 'Mature program · larger appetite' },
  ];

  readonly likelihoodReversed = computed(() =>
    [...this.store.likelihoodScale()].reverse(),
  );

  readonly cells = computed(() => {
    const out: { key: string; score: number; tierClass: string; breaches: boolean }[] = [];
    const likelihoods = [...this.store.likelihoodScale()].reverse();
    for (const l of likelihoods) {
      for (const i of this.store.impactScale()) {
        const score = l.value * i.value;
        out.push({
          key: `${l.value}-${i.value}`,
          score,
          tierClass: this.store.severityClass(score),
          breaches: score >= this.store.acceptanceThreshold(),
        });
      }
    }
    return out;
  });

  readonly totalCells = computed(
    () => this.store.likelihoodMax() * this.store.impactMax(),
  );

  readonly breachingCells = computed(
    () => this.cells().filter((c) => c.breaches).length,
  );

  readonly thresholdRatio = computed(() =>
    Math.round((this.store.acceptanceThreshold() / this.store.maxScore()) * 100),
  );

  readonly sliderPct = computed(() => {
    const t = this.store.acceptanceThreshold();
    const max = this.store.maxScore();
    return Math.round(((t - 2) / (max - 2)) * 100);
  });

  readonly currentSelected = computed(() => this.store.acceptanceThreshold());

  readonly tierLegend = computed(() => {
    const max = this.store.maxScore();
    const t = this.store.acceptanceThreshold();
    const critFloor = Math.max(t, Math.ceil(max * 0.65));
    return [
      {
        key: 'low',
        label: 'Low',
        swatch: 'var(--accent)',
        range: `1 – ${Math.max(1, Math.max(4, Math.ceil(t * 0.5)) - 1)}`,
      },
      {
        key: 'medium',
        label: 'Medium',
        swatch: 'var(--warn)',
        range: `${Math.max(4, Math.ceil(t * 0.5))} – ${t - 1}`,
      },
      {
        key: 'high',
        label: 'High',
        swatch: '#e5985a',
        range: `${t} – ${Math.max(t, critFloor - 1)}`,
      },
      {
        key: 'critical',
        label: 'Critical',
        swatch: 'var(--danger)',
        range: `${critFloor} – ${max}`,
      },
    ];
  });
}
