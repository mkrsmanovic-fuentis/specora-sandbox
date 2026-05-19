import { Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideCircleAlert,
  LucideExternalLink,
  LucideGauge,
  LucideLink2,
  LucideShieldCheck,
  LucideSparkles,
  LucideTarget,
} from '@lucide/angular';

import { IsmsStore, TREATMENT_DESCRIPTIONS, TREATMENT_LABELS } from '../core/isms-store';
import { ScaleValue, TreatmentOption } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-treatment',
  imports: [
    FormsModule,
    LucideCircleAlert,
    LucideExternalLink,
    LucideGauge,
    LucideLink2,
    LucideShieldCheck,
    LucideSparkles,
    LucideTarget,
  ],
  template: `
    <div class="px-10 pt-10 pb-24 max-w-[1480px] mx-auto">
      <!-- Page header -->
      <header class="pb-7 mb-7 border-b border-line-soft flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <h1 class="text-3xl font-semibold tracking-tight text-fg">Risk treatment plan</h1>
            <span class="tok tok-default">ISO 27005 · 8.5</span>
          </div>
          <p class="text-[14px] leading-relaxed text-fg-2 max-w-[680px]">
            Every risk scoring at or above the acceptance threshold lands here automatically. Pick a treatment
            option, write the strategy, and set residual likelihood and impact — the residual score recomputes
            with the same <code class="font-mono text-accent text-[12px]">L × I</code> formula.
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
            (<span class="font-mono text-fg">{{ store.acceptanceThreshold() }}</span>). Lower the threshold from the criteria view
            or add a new risk to start populating the treatment plan.
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
                  <div class="text-[16px] font-semibold text-fg">{{ risk.asset }} · {{ risk.threat }}</div>
                  <div class="text-[12.5px] text-fg-3 mt-1 leading-snug">
                    {{ risk.vulnerability }} — {{ risk.impactDescription }}
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <div class="text-right">
                    <div class="font-mono text-[9.5px] tracking-[0.12em] text-fg-4">INHERENT</div>
                    <div class="font-mono text-[11px] text-fg-3 mt-0.5">L {{ risk.likelihood }} · I {{ risk.impact }}</div>
                  </div>
                  <span class="inline-flex items-center justify-center w-14 h-14 rounded-md font-mono text-[20px] font-semibold"
                        [class]="store.severityClass(risk.score)">
                    {{ risk.score }}
                  </span>
                </div>
              </header>

              <!-- Body grid: option | strategy | residual -->
              <div class="grid grid-cols-[280px_minmax(0,1fr)_280px]">
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

                <!-- Strategy + target date -->
                <div class="px-6 py-5 border-r border-line-soft">
                  <div class="flex items-center gap-2 mb-3">
                    <svg lucideShieldCheck class="w-3.5 h-3.5 text-info"></svg>
                    <div class="text-[11px] font-mono tracking-[0.12em] text-fg-4">ACTION STRATEGY</div>
                  </div>
                  <textarea
                    class="bare"
                    rows="4"
                    [placeholder]="strategyPlaceholder(risk.id)"
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
                      <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">LINKED ANNEX A CONTROL</span>
                      <select class="bare bare-sm"
                              [ngModel]="linkedControl(risk.id)"
                              (ngModelChange)="store.setTreatment(risk.id, { linkedControlId: $event || undefined })"
                              [disabled]="currentOption(risk.id) !== 'modify'">
                        <option [ngValue]="''">— Not linked —</option>
                        @for (control of store.controls(); track control.id) {
                          <option [ngValue]="control.id">{{ control.id }} · {{ control.title }}</option>
                        }
                      </select>
                    </label>
                  </div>

                  @if (currentOption(risk.id) === 'modify') {
                    <div class="mt-3 flex items-center gap-2 rounded-md border border-line-soft bg-bg-2 px-3 py-2">
                      <svg lucideLink2 class="w-3.5 h-3.5 text-accent shrink-0"></svg>
                      @if (linkedControl(risk.id); as ctrlId) {
                        <span class="text-[12px] text-fg-2 truncate flex-1">
                          Mitigation links to <b class="text-fg font-mono">{{ ctrlId }}</b> in the Statement of Applicability.
                        </span>
                        <button class="btn-ghost h-7 text-[11.5px]" (click)="goToSoa(ctrlId)">
                          <svg lucideExternalLink class="w-3 h-3"></svg>
                          Open in SoA
                        </button>
                      } @else {
                        <span class="text-[12px] text-warn flex-1">
                          Pick an Annex A control to anchor the Modify treatment to SoA.
                        </span>
                      }
                    </div>
                  }
                </div>

                <!-- Residual -->
                <div class="px-6 py-5">
                  <div class="flex items-center gap-2 mb-3">
                    <svg lucideGauge class="w-3.5 h-3.5 text-warn"></svg>
                    <div class="text-[11px] font-mono tracking-[0.12em] text-fg-4">RESIDUAL ESTIMATE</div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <label class="flex flex-col gap-1">
                      <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">LIKELIHOOD</span>
                      <select class="bare bare-sm"
                              [ngModel]="residualL(risk.id)"
                              (ngModelChange)="setResidual(risk.id, 'L', $event)">
                        @for (point of store.likelihoodScale(); track point.value) {
                          <option [ngValue]="point.value">{{ point.value }} · {{ point.label }}</option>
                        }
                      </select>
                    </label>
                    <label class="flex flex-col gap-1">
                      <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">IMPACT</span>
                      <select class="bare bare-sm"
                              [ngModel]="residualI(risk.id)"
                              (ngModelChange)="setResidual(risk.id, 'I', $event)">
                        @for (point of store.impactScale(); track point.value) {
                          <option [ngValue]="point.value">{{ point.value }} · {{ point.label }}</option>
                        }
                      </select>
                    </label>
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

  readonly options: { value: TreatmentOption; label: string; hint: string }[] = [
    { value: 'modify', label: TREATMENT_LABELS.modify, hint: TREATMENT_DESCRIPTIONS.modify },
    { value: 'avoid', label: TREATMENT_LABELS.avoid, hint: TREATMENT_DESCRIPTIONS.avoid },
    { value: 'share', label: TREATMENT_LABELS.share, hint: TREATMENT_DESCRIPTIONS.share },
    { value: 'retain', label: TREATMENT_LABELS.retain, hint: TREATMENT_DESCRIPTIONS.retain },
  ];

  readonly definedCount = computed(() => {
    const map = this.store.treatmentsByRisk();
    return this.store
      .treatableRisks()
      .filter((r) => {
        const t = map.get(r.id);
        return !!t && !!t.strategy.trim();
      }).length;
  });

  readonly residualBreaching = computed(() => {
    const t = this.store.acceptanceThreshold();
    return this.store
      .treatableRisks()
      .filter((r) => this.residualScore(r.id) >= t).length;
  });

  currentOption(riskId: string): TreatmentOption {
    return this.store.treatmentsByRisk().get(riskId)?.option ?? 'modify';
  }
  setOption(riskId: string, option: TreatmentOption) {
    const patch: { option: TreatmentOption; linkedControlId?: string } = { option };
    if (option !== 'modify') patch.linkedControlId = undefined;
    this.store.setTreatment(riskId, patch);
  }
  strategy(riskId: string): string {
    return this.store.treatmentsByRisk().get(riskId)?.strategy ?? '';
  }
  strategyPlaceholder(_riskId: string): string {
    return 'Describe the control change, the steps required, and the owner responsible…';
  }
  targetDate(riskId: string): string {
    return this.store.treatmentsByRisk().get(riskId)?.targetDate ?? '';
  }
  linkedControl(riskId: string): string {
    return this.store.treatmentsByRisk().get(riskId)?.linkedControlId ?? '';
  }
  residualL(riskId: string): ScaleValue {
    return this.store.treatmentsByRisk().get(riskId)?.residualLikelihood ?? 1;
  }
  residualI(riskId: string): ScaleValue {
    return this.store.treatmentsByRisk().get(riskId)?.residualImpact ?? 1;
  }
  residualScore(riskId: string): number {
    return this.residualL(riskId) * this.residualI(riskId);
  }

  setResidual(riskId: string, axis: 'L' | 'I', value: number | string) {
    const v = Number(value) as ScaleValue;
    if (axis === 'L') this.store.setTreatment(riskId, { residualLikelihood: v });
    else this.store.setTreatment(riskId, { residualImpact: v });
  }

  goToSoa(controlId: string) {
    this.router.navigate(['/soa'], { queryParams: { highlight: controlId } });
  }

  severityPillBg(score: number): string {
    switch (this.store.severity(score)) {
      case 'critical':
        return 'rgb(242 164 164 / 0.14)';
      case 'high':
        return 'rgb(229 152 90 / 0.14)';
      case 'medium':
        return 'rgb(240 201 135 / 0.14)';
      default:
        return 'rgb(140 240 200 / 0.14)';
    }
  }
  severityPillFg(score: number): string {
    switch (this.store.severity(score)) {
      case 'critical':
        return 'var(--danger)';
      case 'high':
        return '#e5985a';
      case 'medium':
        return 'var(--warn)';
      default:
        return 'var(--accent)';
    }
  }
  severityPillBorder(score: number): string {
    switch (this.store.severity(score)) {
      case 'critical':
        return 'rgb(242 164 164 / 0.28)';
      case 'high':
        return 'rgb(229 152 90 / 0.28)';
      case 'medium':
        return 'rgb(240 201 135 / 0.26)';
      default:
        return 'rgb(140 240 200 / 0.22)';
    }
  }
}
