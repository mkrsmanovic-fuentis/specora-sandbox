import { TitleCasePipe, UpperCasePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideArrowDownRight,
  LucideArrowUpRight,
  LucideBookOpen,
  LucideCheckCircle2,
  LucideCircleAlert,
  LucideDownload,
  LucideGauge,
  LucideHistory,
  LucideShieldCheck,
  LucideTarget,
} from '@lucide/angular';

import { IsmsStore } from '../core/isms-store';
import { CustomizationLevel } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-methodology',
  imports: [
    FormsModule,
    TitleCasePipe,
    UpperCasePipe,
    LucideArrowDownRight,
    LucideArrowUpRight,
    LucideBookOpen,
    LucideCheckCircle2,
    LucideCircleAlert,
    LucideDownload,
    LucideGauge,
    LucideHistory,
    LucideShieldCheck,
    LucideTarget,
  ],
  template: `
    <div class="px-10 pt-10 pb-24 max-w-[1280px] mx-auto">

      <!-- Header -->
      <header class="pb-7 mb-7 border-b border-line-soft flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <h1 class="text-3xl font-semibold tracking-tight text-fg">Risk Methodology</h1>
            <span class="tok tok-default">{{ active().version }} · {{ active().status | titlecase }}</span>
            @if (active().customizationLevel === 'NONE') {
              <span class="tok tok-warn">Default · not customized</span>
            } @else {
              <span class="tok tok-ok">Customized · {{ active().customizationLevel }}</span>
            }
          </div>
          <p class="text-[14px] leading-relaxed text-fg-2 max-w-[680px]">
            The Specora default risk methodology defines how likelihood and the four impact dimensions
            (Confidentiality, Integrity, Availability, Financial) are scored. The overall impact used in
            the L × I matrix is computed as <code class="font-mono text-accent text-[12px]">MAX(C, I, A, F)</code>.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <button class="btn-secondary" (click)="exportPdf()">
            <svg lucideDownload class="w-3.5 h-3.5"></svg>
            Export PDF
          </button>
          <button class="btn-primary" (click)="customize()">
            <svg lucideShieldCheck class="w-3.5 h-3.5"></svg>
            {{ active().customizationLevel === 'NONE' ? 'Customize' : 'Continue customizing' }}
          </button>
        </div>
      </header>

      <!-- Customization banner (when NONE) -->
      @if (active().customizationLevel === 'NONE') {
        <div class="rounded-lg border bg-bg-2 px-4 py-3 mb-7 flex items-start gap-3"
             style="border-color: rgb(240 201 135 / 0.30); background: rgb(240 201 135 / 0.08);">
          <span class="w-7 h-7 grid place-items-center rounded-md bg-bg shrink-0"
                style="color: var(--warn);">
            <svg lucideCircleAlert class="w-4 h-4"></svg>
          </span>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] font-medium text-fg">You're using the Specora default risk methodology</div>
            <div class="text-[12px] text-fg-3 mt-0.5 leading-snug">
              Tailor the qualitative thresholds and impact dimensions to match your organisation's risk appetite.
              The current calibration is conservative.
            </div>
          </div>
          <button class="btn-ghost text-[12px]" (click)="customize()">
            Review now
          </button>
        </div>
      }

      <!-- Layout: scales + dims | side panel -->
      <div class="grid grid-cols-[minmax(0,1fr)_320px] gap-7">

        <div class="flex flex-col gap-7">

          <!-- Likelihood scale -->
          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideArrowUpRight class="w-3.5 h-3.5 text-accent"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Likelihood</div>
              <span class="font-mono text-[10px] text-fg-4 tracking-wider ml-2">5 ordinal steps</span>
              <span class="ml-auto font-mono text-[10px] text-fg-3 tracking-wider">P( occurs in 12m )</span>
            </div>
            <div class="divide-y divide-line-soft">
              @for (point of active().likelihoodDefs; track point.value) {
                <div class="grid grid-cols-[44px_140px_minmax(0,1fr)] gap-3 items-baseline px-5 py-3">
                  <span class="font-mono text-[15px] font-semibold text-fg">{{ point.value }}</span>
                  <span class="text-[13px] font-medium text-fg">{{ point.label }}</span>
                  <span class="text-[12.5px] text-fg-2 leading-snug">{{ point.description }}</span>
                </div>
              }
            </div>
          </article>

          <!-- Impact dimensions -->
          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideArrowDownRight class="w-3.5 h-3.5 text-warn"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Impact dimensions</div>
              <span class="font-mono text-[10px] text-fg-4 tracking-wider ml-2">
                4 dimensions · aggregated by MAX
              </span>
            </div>
            <div class="divide-y divide-line-soft">
              @for (dim of active().impactDims; track dim.key) {
                <section class="px-5 py-4">
                  <div class="flex items-baseline justify-between gap-3 mb-2">
                    <div>
                      <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">{{ dim.key | uppercase }}</div>
                      <div class="text-[14px] font-semibold text-fg leading-tight">{{ dim.label }}</div>
                    </div>
                    <div class="text-[12px] text-fg-3 max-w-[300px] text-right leading-snug">{{ dim.description }}</div>
                  </div>
                  <div class="grid grid-cols-5 gap-2 mt-2">
                    @for (point of dim.scale; track point.value) {
                      <div class="rounded-md border border-line-soft bg-bg-2 px-2.5 py-2">
                        <div class="flex items-baseline gap-1.5">
                          <span class="font-mono text-[13px] font-semibold text-fg">{{ point.value }}</span>
                          <span class="text-[11px] text-fg-2 truncate">{{ point.label }}</span>
                        </div>
                        <div class="text-[10.5px] text-fg-3 leading-snug mt-0.5 line-clamp-2">{{ point.description }}</div>
                      </div>
                    }
                  </div>
                </section>
              }
            </div>
          </article>

          <!-- Acceptance threshold -->
          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideTarget class="w-3.5 h-3.5 text-danger"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Acceptance threshold</div>
              <span class="ml-auto font-mono text-[10px] text-fg-3 tracking-wider">
                Score ≥ threshold → treatment required
              </span>
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
                     (ngModelChange)="onThreshold($event)"
                     [style.--pct.%]="sliderPct()" />
              <div class="flex items-center justify-between mt-2 text-[10.5px] font-mono text-fg-4">
                <span>2 · Acceptable</span>
                <span>{{ store.maxScore() }} · Critical</span>
              </div>
            </div>
          </article>

        </div>

        <!-- Side panel -->
        <aside class="flex flex-col gap-6">

          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideHistory class="w-3.5 h-3.5 text-info"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Version log</div>
            </div>
            <ul class="divide-y divide-line-soft">
              @for (m of store.methodologies(); track m.version) {
                <li class="px-5 py-3 flex items-start gap-2.5">
                  <span class="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        [style.background]="m.active ? 'var(--accent)' : m.status === 'draft' ? 'var(--warn)' : 'var(--fg-4)'"></span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-[13px] font-semibold text-fg">{{ m.version }}</span>
                      @if (m.active) {
                        <span class="font-mono text-[9.5px] tracking-wider text-accent">ACTIVE</span>
                      } @else {
                        <span class="font-mono text-[9.5px] tracking-wider text-fg-4">{{ m.status | uppercase }}</span>
                      }
                    </div>
                    <div class="font-mono text-[10.5px] text-fg-3 mt-0.5">Effective {{ m.effectiveFrom }}</div>
                    <div class="text-[11.5px] text-fg-2 leading-snug mt-1">
                      {{ m.customizationLevel === 'NONE' ? 'Default calibration' : m.customizationLevel + ' customisation' }}
                    </div>
                  </div>
                </li>
              }
            </ul>
          </article>

          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideGauge class="w-3.5 h-3.5 text-warn"></svg>
              <div class="text-[12.5px] font-semibold text-fg">Customisation level</div>
            </div>
            <div class="px-3 py-3 flex flex-col gap-1.5">
              @for (level of levels; track level.value) {
                <button class="flex items-center justify-between px-2.5 py-2 rounded-md hover:bg-bg-2 text-left transition-colors"
                        [class.bg-bg-2]="active().customizationLevel === level.value"
                        (click)="setLevel(level.value)">
                  <span class="flex flex-col">
                    <span class="text-[12.5px] text-fg">{{ level.label }}</span>
                    <span class="text-[10.5px] text-fg-4">{{ level.hint }}</span>
                  </span>
                  @if (active().customizationLevel === level.value) {
                    <svg lucideCheckCircle2 class="w-3.5 h-3.5 text-accent"></svg>
                  }
                </button>
              }
            </div>
          </article>

          <article class="rounded-xl border border-line-soft bg-surface overflow-hidden">
            <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-2">
              <svg lucideBookOpen class="w-3.5 h-3.5 text-fg-3"></svg>
              <div class="text-[12.5px] font-semibold text-fg">References</div>
            </div>
            <ul class="divide-y divide-line-soft">
              <li class="px-5 py-2.5 text-[11.5px] text-fg-2">ISO/IEC 27005:2022 — Information security risk management</li>
              <li class="px-5 py-2.5 text-[11.5px] text-fg-2">ISO/IEC 27001:2022 Annex A — Reference set of controls</li>
              <li class="px-5 py-2.5 text-[11.5px] text-fg-2">ISF IRAM2 — Threat catalogue</li>
              <li class="px-5 py-2.5 text-[11.5px] text-fg-2">BSI IT-Grundschutz — Elementary threats G.0.1 – G.0.47</li>
            </ul>
          </article>

        </aside>
      </div>
    </div>
  `,
})
export class MethodologyView {
  readonly store = inject(IsmsStore);

  readonly active = computed(() => this.store.activeMethodology());

  readonly levels: { value: CustomizationLevel; label: string; hint: string }[] = [
    { value: 'NONE',    label: 'None',    hint: 'Specora defaults only — auditor sees a generic posture.' },
    { value: 'PARTIAL', label: 'Partial', hint: 'Some thresholds adapted to organisation context.' },
    { value: 'FULL',    label: 'Full',    hint: 'Likelihood, impact dimensions and threshold fully tailored.' },
  ];

  readonly sliderPct = computed(() => {
    const t = this.store.acceptanceThreshold();
    const max = this.store.maxScore();
    return Math.round(((t - 2) / (max - 2)) * 100);
  });

  onThreshold(value: number | string) {
    this.store.setThreshold(+value);
  }

  setLevel(level: CustomizationLevel) {
    this.store.setCustomizationLevel(level);
  }

  customize() {
    // For the demo, bumping the level signals customisation intent.
    if (this.active().customizationLevel === 'NONE') this.store.setCustomizationLevel('PARTIAL');
  }

  exportPdf() {
    window.print();
  }
}
