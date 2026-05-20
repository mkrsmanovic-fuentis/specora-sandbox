import { UpperCasePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideCircleAlert,
  LucideExternalLink,
  LucideGauge,
  LucideGlobe2,
  LucideLink2,
  LucidePlus,
  LucideShieldCheck,
  LucideSparkles,
  LucideTarget,
  LucideX,
} from '@lucide/angular';

import {
  IMPACT_DIM_LABELS,
  IsmsStore,
  TREATMENT_DESCRIPTIONS,
  TREATMENT_LABELS,
} from '../core/isms-store';
import {
  IMPACT_DIM_KEYS,
  ImpactDimension,
  ImpactScores,
  PlannedControl,
  ScaleValue,
  TreatmentOption,
  overallImpact,
} from '../core/models';

@Component({
  standalone: true,
  selector: 'app-treatment',
  imports: [
    FormsModule,
    UpperCasePipe,
    LucideCircleAlert,
    LucideExternalLink,
    LucideGauge,
    LucideGlobe2,
    LucideLink2,
    LucidePlus,
    LucideShieldCheck,
    LucideSparkles,
    LucideTarget,
    LucideX,
  ],
  template: `
    <div class="px-10 pt-10 pb-24 max-w-[1480px] mx-auto">
      <header class="pb-7 mb-7 border-b border-line-soft flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <h1 class="text-3xl font-semibold tracking-tight text-fg">Risk treatment plan</h1>
            <span class="tok tok-default">ISO 27005 · 8.5</span>
          </div>
          <p class="text-[14px] leading-relaxed text-fg-2 max-w-[680px]">
            Every risk scoring at or above the acceptance threshold lands here automatically. Treatments
            captured in the wizard appear inline — modify the option, strategy, planned controls or
            residual estimate without leaving this view.
          </p>
        </div>

        <div class="grid grid-cols-3 gap-2 min-w-[460px]">
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">REQUIRING TREATMENT</div>
            <div class="text-[22px] font-semibold mt-0.5"
                 [class.text-danger]="store.treatableRisks().length > 0"
                 [class.text-fg]="store.treatableRisks().length === 0">
              {{ store.treatableRisks().length }}
            </div>
          </div>
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">PLANS DEFINED</div>
            <div class="text-[22px] font-semibold text-fg mt-0.5">{{ definedCount() }}</div>
          </div>
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">RESIDUAL ABOVE THR.</div>
            <div class="text-[22px] font-semibold mt-0.5"
                 [class.text-warn]="residualBreaching() > 0"
                 [class.text-fg]="residualBreaching() === 0">
              {{ residualBreaching() }}
            </div>
          </div>
        </div>
      </header>

      @if (store.treatableRisks().length === 0) {
        <section class="rounded-xl border border-dashed border-line-soft bg-surface p-12 text-center">
          <div class="w-12 h-12 mx-auto rounded-full grid place-items-center bg-bg-2 text-accent mb-4">
            <svg lucideShieldCheck class="w-5 h-5"></svg>
          </div>
          <h2 class="text-[16px] font-semibold text-fg">Every risk is within appetite</h2>
          <p class="text-[13px] text-fg-3 max-w-[480px] mx-auto mt-2 leading-relaxed">
            No risk scores at or above the current acceptance threshold
            (<span class="font-mono text-fg">{{ store.acceptanceThreshold() }}</span>).
            Adjust the threshold in Risk Methodology or add a new risk.
          </p>
        </section>
      } @else {
        <section class="flex flex-col gap-5">
          @for (risk of store.treatableRisks(); track risk.id) {
            <article class="rounded-xl border border-line-soft bg-surface overflow-hidden"
                     [class.review-border]="risk.reviewRequired">

              <!-- Risk header -->
              <header class="px-6 py-4 border-b border-line-soft bg-bg-2 grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-mono text-[11px] tracking-[0.08em] text-fg-3">{{ risk.id }}</span>
                    @if (risk.reviewRequired) {
                      <span class="pill pill-warn"><span class="dot"></span>Review required</span>
                    }
                    <span class="pill"
                          [style.background]="severityPillBg(risk.score)"
                          [style.color]="severityPillFg(risk.score)"
                          [style.borderColor]="severityPillBorder(risk.score)">
                      <span class="dot"></span>{{ store.severityLabel(risk.score) }}
                    </span>
                  </div>
                  <div class="text-[16px] font-semibold text-fg">
                    {{ riskHeadline(risk) }}
                  </div>
                  <div class="text-[12.5px] text-fg-3 mt-1 leading-snug">
                    {{ risk.vulnerability }} — {{ risk.impactDescription }}
                  </div>
                  <div class="mt-1.5 flex items-center gap-2 flex-wrap text-[10.5px] font-mono text-fg-4">
                    <span class="text-fg-3">AFFECTS</span>
                    @if (risk.scopeWide) {
                      <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px]"
                            style="background: var(--accent-dim); color: var(--accent);">
                        <svg lucideGlobe2 class="w-3 h-3"></svg>SCOPE-WIDE
                      </span>
                    } @else {
                      @for (id of risk.affects; track id) {
                        <span class="px-1.5 py-0.5 rounded border border-line-soft bg-surface text-fg-2">{{ id }}</span>
                      }
                    }
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <div class="text-right">
                    <div class="font-mono text-[9.5px] tracking-[0.12em] text-fg-4">INHERENT</div>
                    <div class="font-mono text-[11px] text-fg-3 mt-0.5">
                      L {{ risk.likelihood }} · max(C,I,A,F)={{ risk.overallImpact }}
                    </div>
                  </div>
                  <span class="inline-flex items-center justify-center w-14 h-14 rounded-md font-mono text-[20px] font-semibold"
                        [class]="store.severityClass(risk.score)">
                    {{ risk.score }}
                  </span>
                </div>
              </header>

              <!-- Body grid -->
              <div class="grid grid-cols-[280px_minmax(0,1fr)_320px]">

                <!-- Treatment option -->
                <div class="px-6 py-5 border-r border-line-soft">
                  <div class="flex items-center gap-2 mb-3">
                    <svg lucideTarget class="w-3.5 h-3.5 text-accent"></svg>
                    <div class="text-[11px] font-mono tracking-[0.12em] text-fg-4">TREATMENT</div>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    @for (option of options; track option.value) {
                      <label class="flex items-start gap-2.5 px-2.5 py-2 rounded-md cursor-pointer"
                             [class.selected-opt]="currentOption(risk.id) === option.value"
                             [class.unselected-opt]="currentOption(risk.id) !== option.value">
                        <input type="radio"
                               class="tbl-check mt-0.5 shrink-0"
                               [checked]="currentOption(risk.id) === option.value"
                               (change)="setOption(risk.id, option.value)" />
                        <span class="min-w-0">
                          <span class="block text-[12.5px] text-fg leading-tight">{{ option.label }}</span>
                          <span class="block text-[10.5px] text-fg-4 leading-snug mt-0.5">{{ option.hint }}</span>
                        </span>
                      </label>
                    }
                  </div>
                </div>

                <!-- Strategy + planned controls -->
                <div class="px-6 py-5 border-r border-line-soft">
                  <div class="flex items-center gap-2 mb-3">
                    <svg lucideShieldCheck class="w-3.5 h-3.5 text-info"></svg>
                    <div class="text-[11px] font-mono tracking-[0.12em] text-fg-4">ACTION STRATEGY</div>
                  </div>
                  <textarea
                    class="bare"
                    rows="3"
                    placeholder="Describe the control change, the steps required, and the owner responsible…"
                    [ngModel]="strategy(risk.id)"
                    (ngModelChange)="store.setTreatment(risk.id, { strategy: $event })"></textarea>

                  <div class="mt-3 grid grid-cols-2 gap-3">
                    <label class="flex flex-col gap-1">
                      <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">TARGET DATE</span>
                      <div class="input-shell h-8">
                        <input type="date"
                               class="bg-transparent border-0 outline-none px-3 text-[12.5px] text-fg h-full"
                               [ngModel]="targetDate(risk.id)"
                               (ngModelChange)="store.setTreatment(risk.id, { targetDate: $event })" />
                      </div>
                    </label>
                    <label class="flex flex-col gap-1">
                      <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">REVIEW DUE DATE</span>
                      <div class="input-shell h-8">
                        <input type="date"
                               class="bg-transparent border-0 outline-none px-3 text-[12.5px] text-fg h-full"
                               [ngModel]="reviewDueDate(risk.id)"
                               (ngModelChange)="store.setTreatment(risk.id, { reviewDueDate: $event })" />
                      </div>
                    </label>
                  </div>

                  @if (currentOption(risk.id) === 'modify') {
                    <div class="mt-4">
                      <div class="flex items-center gap-2 mb-2">
                        <svg lucideLink2 class="w-3.5 h-3.5 text-accent"></svg>
                        <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">
                          PLANNED CONTROLS · ISO 27001:2022 ANNEX A · {{ plannedControls(risk.id).length }} mapped
                        </div>
                      </div>

                      @if (plannedControls(risk.id).length > 0) {
                        <div class="flex flex-wrap gap-1.5 mb-2">
                          @for (pc of plannedControls(risk.id); track pc.id) {
                            <span class="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-0.5 rounded border border-line-soft bg-bg-2 text-fg-2">
                              <span class="font-mono text-[10.5px]">{{ pc.id }}</span>
                              <span class="text-[11px]">{{ pc.title }}</span>
                              <button class="btn-iconplain w-5 h-5" aria-label="Remove"
                                      (click)="removePlanned(risk.id, pc.id)">
                                <svg lucideX class="w-3 h-3"></svg>
                              </button>
                            </span>
                          }
                        </div>
                      } @else {
                        <div class="text-[11.5px] text-warn mb-2">
                          Modify treatments need at least one planned control.
                        </div>
                      }

                      <div class="flex items-center gap-2">
                        <select class="bare bare-sm flex-1"
                                #picker
                                (change)="addPlanned(risk.id, picker.value, picker); picker.value = ''">
                          <option value="">+ Add planned Annex A control…</option>
                          @for (control of unmappedControls(risk.id); track control.id) {
                            <option [value]="control.id">{{ control.id }} · {{ control.title }}</option>
                          }
                        </select>
                        <button class="btn-ghost h-7 text-[11.5px]" (click)="goToSoa()" title="Open SoA">
                          <svg lucideExternalLink class="w-3 h-3"></svg>
                          SoA
                        </button>
                      </div>
                    </div>
                  }

                  <label class="flex flex-col gap-1 mt-3">
                    <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">ACCEPTANCE RATIONALE</span>
                    <textarea class="bare" rows="2"
                              placeholder="Why is the residual risk acceptable?"
                              [ngModel]="rationale(risk.id)"
                              (ngModelChange)="store.setTreatment(risk.id, { acceptanceRationale: $event })"></textarea>
                  </label>
                </div>

                <!-- Residual -->
                <div class="px-6 py-5">
                  <div class="flex items-center gap-2 mb-3">
                    <svg lucideGauge class="w-3.5 h-3.5 text-warn"></svg>
                    <div class="text-[11px] font-mono tracking-[0.12em] text-fg-4">RESIDUAL ESTIMATE</div>
                  </div>

                  <label class="flex flex-col gap-1 mb-3">
                    <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">LIKELIHOOD</span>
                    <select class="bare bare-sm"
                            [ngModel]="residualL(risk.id)"
                            (ngModelChange)="setResidualL(risk.id, $event)">
                      @for (point of store.likelihoodScale(); track point.value) {
                        <option [ngValue]="point.value">{{ point.value }} · {{ point.label }}</option>
                      }
                    </select>
                  </label>

                  <div class="rounded-md border border-line-soft bg-bg-2 px-3 py-2.5">
                    <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4 mb-1.5">IMPACT (C·I·A·F)</div>
                    <div class="grid grid-cols-4 gap-1.5">
                      @for (key of dimKeys; track key) {
                        <label class="flex flex-col items-center">
                          <span class="font-mono text-[9.5px] text-fg-4">{{ key | uppercase }}</span>
                          <select class="bare bare-sm w-full text-center"
                                  [ngModel]="residualImpactDim(risk.id, key)"
                                  (ngModelChange)="setResidualImpact(risk.id, key, $event)">
                            @for (point of store.impactScale(); track point.value) {
                              <option [ngValue]="point.value">{{ point.value }}</option>
                            }
                          </select>
                        </label>
                      }
                    </div>
                  </div>

                  <div class="mt-4 rounded-lg border border-line-soft bg-bg-2 p-3 flex items-center gap-3">
                    <span class="inline-flex items-center justify-center w-12 h-12 rounded-md font-mono text-[16px] font-semibold"
                          [class]="store.severityClass(residualScore(risk.id))">
                      {{ residualScore(risk.id) }}
                    </span>
                    <div class="min-w-0">
                      <div class="font-mono text-[9.5px] tracking-[0.12em] text-fg-4">RESIDUAL SCORE</div>
                      <div class="text-[12.5px] text-fg-2 leading-snug">
                        {{ store.severityLabel(residualScore(risk.id)) }} · Δ
                        <span class="font-mono"
                              [class.text-accent]="residualScore(risk.id) < risk.score"
                              [class.text-danger]="residualScore(risk.id) >= risk.score">
                          {{ residualScore(risk.id) - risk.score >= 0 ? '+' : '' }}{{ residualScore(risk.id) - risk.score }}
                        </span>
                      </div>
                    </div>
                  </div>

                  @if (residualScore(risk.id) >= store.acceptanceThreshold()) {
                    <div class="mt-3 flex items-start gap-2 text-[11.5px] text-warn">
                      <svg lucideCircleAlert class="w-3.5 h-3.5 mt-0.5 shrink-0"></svg>
                      <span>Residual still above threshold — escalate or strengthen mitigation.</span>
                    </div>
                  } @else {
                    <div class="mt-3 flex items-start gap-2 text-[11.5px] text-accent">
                      <svg lucideSparkles class="w-3.5 h-3.5 mt-0.5 shrink-0"></svg>
                      <span>Brings risk within appetite.</span>
                    </div>
                  }
                </div>
              </div>
            </article>
          }
        </section>
      }
    </div>
  `,
  styles: [
    `
      .review-border { box-shadow: inset 3px 0 0 var(--warn); }
      .selected-opt {
        background: var(--accent-dim);
        box-shadow: inset 0 0 0 1px rgb(140 240 200 / 0.30);
      }
      .unselected-opt:hover { background: var(--bg-2); }
    `,
  ],
})
export class TreatmentView {
  readonly store = inject(IsmsStore);
  private readonly router = inject(Router);

  readonly dimKeys = IMPACT_DIM_KEYS;

  readonly options: { value: TreatmentOption; label: string; hint: string }[] = [
    { value: 'modify', label: TREATMENT_LABELS.modify, hint: TREATMENT_DESCRIPTIONS.modify },
    { value: 'avoid',  label: TREATMENT_LABELS.avoid,  hint: TREATMENT_DESCRIPTIONS.avoid },
    { value: 'share',  label: TREATMENT_LABELS.share,  hint: TREATMENT_DESCRIPTIONS.share },
    { value: 'retain', label: TREATMENT_LABELS.retain, hint: TREATMENT_DESCRIPTIONS.retain },
  ];

  readonly definedCount = computed(() => {
    const map = this.store.treatmentsByRisk();
    return this.store.treatableRisks().filter((r) => {
      const t = map.get(r.id);
      return !!t && !!t.strategy.trim();
    }).length;
  });

  readonly residualBreaching = computed(() => {
    const t = this.store.acceptanceThreshold();
    return this.store.treatableRisks().filter((r) => this.residualScore(r.id) >= t).length;
  });

  riskHeadline(risk: { affects: string[]; scopeWide: boolean; threats: string[] }): string {
    const assetPart = risk.scopeWide
      ? 'Scope-wide'
      : risk.affects.map((id) => this.store.inventoryById().get(id)?.name ?? id).join(' / ') || 'Unlinked';
    const threatPart = risk.threats
      .map((id) => this.store.threatsById().get(id)?.title ?? id)
      .join(' · ') || 'Untagged threat';
    return `${assetPart} · ${threatPart}`;
  }

  currentOption(riskId: string): TreatmentOption {
    return this.store.treatmentsByRisk().get(riskId)?.option ?? 'modify';
  }
  setOption(riskId: string, option: TreatmentOption) {
    if (option === 'modify') {
      this.store.setTreatment(riskId, { option });
    } else {
      this.store.setTreatment(riskId, { option, plannedControls: [] });
    }
  }
  strategy(riskId: string): string {
    return this.store.treatmentsByRisk().get(riskId)?.strategy ?? '';
  }
  targetDate(riskId: string): string {
    return this.store.treatmentsByRisk().get(riskId)?.targetDate ?? '';
  }
  reviewDueDate(riskId: string): string {
    return this.store.treatmentsByRisk().get(riskId)?.reviewDueDate ?? '';
  }
  rationale(riskId: string): string {
    return this.store.treatmentsByRisk().get(riskId)?.acceptanceRationale ?? '';
  }
  plannedControls(riskId: string): PlannedControl[] {
    return this.store.treatmentsByRisk().get(riskId)?.plannedControls ?? [];
  }
  unmappedControls(riskId: string) {
    const mapped = new Set(this.plannedControls(riskId).map((pc) => pc.id));
    return this.store.controls().filter((c) => c.applicable && !mapped.has(c.id));
  }
  addPlanned(riskId: string, controlId: string, picker: HTMLSelectElement) {
    if (!controlId) return;
    const ctrl = this.store.controlsById().get(controlId);
    if (!ctrl) return;
    const next: PlannedControl[] = [
      ...this.plannedControls(riskId),
      { id: ctrl.id, framework: 'ISO 27001:2022 Annex A', title: ctrl.title },
    ];
    this.store.setTreatment(riskId, { plannedControls: next });
    picker.value = '';
  }
  removePlanned(riskId: string, controlId: string) {
    const next = this.plannedControls(riskId).filter((pc) => pc.id !== controlId);
    this.store.setTreatment(riskId, { plannedControls: next });
  }

  residualL(riskId: string): ScaleValue {
    return this.store.treatmentsByRisk().get(riskId)?.residualLikelihood ?? 1;
  }
  residualImpactScores(riskId: string): ImpactScores {
    return this.store.treatmentsByRisk().get(riskId)?.residualImpact ?? { c: 1, i: 1, a: 1, f: 1 };
  }
  residualImpactDim(riskId: string, key: ImpactDimension): ScaleValue {
    return this.residualImpactScores(riskId)[key];
  }
  residualScore(riskId: string): number {
    return this.residualL(riskId) * overallImpact(this.residualImpactScores(riskId));
  }
  setResidualL(riskId: string, value: number | string) {
    this.store.setTreatment(riskId, { residualLikelihood: Number(value) as ScaleValue });
  }
  setResidualImpact(riskId: string, key: ImpactDimension, value: number | string) {
    const current = this.residualImpactScores(riskId);
    const next: ImpactScores = { ...current, [key]: Number(value) as ScaleValue };
    this.store.setTreatment(riskId, { residualImpact: next });
  }

  goToSoa() {
    this.router.navigate(['/soa']);
  }

  // Severity pill colors
  severityPillBg(score: number): string {
    switch (this.store.severity(score)) {
      case 'critical': return 'rgb(242 164 164 / 0.14)';
      case 'high':     return 'rgb(229 152 90 / 0.14)';
      case 'medium':   return 'rgb(240 201 135 / 0.14)';
      default:         return 'rgb(140 240 200 / 0.14)';
    }
  }
  severityPillFg(score: number): string {
    switch (this.store.severity(score)) {
      case 'critical': return 'var(--danger)';
      case 'high':     return '#e5985a';
      case 'medium':   return 'var(--warn)';
      default:         return 'var(--accent)';
    }
  }
  severityPillBorder(score: number): string {
    switch (this.store.severity(score)) {
      case 'critical': return 'rgb(242 164 164 / 0.28)';
      case 'high':     return 'rgb(229 152 90 / 0.28)';
      case 'medium':   return 'rgb(240 201 135 / 0.26)';
      default:         return 'rgb(140 240 200 / 0.22)';
    }
  }
}
