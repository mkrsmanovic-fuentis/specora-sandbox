import { UpperCasePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideArrowLeft,
  LucideArrowRight,
  LucideCheck,
  LucideCheckCircle2,
  LucideCircleAlert,
  LucideEdit3,
  LucideFilter,
  LucideGlobe2,
  LucidePlus,
  LucideRefreshCw,
  LucideSearch,
  LucideShieldCheck,
  LucideSparkles,
  LucideTrash2,
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
  Risk,
  ScaleValue,
  TreatmentOption,
  overallImpact,
} from '../core/models';

type Phase = 'identification' | 'assessment' | 'treatment' | 'residual' | 'review';

interface WizardState {
  // Phase 1 - Identification
  affects: string[];
  scopeWide: boolean;
  threats: string[];
  vulnerability: string;
  damageScenarioId: string;
  impactDescription: string;
  existingControls: string;
  owner: string;

  // Phase 2 - Assessment
  likelihood: ScaleValue;
  impact: ImpactScores;

  // Phase 3 - Treatment
  treatmentOption: TreatmentOption;
  strategy: string;
  targetDate: string;
  plannedControls: PlannedControl[];

  // Phase 4 - Residual
  residualLikelihood: ScaleValue;
  residualImpact: ImpactScores;
  acceptanceRationale: string;
  reviewDueDate: string;
}

const EMPTY_WIZARD: WizardState = {
  affects: [],
  scopeWide: false,
  threats: [],
  vulnerability: '',
  damageScenarioId: '',
  impactDescription: '',
  existingControls: '',
  owner: '',
  likelihood: 3,
  impact: { c: 3, i: 3, a: 3, f: 3 },
  treatmentOption: 'modify',
  strategy: '',
  targetDate: '',
  plannedControls: [],
  residualLikelihood: 2,
  residualImpact: { c: 2, i: 2, a: 2, f: 2 },
  acceptanceRationale: '',
  reviewDueDate: '',
};

const PHASES: { key: Phase; label: string }[] = [
  { key: 'identification', label: 'Identification' },
  { key: 'assessment',     label: 'Assessment' },
  { key: 'treatment',      label: 'Treatment' },
  { key: 'residual',       label: 'Residual Risk' },
  { key: 'review',         label: 'Review' },
];

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [
    FormsModule,
    UpperCasePipe,
    LucideArrowLeft,
    LucideArrowRight,
    LucideCheck,
    LucideCheckCircle2,
    LucideCircleAlert,
    LucideEdit3,
    LucideFilter,
    LucideGlobe2,
    LucidePlus,
    LucideRefreshCw,
    LucideSearch,
    LucideShieldCheck,
    LucideSparkles,
    LucideTrash2,
    LucideX,
  ],
  template: `
    <div class="px-10 pt-10 pb-24 max-w-[1480px] mx-auto">

      <!-- Methodology default banner -->
      @if (store.activeMethodology().customizationLevel === 'NONE') {
        <div class="rounded-lg border bg-bg-2 px-4 py-3 mb-7 flex items-start gap-3"
             style="border-color: rgb(240 201 135 / 0.30); background: rgb(240 201 135 / 0.08);">
          <span class="w-7 h-7 grid place-items-center rounded-md bg-bg shrink-0"
                style="color: var(--warn);">
            <svg lucideCircleAlert class="w-4 h-4"></svg>
          </span>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] font-medium text-fg">
              You're using the Specora default risk methodology.
            </div>
            <div class="text-[12px] text-fg-3 mt-0.5 leading-snug">
              Customise it to match your organisation's risk appetite.
            </div>
          </div>
          <button class="btn-ghost text-[12px]" (click)="goMethodology()">
            Review now
            <svg lucideArrowRight class="w-3 h-3"></svg>
          </button>
        </div>
      }

      <!-- Page header -->
      <header class="pb-7 mb-7 border-b border-line-soft flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <h1 class="text-3xl font-semibold tracking-tight text-fg">Risk register</h1>
            <span class="tok tok-default">ISO 27005 · 8.4</span>
          </div>
          <p class="text-[14px] leading-relaxed text-fg-2 max-w-[680px]">
            Inherent risk assessment workspace. Every risk runs through a 5-phase wizard that captures
            identification, assessment, treatment, residual and review — with gates between phases.
          </p>
        </div>

        <div class="grid grid-cols-3 gap-2 min-w-[400px]">
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">TOTAL</div>
            <div class="text-[22px] font-semibold text-fg mt-0.5">{{ store.registerSummary().total }}</div>
          </div>
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">ABOVE THRESHOLD</div>
            <div class="text-[22px] font-semibold mt-0.5"
                 [class.text-danger]="store.registerSummary().breaching > 0"
                 [class.text-fg]="store.registerSummary().breaching === 0">
              {{ store.registerSummary().breaching }}
            </div>
          </div>
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">REVIEW REQUIRED</div>
            <div class="text-[22px] font-semibold mt-0.5"
                 [class.text-warn]="store.registerSummary().reviewRequired > 0"
                 [class.text-fg]="store.registerSummary().reviewRequired === 0">
              {{ store.registerSummary().reviewRequired }}
            </div>
          </div>
        </div>
      </header>

      <!-- Table card -->
      <section class="rounded-xl border border-line-soft bg-surface overflow-hidden">
        <div class="px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-3 flex-wrap">
          <div class="inline-flex items-center bg-bg border border-line-soft rounded-md p-0.5">
            <button class="h-7 px-2.5 rounded inline-flex items-center gap-2 text-[12.5px] font-medium"
                    [class.bg-surface-hi]="filterBreaching() === null"
                    [class.text-fg]="filterBreaching() === null"
                    [class.text-fg-3]="filterBreaching() !== null"
                    (click)="filterBreaching.set(null)">
              All
              <span class="font-mono text-[10px] text-fg-4">{{ store.enrichedRisks().length }}</span>
            </button>
            <button class="h-7 px-2.5 rounded inline-flex items-center gap-2 text-[12.5px] font-medium"
                    [class.bg-surface-hi]="filterBreaching() === true"
                    [class.text-fg]="filterBreaching() === true"
                    [class.text-fg-3]="filterBreaching() !== true"
                    (click)="filterBreaching.set(true)">
              Breaching
              <span class="font-mono text-[10px] text-fg-4">{{ store.registerSummary().breaching }}</span>
            </button>
            <button class="h-7 px-2.5 rounded inline-flex items-center gap-2 text-[12.5px] font-medium"
                    [class.bg-surface-hi]="filterBreaching() === false"
                    [class.text-fg]="filterBreaching() === false"
                    [class.text-fg-3]="filterBreaching() !== false"
                    (click)="filterBreaching.set(false)">
              Acceptable
            </button>
          </div>

          <div class="flex items-center h-8 w-[260px] bg-bg border border-line-soft rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_2px_var(--accent-dim)]">
            <span class="pl-2.5 text-fg-4"><svg lucideSearch class="w-3.5 h-3.5"></svg></span>
            <input
              class="flex-1 bg-transparent border-0 outline-none px-2 text-[12.5px] text-fg placeholder:text-fg-4 h-full min-w-0"
              placeholder="Search asset, threat, owner…"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)" />
          </div>

          <button class="inline-flex items-center gap-1.5 h-8 px-3 border border-line-soft rounded-md text-[12.5px] text-fg-2 hover:text-fg hover:bg-surface-hi">
            <svg lucideFilter class="w-3.5 h-3.5"></svg>
            Filters
          </button>

          <div class="flex-1"></div>

          @if (store.registerSummary().reviewRequired > 0) {
            <span class="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md font-mono text-[11px] tracking-wider"
                  style="background:rgb(240 201 135 / 0.14); color:var(--warn); border:1px solid rgb(240 201 135 / 0.30);">
              <svg lucideRefreshCw class="w-3 h-3"></svg>
              {{ store.registerSummary().reviewRequired }} review required
            </span>
          }

          <button class="btn-primary h-8 px-3 text-[12.5px]" (click)="openCreate()">
            <svg lucidePlus class="w-3.5 h-3.5"></svg>
            New risk
          </button>
        </div>

        <!-- Header row -->
        <div class="tbl-grid tbl-row border-b border-line-soft text-fg-4 text-[10.5px] font-mono tracking-[0.12em]"
             style="min-height:40px; grid-template-columns: 64px minmax(0,280px) minmax(0,1fr) 130px 60px 100px 80px 40px;">
          <div>ID</div>
          <div>AFFECTS</div>
          <div>THREAT · VULNERABILITY</div>
          <div>OWNER</div>
          <div class="text-center">L</div>
          <div class="text-center">C · I · A · F</div>
          <div class="text-center">SCORE</div>
          <div></div>
        </div>

        <!-- Body -->
        <div class="divide-y divide-line-soft">
          @for (risk of filteredRisks(); track risk.id) {
            <div class="tbl-grid tbl-row hover:bg-surface-2 relative"
                 style="grid-template-columns: 64px minmax(0,280px) minmax(0,1fr) 130px 60px 100px 80px 40px;"
                 [class.bg-bg-2]="risk.reviewRequired">
              @if (risk.reviewRequired) {
                <span class="absolute inset-y-0 left-0 w-[2px]" style="background: var(--warn)"></span>
              }

              <div>
                <span class="font-mono text-[12px] text-fg-2">{{ risk.id }}</span>
              </div>

              <div class="min-w-0">
                @if (risk.scopeWide) {
                  <div class="flex items-center gap-1.5">
                    <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                          style="background: var(--accent-dim); color: var(--accent);">
                      <svg lucideGlobe2 class="w-3 h-3"></svg>
                      SCOPE-WIDE
                    </span>
                    <span class="text-fg-3 text-[11px] truncate">All in-scope assets</span>
                  </div>
                } @else {
                  <div class="text-[13px] text-fg truncate">{{ assetNames(risk.affects) }}</div>
                  <div class="text-[10.5px] text-fg-4 truncate font-mono">{{ risk.affects.join(' · ') }}</div>
                }
              </div>

              <div class="min-w-0">
                <div class="text-[12.5px] text-fg-2 truncate">{{ threatTitles(risk.threats) }}</div>
                <div class="text-[11px] text-fg-4 truncate">{{ risk.vulnerability }}</div>
                @if (risk.reviewRequired && risk.reviewReason) {
                  <div class="mt-1 inline-flex items-center gap-1.5">
                    <span class="pill pill-warn"><span class="dot"></span>{{ risk.reviewReason }}</span>
                  </div>
                }
              </div>

              <div class="flex items-center gap-2 min-w-0">
                <span class="w-6 h-6 rounded-full grid place-items-center text-[10px] font-semibold"
                      [style.background]="ownerColor(risk.ownerInitials).bg"
                      [style.color]="ownerColor(risk.ownerInitials).fg">
                  {{ risk.ownerInitials }}
                </span>
                <span class="text-[12.5px] text-fg-2 truncate">{{ risk.owner }}</span>
              </div>

              <div class="grid place-items-center">
                <span class="font-mono text-[13px] text-fg">{{ risk.likelihood }}</span>
              </div>

              <div class="grid place-items-center">
                <div class="flex items-center gap-0.5">
                  <span class="impact-dot" [style.background]="dimColor(risk.impact.c)" title="Confidentiality">{{ risk.impact.c }}</span>
                  <span class="impact-dot" [style.background]="dimColor(risk.impact.i)" title="Integrity">{{ risk.impact.i }}</span>
                  <span class="impact-dot" [style.background]="dimColor(risk.impact.a)" title="Availability">{{ risk.impact.a }}</span>
                  <span class="impact-dot" [style.background]="dimColor(risk.impact.f)" title="Financial">{{ risk.impact.f }}</span>
                </div>
              </div>

              <div class="grid place-items-center">
                <span class="inline-flex items-center justify-center w-12 h-7 rounded font-mono text-[12.5px] font-semibold"
                      [class]="store.severityClass(risk.score)">
                  {{ risk.score }}
                </span>
              </div>

              <div class="flex items-center justify-end gap-0.5">
                @if (risk.reviewRequired) {
                  <button class="btn-iconplain" aria-label="Clear review" (click)="store.clearReview(risk.id)">
                    <svg lucideCheckCircle2 class="w-3.5 h-3.5"></svg>
                  </button>
                }
                <button class="btn-iconplain" aria-label="Edit" (click)="openEdit(risk)">
                  <svg lucideEdit3 class="w-3.5 h-3.5"></svg>
                </button>
                <button class="btn-iconplain" aria-label="Delete" (click)="confirmRemove(risk.id)">
                  <svg lucideTrash2 class="w-3.5 h-3.5"></svg>
                </button>
              </div>
            </div>
          } @empty {
            <div class="px-10 py-16 text-center">
              <div class="text-[13px] text-fg-2">No risks match the current filter.</div>
              <button class="btn-ghost mt-3" (click)="resetFilters()">Reset filters</button>
            </div>
          }
        </div>

        <div class="px-5 py-3 border-t border-line-soft bg-bg-2 flex items-center justify-between text-[11.5px] text-fg-3">
          <span>
            Showing <b class="text-fg">{{ filteredRisks().length }}</b> of {{ store.registerSummary().total }} ·
            avg score <b class="text-fg">{{ store.registerSummary().avgScore }}</b>
          </span>
          <span class="flex items-center gap-2 font-mono text-[10px] tracking-wider text-fg-4">
            <svg lucideSparkles class="w-3 h-3 text-accent"></svg>
            COMPUTED · L × MAX(C,I,A,F) AT WRITE
          </span>
        </div>
      </section>
    </div>

    <!-- ============================ WIZARD MODAL ============================ -->
    @if (modalOpen()) {
      <div class="overlay" (click)="closeModal($event)">
        <div class="modal wizard-modal" (click)="$event.stopPropagation()">

          <!-- Header + phase tracker -->
          <div class="px-6 pt-5 pb-4 border-b border-line-soft">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div>
                <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">
                  {{ editingId() ? 'EDIT RISK' : 'NEW RISK' }}
                </div>
                <div class="text-[18px] font-semibold text-fg mt-0.5">
                  {{ editingId() ? editingId() : 'Capture inherent risk' }}
                </div>
              </div>
              <button class="btn-iconplain" aria-label="Close" (click)="modalOpen.set(false)">
                <svg lucideX class="w-3.5 h-3.5"></svg>
              </button>
            </div>

            <div class="flex items-stretch gap-2">
              @for (phase of phases; track phase.key; let i = $index) {
                <button type="button"
                        class="flex-1 flex flex-col gap-1 text-left phase-pill"
                        [class.phase-active]="currentPhase() === phase.key"
                        [class.phase-done]="isPhaseCompleted(i)"
                        [disabled]="!canJumpTo(i)"
                        (click)="jumpTo(phase.key)">
                  <span class="flex items-center gap-2 text-[10px] font-mono tracking-[0.12em] text-fg-4">
                    @if (isPhaseCompleted(i)) {
                      <svg lucideCheck class="w-3 h-3 text-accent"></svg>
                    } @else {
                      <span>0{{ i + 1 }}</span>
                    }
                    <span class="text-fg-4">·</span>
                    <span class="truncate">{{ phase.label | uppercase }}</span>
                  </span>
                  <span class="h-1 rounded-full bg-bg-2 overflow-hidden">
                    <span class="block h-full rounded-full transition-all"
                          [style.width.%]="phaseProgress(i)"
                          [style.background]="phaseProgress(i) > 0 ? 'var(--accent)' : 'transparent'"></span>
                  </span>
                </button>
              }
            </div>
          </div>

          <div class="px-6 py-5 wizard-body">

            <!-- ============== PHASE 1: IDENTIFICATION ============== -->
            @if (currentPhase() === 'identification') {
              <div class="flex flex-col gap-5">
                <div>
                  <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4 mb-2">SCOPE — AFFECTS</div>
                  <div class="rounded-lg border border-line-soft bg-bg-2 p-3">
                    <label class="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" class="tbl-check"
                             [checked]="draft().scopeWide"
                             (change)="toggleScopeWide()" />
                      <span class="flex flex-col">
                        <span class="text-[12.5px] text-fg">Risk is scope-wide</span>
                        <span class="text-[11px] text-fg-4 leading-snug">
                          Applies to every in-scope asset (no individual link required).
                        </span>
                      </span>
                    </label>

                    @if (!draft().scopeWide) {
                      <div class="mt-3 pt-3 border-t border-line-soft">
                        <div class="text-[10.5px] font-mono tracking-[0.12em] text-fg-4 mb-2">
                          LINKED INVENTORY ASSETS · {{ draft().affects.length }} selected
                        </div>
                        <div class="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto">
                          @for (asset of store.inventory(); track asset.id) {
                            <label class="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-surface cursor-pointer"
                                   [class.selected-pick]="draft().affects.includes(asset.id)">
                              <input type="checkbox" class="tbl-check"
                                     [checked]="draft().affects.includes(asset.id)"
                                     (change)="toggleAsset(asset.id)" />
                              <span class="min-w-0 flex-1">
                                <span class="text-[12.5px] text-fg truncate block">{{ asset.name }}</span>
                                <span class="font-mono text-[10px] text-fg-4">{{ asset.id }} · {{ asset.category }}</span>
                              </span>
                              <span class="font-mono text-[9px] tracking-wider px-1 py-0.5 rounded shrink-0"
                                    [class]="criticalityClass(asset.criticality)">
                                {{ asset.criticality | uppercase }}
                              </span>
                            </label>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <div>
                  <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4 mb-2">
                    THREATS · {{ draft().threats.length }} selected
                  </div>
                  <div class="rounded-lg border border-line-soft bg-bg-2 max-h-[220px] overflow-y-auto">
                    @for (source of threatSources; track source) {
                      <div class="px-3 py-2 border-b border-line-soft sticky top-0 bg-bg-2 z-[1]">
                        <span class="font-mono text-[9.5px] tracking-[0.12em] text-fg-3">{{ source | uppercase }}</span>
                      </div>
                      @for (threat of threatsBySource(source); track threat.id) {
                        <label class="flex items-start gap-2 px-3 py-2 hover:bg-surface cursor-pointer"
                               [class.selected-pick]="draft().threats.includes(threat.id)">
                          <input type="checkbox" class="tbl-check mt-0.5"
                                 [checked]="draft().threats.includes(threat.id)"
                                 (change)="toggleThreat(threat.id)" />
                          <span class="min-w-0 flex-1">
                            <span class="flex items-center gap-2">
                              <span class="font-mono text-[11px] text-fg-3">{{ threat.code }}</span>
                              <span class="text-[12.5px] text-fg">{{ threat.title }}</span>
                            </span>
                            <span class="text-[11px] text-fg-3 leading-snug block">{{ threat.description }}</span>
                          </span>
                        </label>
                      }
                    }
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <label class="flex flex-col gap-1.5">
                    <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">VULNERABILITY</span>
                    <div class="input-shell">
                      <input type="text" placeholder="e.g. Lack of full-disk encryption"
                             [ngModel]="draft().vulnerability"
                             (ngModelChange)="patch({ vulnerability: $event })" />
                    </div>
                  </label>
                  <label class="flex flex-col gap-1.5">
                    <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">RISK OWNER</span>
                    <div class="input-shell">
                      <input type="text" placeholder="e.g. Marko K."
                             [ngModel]="draft().owner"
                             (ngModelChange)="patch({ owner: $event })" />
                    </div>
                  </label>
                </div>

                <div class="flex flex-col gap-1.5">
                  <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">DAMAGE SCENARIO</span>
                  <div class="grid grid-cols-2 gap-2">
                    @for (ds of store.damageScenarios(); track ds.id) {
                      <label class="flex items-start gap-2.5 px-3 py-2.5 rounded-md border cursor-pointer"
                             [class.selected-pick]="draft().damageScenarioId === ds.id"
                             [class.border-line-soft]="draft().damageScenarioId !== ds.id"
                             [class.border-accent]="draft().damageScenarioId === ds.id">
                        <input type="radio" name="ds"
                               class="tbl-check mt-1"
                               [checked]="draft().damageScenarioId === ds.id"
                               (change)="selectDamageScenario(ds.id)" />
                        <span class="min-w-0 flex-1">
                          <span class="flex items-center gap-1.5">
                            <span class="font-mono text-[10px] text-fg-4">{{ ds.id }}</span>
                            <span class="text-[12.5px] text-fg truncate">{{ ds.title }}</span>
                          </span>
                          <span class="text-[10.5px] text-fg-3 mt-0.5 block leading-snug">
                            Baseline · C{{ ds.baseline.c }} · I{{ ds.baseline.i }} · A{{ ds.baseline.a }} · F{{ ds.baseline.f }}
                          </span>
                        </span>
                      </label>
                    }
                  </div>
                </div>

                <label class="flex flex-col gap-1.5">
                  <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">EXISTING CONTROLS</span>
                  <div class="input-shell">
                    <input type="text" placeholder="e.g. MFA on login, asset tagging"
                           [ngModel]="draft().existingControls"
                           (ngModelChange)="patch({ existingControls: $event })" />
                  </div>
                </label>

                @if (!gateOk('identification')) {
                  <div class="flex items-start gap-2 text-[11.5px] text-warn">
                    <svg lucideCircleAlert class="w-3.5 h-3.5 mt-0.5 shrink-0"></svg>
                    <span>{{ gateMessage('identification') }}</span>
                  </div>
                }
              </div>
            }

            <!-- ============== PHASE 2: ASSESSMENT ============== -->
            @if (currentPhase() === 'assessment') {
              <div class="flex flex-col gap-5">
                <div>
                  <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4 mb-2">LIKELIHOOD</div>
                  <div class="rounded-lg border border-line-soft bg-bg-2 px-4 py-3">
                    <div class="flex items-center justify-between gap-3 mb-2">
                      <span class="text-[12.5px] text-fg-2">P( occurs within 12 months )</span>
                      <span class="font-mono text-[12px] text-fg-3">
                        {{ likelihoodLabel(draft().likelihood) }}
                      </span>
                    </div>
                    <div class="grid grid-cols-5 gap-1.5">
                      @for (p of store.likelihoodScale(); track p.value) {
                        <button class="scale-btn"
                                [class.scale-active]="draft().likelihood === p.value"
                                (click)="setLikelihood(p.value)">
                          <span class="font-mono text-[14px] font-semibold">{{ p.value }}</span>
                          <span class="text-[10px]">{{ p.label }}</span>
                        </button>
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">IMPACT · 4 DIMENSIONS</div>
                    <div class="text-[10.5px] text-fg-3">
                      Overall = MAX(C, I, A, F) =
                      <b class="font-mono text-fg">{{ overall(draft().impact) }}</b>
                    </div>
                  </div>
                  <div class="rounded-lg border border-line-soft bg-bg-2 divide-y divide-line-soft">
                    @for (key of dimKeys; track key) {
                      <div class="px-4 py-3 grid grid-cols-[160px_minmax(0,1fr)] gap-3 items-center">
                        <div>
                          <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">{{ key | uppercase }}</div>
                          <div class="text-[13px] text-fg">{{ dimLabel(key) }}</div>
                        </div>
                        <div class="grid grid-cols-5 gap-1.5">
                          @for (p of store.impactScale(); track p.value) {
                            <button class="scale-btn"
                                    [class.scale-active]="draft().impact[key] === p.value"
                                    (click)="setImpactDim(key, p.value)">
                              <span class="font-mono text-[14px] font-semibold">{{ p.value }}</span>
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <div class="rounded-lg border border-line-soft bg-bg-2 p-4 grid grid-cols-[1fr_auto] items-center gap-4">
                  <div>
                    <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">INHERENT RISK SCORE</div>
                    <div class="mt-1 text-[12.5px] text-fg-2 leading-snug">
                      Likelihood <b class="text-fg">{{ draft().likelihood }}</b> × Impact
                      <b class="text-fg">{{ overall(draft().impact) }}</b> =
                      <b class="text-fg">{{ inherentScore() }}</b>
                      <span class="text-fg-4"> / {{ store.maxScore() }}</span>
                      ·
                      <b class="text-fg">{{ store.severityLabel(inherentScore()) }}</b>
                      @if (inherentScore() >= store.acceptanceThreshold()) {
                        · routes to treatment
                      }
                    </div>
                  </div>
                  <span class="inline-flex items-center justify-center w-16 h-12 rounded-md font-mono text-[18px] font-semibold"
                        [class]="store.severityClass(inherentScore())">
                    {{ inherentScore() }}
                  </span>
                </div>
              </div>
            }

            <!-- ============== PHASE 3: TREATMENT ============== -->
            @if (currentPhase() === 'treatment') {
              <div class="flex flex-col gap-5">
                <div>
                  <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4 mb-2">TREATMENT DECISION</div>
                  <div class="grid grid-cols-2 gap-2">
                    @for (opt of treatmentOptions; track opt.value) {
                      <label class="flex items-start gap-2.5 px-3 py-2.5 rounded-md cursor-pointer border"
                             [class.selected-pick]="draft().treatmentOption === opt.value"
                             [class.border-line-soft]="draft().treatmentOption !== opt.value"
                             [class.border-accent]="draft().treatmentOption === opt.value">
                        <input type="radio" name="treat"
                               class="tbl-check mt-0.5"
                               [checked]="draft().treatmentOption === opt.value"
                               (change)="setTreatmentOption(opt.value)" />
                        <span class="min-w-0">
                          <span class="block text-[12.5px] text-fg">{{ opt.label }}</span>
                          <span class="block text-[10.5px] text-fg-4 leading-snug mt-0.5">{{ opt.hint }}</span>
                        </span>
                      </label>
                    }
                  </div>
                </div>

                <label class="flex flex-col gap-1.5">
                  <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">ACTION STRATEGY</span>
                  <textarea class="bare" rows="3"
                            placeholder="Describe the control change, the steps required, and the owner responsible…"
                            [ngModel]="draft().strategy"
                            (ngModelChange)="patch({ strategy: $event })"></textarea>
                </label>

                <label class="flex flex-col gap-1.5">
                  <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">TARGET DATE</span>
                  <div class="input-shell">
                    <input type="date"
                           [ngModel]="draft().targetDate"
                           (ngModelChange)="patch({ targetDate: $event })" />
                  </div>
                </label>

                @if (draft().treatmentOption === 'modify') {
                  <div>
                    <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4 mb-2">
                      PLANNED CONTROLS — ISO 27001:2022 Annex A · {{ draft().plannedControls.length }} selected
                    </div>
                    <div class="rounded-lg border border-line-soft bg-bg-2 max-h-[240px] overflow-y-auto">
                      @for (group of annexGroups(); track group.name) {
                        <div class="px-3 py-2 border-b border-line-soft sticky top-0 bg-bg-2 z-[1]">
                          <span class="font-mono text-[9.5px] tracking-[0.12em] text-fg-3">{{ group.name }}</span>
                        </div>
                        @for (ctrl of group.items; track ctrl.id) {
                          <label class="flex items-start gap-2 px-3 py-2 hover:bg-surface cursor-pointer"
                                 [class.selected-pick]="isPlannedSelected(ctrl.id)">
                            <input type="checkbox" class="tbl-check mt-0.5"
                                   [checked]="isPlannedSelected(ctrl.id)"
                                   (change)="togglePlannedControl(ctrl.id, ctrl.title)" />
                            <span class="min-w-0 flex-1">
                              <span class="flex items-center gap-2">
                                <span class="font-mono text-[11px] text-fg-3">{{ ctrl.id }}</span>
                                <span class="text-[12.5px] text-fg">{{ ctrl.title }}</span>
                              </span>
                            </span>
                          </label>
                        }
                      }
                    </div>
                  </div>
                }

                @if (!gateOk('treatment')) {
                  <div class="flex items-start gap-2 text-[11.5px] text-warn">
                    <svg lucideCircleAlert class="w-3.5 h-3.5 mt-0.5 shrink-0"></svg>
                    <span>{{ gateMessage('treatment') }}</span>
                  </div>
                }
              </div>
            }

            <!-- ============== PHASE 4: RESIDUAL RISK ============== -->
            @if (currentPhase() === 'residual') {
              <div class="flex flex-col gap-5">
                <div>
                  <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4 mb-2">RESIDUAL LIKELIHOOD</div>
                  <div class="grid grid-cols-5 gap-1.5">
                    @for (p of store.likelihoodScale(); track p.value) {
                      <button class="scale-btn"
                              [class.scale-active]="draft().residualLikelihood === p.value"
                              (click)="setResidualLikelihood(p.value)">
                        <span class="font-mono text-[14px] font-semibold">{{ p.value }}</span>
                        <span class="text-[10px]">{{ p.label }}</span>
                      </button>
                    }
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-2">
                    <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">RESIDUAL IMPACT · 4 DIMENSIONS</div>
                    <div class="text-[10.5px] text-fg-3">
                      Residual overall = <b class="font-mono text-fg">{{ overall(draft().residualImpact) }}</b>
                    </div>
                  </div>
                  <div class="rounded-lg border border-line-soft bg-bg-2 divide-y divide-line-soft">
                    @for (key of dimKeys; track key) {
                      <div class="px-4 py-3 grid grid-cols-[160px_minmax(0,1fr)] gap-3 items-center">
                        <div>
                          <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">{{ key | uppercase }}</div>
                          <div class="text-[13px] text-fg">{{ dimLabel(key) }}</div>
                        </div>
                        <div class="grid grid-cols-5 gap-1.5">
                          @for (p of store.impactScale(); track p.value) {
                            <button class="scale-btn"
                                    [class.scale-active]="draft().residualImpact[key] === p.value"
                                    (click)="setResidualImpactDim(key, p.value)">
                              <span class="font-mono text-[14px] font-semibold">{{ p.value }}</span>
                            </button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <label class="flex flex-col gap-1.5">
                  <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">ACCEPTANCE RATIONALE</span>
                  <textarea class="bare" rows="3"
                            placeholder="Explain why the residual risk is acceptable to the organisation…"
                            [ngModel]="draft().acceptanceRationale"
                            (ngModelChange)="patch({ acceptanceRationale: $event })"></textarea>
                </label>

                <div class="grid grid-cols-2 gap-4">
                  <label class="flex flex-col gap-1.5">
                    <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">REVIEW DUE DATE</span>
                    <div class="input-shell">
                      <input type="date"
                             [ngModel]="draft().reviewDueDate"
                             (ngModelChange)="patch({ reviewDueDate: $event })" />
                    </div>
                  </label>
                  <div class="rounded-md border border-line-soft bg-bg-2 px-4 py-2.5 flex items-center gap-3">
                    <span class="inline-flex items-center justify-center w-10 h-10 rounded-md font-mono text-[14px] font-semibold"
                          [class]="store.severityClass(residualScore())">
                      {{ residualScore() }}
                    </span>
                    <div class="min-w-0">
                      <div class="font-mono text-[9.5px] tracking-[0.12em] text-fg-4">RESIDUAL SCORE</div>
                      <div class="text-[12px] text-fg-2 leading-snug">
                        {{ store.severityLabel(residualScore()) }} · Δ
                        <span class="font-mono"
                              [class.text-accent]="residualScore() < inherentScore()"
                              [class.text-danger]="residualScore() >= inherentScore()">
                          {{ residualScore() - inherentScore() >= 0 ? '+' : '' }}{{ residualScore() - inherentScore() }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                @if (!gateOk('residual')) {
                  <div class="flex items-start gap-2 text-[11.5px] text-warn">
                    <svg lucideCircleAlert class="w-3.5 h-3.5 mt-0.5 shrink-0"></svg>
                    <span>{{ gateMessage('residual') }}</span>
                  </div>
                }
              </div>
            }

            <!-- ============== PHASE 5: REVIEW ============== -->
            @if (currentPhase() === 'review') {
              <div class="flex flex-col gap-4">
                <div class="text-[12.5px] text-fg-2">
                  Confirm the captured risk. Saving commits to the register, treatment plan, and SoA links.
                </div>

                <div class="rounded-lg border border-line-soft bg-bg-2 divide-y divide-line-soft">
                  <div class="px-4 py-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="font-mono text-[10px] tracking-[0.12em] text-fg-4">IDENTIFICATION</span>
                      <button class="text-[11px] font-mono text-accent hover:underline ml-auto" (click)="jumpTo('identification')">Edit ›</button>
                    </div>
                    <div class="text-[12.5px] text-fg-2 grid grid-cols-2 gap-3">
                      <div>
                        <div class="text-[10px] font-mono text-fg-4">Affects</div>
                        @if (draft().scopeWide) {
                          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold"
                                style="background: var(--accent-dim); color: var(--accent);">
                            <svg lucideGlobe2 class="w-3 h-3"></svg> SCOPE-WIDE
                          </span>
                        } @else {
                          <div class="text-fg">{{ assetNames(draft().affects) || '—' }}</div>
                        }
                      </div>
                      <div>
                        <div class="text-[10px] font-mono text-fg-4">Owner</div>
                        <div class="text-fg">{{ draft().owner || '—' }}</div>
                      </div>
                      <div>
                        <div class="text-[10px] font-mono text-fg-4">Threats</div>
                        <div class="text-fg">{{ threatTitles(draft().threats) || '—' }}</div>
                      </div>
                      <div>
                        <div class="text-[10px] font-mono text-fg-4">Vulnerability</div>
                        <div class="text-fg">{{ draft().vulnerability || '—' }}</div>
                      </div>
                      <div class="col-span-2">
                        <div class="text-[10px] font-mono text-fg-4">Damage scenario</div>
                        <div class="text-fg">{{ damageScenarioTitle(draft().damageScenarioId) || '—' }}</div>
                      </div>
                    </div>
                  </div>

                  <div class="px-4 py-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="font-mono text-[10px] tracking-[0.12em] text-fg-4">ASSESSMENT</span>
                      <button class="text-[11px] font-mono text-accent hover:underline ml-auto" (click)="jumpTo('assessment')">Edit ›</button>
                    </div>
                    <div class="text-[12.5px] text-fg-2 flex items-center gap-3 flex-wrap">
                      <span>L {{ draft().likelihood }}</span>
                      <span>·</span>
                      <span>C {{ draft().impact.c }}</span>
                      <span>I {{ draft().impact.i }}</span>
                      <span>A {{ draft().impact.a }}</span>
                      <span>F {{ draft().impact.f }}</span>
                      <span>·</span>
                      <span>Overall = <b class="text-fg">{{ overall(draft().impact) }}</b></span>
                      <span class="ml-auto inline-flex items-center justify-center w-10 h-7 rounded font-mono text-[12px] font-semibold"
                            [class]="store.severityClass(inherentScore())">
                        {{ inherentScore() }}
                      </span>
                    </div>
                  </div>

                  <div class="px-4 py-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="font-mono text-[10px] tracking-[0.12em] text-fg-4">TREATMENT</span>
                      <button class="text-[11px] font-mono text-accent hover:underline ml-auto" (click)="jumpTo('treatment')">Edit ›</button>
                    </div>
                    <div class="text-[12.5px] text-fg-2">
                      <div>Decision: <b class="text-fg">{{ treatmentLabels[draft().treatmentOption] }}</b></div>
                      <div class="mt-1">Target: <span class="font-mono text-fg-3">{{ draft().targetDate || '—' }}</span></div>
                      @if (draft().treatmentOption === 'modify') {
                        <div class="mt-2">
                          <div class="text-[10px] font-mono text-fg-4">Planned controls</div>
                          @if (draft().plannedControls.length === 0) {
                            <div class="text-fg-4">—</div>
                          } @else {
                            <div class="flex flex-wrap gap-1.5 mt-1">
                              @for (pc of draft().plannedControls; track pc.id) {
                                <span class="font-mono text-[10.5px] px-1.5 py-0.5 rounded border border-line-soft bg-surface text-fg-2">
                                  {{ pc.id }} · {{ pc.title }}
                                </span>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>

                  <div class="px-4 py-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="font-mono text-[10px] tracking-[0.12em] text-fg-4">RESIDUAL RISK</span>
                      <button class="text-[11px] font-mono text-accent hover:underline ml-auto" (click)="jumpTo('residual')">Edit ›</button>
                    </div>
                    <div class="text-[12.5px] text-fg-2 flex items-center gap-3 flex-wrap">
                      <span>L {{ draft().residualLikelihood }}</span>
                      <span>·</span>
                      <span>C {{ draft().residualImpact.c }}</span>
                      <span>I {{ draft().residualImpact.i }}</span>
                      <span>A {{ draft().residualImpact.a }}</span>
                      <span>F {{ draft().residualImpact.f }}</span>
                      <span>·</span>
                      <span>Overall = <b class="text-fg">{{ overall(draft().residualImpact) }}</b></span>
                      <span class="ml-auto inline-flex items-center justify-center w-10 h-7 rounded font-mono text-[12px] font-semibold"
                            [class]="store.severityClass(residualScore())">
                        {{ residualScore() }}
                      </span>
                    </div>
                    <div class="text-[12px] text-fg-3 mt-2 leading-snug">
                      {{ draft().acceptanceRationale || '— no rationale —' }}
                    </div>
                    <div class="text-[11.5px] text-fg-4 mt-1">Review due: {{ draft().reviewDueDate || '—' }}</div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Wizard footer -->
          <div class="px-6 py-3 border-t border-line-soft bg-bg-2 flex items-center justify-between gap-3">
            @if (editingId() && currentPhaseIndex() === 0) {
              <button class="btn-ghost" (click)="onDelete()">
                <svg lucideTrash2 class="w-3.5 h-3.5"></svg>
                Delete risk
              </button>
            } @else {
              <button class="btn-ghost" (click)="prev()" [disabled]="currentPhaseIndex() === 0">
                <svg lucideArrowLeft class="w-3.5 h-3.5"></svg>
                Back
              </button>
            }
            <div class="text-[11.5px] text-fg-3 font-mono">
              PHASE {{ currentPhaseIndex() + 1 }} OF {{ phases.length }}
            </div>
            @if (currentPhase() === 'review') {
              <button class="btn-primary" (click)="onSave()">
                <svg lucideShieldCheck class="w-3.5 h-3.5"></svg>
                {{ editingId() ? 'Save changes' : 'Add to register' }}
              </button>
            } @else {
              <button class="btn-primary"
                      [disabled]="!gateOk(currentPhase())"
                      (click)="next()">
                Next
                <svg lucideArrowRight class="w-3.5 h-3.5"></svg>
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .wizard-modal { max-width: 880px; }
      .wizard-body { max-height: calc(100vh - 280px); overflow-y: auto; }

      .phase-pill {
        background: transparent;
        border: 0;
        padding: 0;
        cursor: pointer;
        opacity: 0.55;
        transition: opacity .15s;
      }
      .phase-pill[disabled] { cursor: not-allowed; }
      .phase-pill:not([disabled]):hover { opacity: 1; }
      .phase-pill.phase-active { opacity: 1; }
      .phase-pill.phase-done { opacity: 1; }

      .scale-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1px;
        padding: 8px 4px;
        border-radius: 6px;
        background: var(--surface);
        border: 1px solid var(--line-soft);
        color: var(--fg-2);
        cursor: pointer;
        min-height: 48px;
        transition: background .12s, border-color .12s;
      }
      .scale-btn:hover { background: var(--surface-hi); }
      .scale-btn.scale-active {
        background: var(--accent-dim);
        border-color: var(--accent);
        color: var(--fg);
      }

      .impact-dot {
        width: 18px;
        height: 18px;
        display: inline-grid;
        place-items: center;
        font: 600 10px/1 'JetBrains Mono', monospace;
        color: rgba(0,0,0,0.78);
        border-radius: 4px;
      }

      .selected-pick { background: var(--accent-dim); }
    `,
  ],
})
export class RegisterView {
  readonly store = inject(IsmsStore);
  readonly router = inject(Router);

  readonly query = signal('');
  readonly filterBreaching = signal<boolean | null>(null);

  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly draft = signal<WizardState>({ ...EMPTY_WIZARD });
  readonly currentPhase = signal<Phase>('identification');

  readonly phases = PHASES;
  readonly dimKeys = IMPACT_DIM_KEYS;
  readonly threatSources: ('IRAM2' | 'BSI' | 'Custom')[] = ['IRAM2', 'BSI', 'Custom'];

  readonly treatmentLabels = TREATMENT_LABELS;
  readonly treatmentOptions: { value: TreatmentOption; label: string; hint: string }[] = [
    { value: 'modify', label: TREATMENT_LABELS.modify, hint: TREATMENT_DESCRIPTIONS.modify },
    { value: 'avoid',  label: TREATMENT_LABELS.avoid,  hint: TREATMENT_DESCRIPTIONS.avoid },
    { value: 'share',  label: TREATMENT_LABELS.share,  hint: TREATMENT_DESCRIPTIONS.share },
    { value: 'retain', label: TREATMENT_LABELS.retain, hint: TREATMENT_DESCRIPTIONS.retain },
  ];

  readonly inherentScore = computed(() => this.draft().likelihood * overallImpact(this.draft().impact));
  readonly residualScore = computed(
    () => this.draft().residualLikelihood * overallImpact(this.draft().residualImpact),
  );
  readonly currentPhaseIndex = computed(() => PHASES.findIndex((p) => p.key === this.currentPhase()));

  readonly filteredRisks = computed(() => {
    const q = this.query().trim().toLowerCase();
    const bf = this.filterBreaching();
    return this.store.enrichedRisks().filter((r) => {
      if (bf !== null && r.breaches !== bf) return false;
      if (!q) return true;
      const haystack = [
        ...r.affects.map((id) => this.store.inventoryById().get(id)?.name ?? id),
        ...r.threats.map((id) => this.store.threatsById().get(id)?.title ?? id),
        r.vulnerability,
        r.owner,
        r.impactDescription,
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  });

  overall(scores: ImpactScores): ScaleValue {
    return overallImpact(scores);
  }
  likelihoodLabel(v: ScaleValue): string {
    return this.store.likelihoodScale().find((p) => p.value === v)?.label ?? '';
  }
  dimLabel(key: ImpactDimension): string {
    return IMPACT_DIM_LABELS[key] ?? key;
  }
  dimColor(value: ScaleValue): string {
    if (value >= 5) return 'rgb(242 164 164 / 0.85)';
    if (value === 4) return 'rgb(229 152 90 / 0.85)';
    if (value === 3) return 'rgb(240 201 135 / 0.85)';
    if (value === 2) return 'rgb(140 240 200 / 0.65)';
    return 'rgb(140 240 200 / 0.40)';
  }
  criticalityClass(c: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (c) {
      case 'critical': return 'tok tok-danger';
      case 'high':     return 'tok tok-warn';
      case 'medium':   return 'tok tok-info';
      default:         return 'tok tok-default';
    }
  }
  threatsBySource(source: 'IRAM2' | 'BSI' | 'Custom') {
    return this.store.threats().filter((t) => t.source === source);
  }
  annexGroups() {
    const map = new Map<string, { name: string; items: { id: string; title: string }[] }>();
    for (const ctrl of this.store.controls()) {
      if (!ctrl.applicable) continue;
      const list = map.get(ctrl.group) ?? { name: ctrl.group, items: [] };
      list.items.push({ id: ctrl.id, title: ctrl.title });
      map.set(ctrl.group, list);
    }
    return [...map.values()];
  }
  assetNames(ids: string[]): string {
    return ids.map((id) => this.store.inventoryById().get(id)?.name ?? id).join(', ');
  }
  threatTitles(ids: string[]): string {
    return ids.map((id) => this.store.threatsById().get(id)?.title ?? id).join(', ');
  }
  damageScenarioTitle(id: string): string {
    if (!id) return '';
    return this.store.damageScenarioById().get(id)?.title ?? id;
  }
  isPlannedSelected(id: string): boolean {
    return this.draft().plannedControls.some((pc) => pc.id === id);
  }
  ownerColor(initials: string): { bg: string; fg: string } {
    const palette = [
      { bg: 'var(--accent)', fg: 'var(--accent-fg)' },
      { bg: 'rgb(141 198 245 / 0.20)', fg: 'var(--info)' },
      { bg: 'rgb(240 201 135 / 0.20)', fg: 'var(--warn)' },
      { bg: 'rgb(229 152 90 / 0.20)', fg: '#e5985a' },
      { bg: 'rgb(242 164 164 / 0.20)', fg: 'var(--danger)' },
    ];
    let hash = 0;
    for (const ch of initials) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return palette[hash % palette.length] ?? palette[0];
  }

  // ---------- Listing actions ----------
  resetFilters() {
    this.query.set('');
    this.filterBreaching.set(null);
  }

  openCreate() {
    this.editingId.set(null);
    this.draft.set({
      ...EMPTY_WIZARD,
      impact: { ...EMPTY_WIZARD.impact },
      residualImpact: { ...EMPTY_WIZARD.residualImpact },
    });
    this.currentPhase.set('identification');
    this.modalOpen.set(true);
  }

  openEdit(risk: Risk) {
    this.editingId.set(risk.id);
    const existing = this.store.treatments().find((t) => t.riskId === risk.id);
    this.draft.set({
      affects: [...risk.affects],
      scopeWide: risk.scopeWide,
      threats: [...risk.threats],
      vulnerability: risk.vulnerability,
      damageScenarioId: risk.damageScenarioId ?? '',
      impactDescription: risk.impactDescription,
      existingControls: risk.existingControls,
      owner: risk.owner,
      likelihood: risk.likelihood,
      impact: { ...risk.impact },
      treatmentOption: existing?.option ?? 'modify',
      strategy: existing?.strategy ?? '',
      targetDate: existing?.targetDate ?? '',
      plannedControls: existing ? [...existing.plannedControls] : [],
      residualLikelihood: existing?.residualLikelihood ?? 2,
      residualImpact: existing
        ? { ...existing.residualImpact }
        : { c: 2, i: 2, a: 2, f: 2 },
      acceptanceRationale: existing?.acceptanceRationale ?? '',
      reviewDueDate: existing?.reviewDueDate ?? '',
    });
    this.currentPhase.set('identification');
    this.modalOpen.set(true);
  }

  closeModal(event: MouseEvent) {
    if (event.target === event.currentTarget) this.modalOpen.set(false);
  }

  // ---------- Draft mutators ----------
  patch(partial: Partial<WizardState>) {
    this.draft.update((d) => ({ ...d, ...partial }));
  }
  toggleScopeWide() {
    this.draft.update((d) => ({
      ...d,
      scopeWide: !d.scopeWide,
      affects: !d.scopeWide ? [] : d.affects,
    }));
  }
  toggleAsset(id: string) {
    this.draft.update((d) => ({
      ...d,
      affects: d.affects.includes(id) ? d.affects.filter((x) => x !== id) : [...d.affects, id],
    }));
  }
  toggleThreat(id: string) {
    this.draft.update((d) => ({
      ...d,
      threats: d.threats.includes(id) ? d.threats.filter((x) => x !== id) : [...d.threats, id],
    }));
  }
  selectDamageScenario(id: string) {
    const ds = this.store.damageScenarioById().get(id);
    if (!ds) return;
    this.draft.update((d) => ({
      ...d,
      damageScenarioId: id,
      impactDescription: d.impactDescription || ds.title,
      impact: { ...ds.baseline },
    }));
  }
  setLikelihood(v: ScaleValue) { this.patch({ likelihood: v }); }
  setImpactDim(key: ImpactDimension, v: ScaleValue) {
    this.draft.update((d) => ({ ...d, impact: { ...d.impact, [key]: v } }));
  }
  setTreatmentOption(opt: TreatmentOption) {
    this.patch({
      treatmentOption: opt,
      plannedControls: opt === 'modify' ? this.draft().plannedControls : [],
    });
  }
  togglePlannedControl(id: string, title: string) {
    this.draft.update((d) => {
      const exists = d.plannedControls.some((pc) => pc.id === id);
      const next = exists
        ? d.plannedControls.filter((pc) => pc.id !== id)
        : [...d.plannedControls, { id, framework: 'ISO 27001:2022 Annex A', title }];
      return { ...d, plannedControls: next };
    });
  }
  setResidualLikelihood(v: ScaleValue) { this.patch({ residualLikelihood: v }); }
  setResidualImpactDim(key: ImpactDimension, v: ScaleValue) {
    this.draft.update((d) => ({ ...d, residualImpact: { ...d.residualImpact, [key]: v } }));
  }

  // ---------- Gates ----------
  gateOk(phase: Phase): boolean {
    const d = this.draft();
    switch (phase) {
      case 'identification':
        return (d.scopeWide || d.affects.length > 0) && d.threats.length > 0 && d.owner.trim().length > 0;
      case 'assessment':
        return true;
      case 'treatment':
        if (d.treatmentOption === 'modify') return d.plannedControls.length > 0;
        return true;
      case 'residual':
        return d.acceptanceRationale.trim().length > 0 && d.reviewDueDate.length > 0;
      case 'review':
        return true;
    }
  }

  gateMessage(phase: Phase): string {
    const d = this.draft();
    switch (phase) {
      case 'identification': {
        const missing: string[] = [];
        if (!d.scopeWide && d.affects.length === 0) missing.push('at least one Affects asset (or mark Scope-wide)');
        if (d.threats.length === 0) missing.push('at least one threat');
        if (!d.owner.trim()) missing.push('a risk owner');
        return `Add ${missing.join(', ')} to continue.`;
      }
      case 'treatment':
        return 'Modify treatments need at least one planned Annex A control before advancing.';
      case 'residual':
        return 'Acceptance rationale and a review due date are required to leave Residual Risk.';
      default:
        return '';
    }
  }

  canJumpTo(idx: number): boolean {
    if (idx <= this.currentPhaseIndex()) return true;
    for (let i = 0; i < idx; i++) {
      if (!this.gateOk(PHASES[i].key)) return false;
    }
    return true;
  }
  isPhaseCompleted(idx: number): boolean {
    return idx < this.currentPhaseIndex() && this.gateOk(PHASES[idx].key);
  }
  phaseProgress(idx: number): number {
    if (idx < this.currentPhaseIndex()) return 100;
    if (idx === this.currentPhaseIndex()) return this.gateOk(PHASES[idx].key) ? 100 : 40;
    return 0;
  }

  // ---------- Navigation ----------
  jumpTo(key: Phase) {
    const idx = PHASES.findIndex((p) => p.key === key);
    if (this.canJumpTo(idx)) this.currentPhase.set(key);
  }
  next() {
    const idx = this.currentPhaseIndex();
    if (!this.gateOk(this.currentPhase())) return;
    const nextPhase = PHASES[idx + 1];
    if (nextPhase) this.currentPhase.set(nextPhase.key);
  }
  prev() {
    const idx = this.currentPhaseIndex();
    const prev = PHASES[idx - 1];
    if (prev) this.currentPhase.set(prev.key);
  }

  // ---------- Commit ----------
  onSave() {
    const d = this.draft();
    const riskPayload = {
      affects: d.affects,
      scopeWide: d.scopeWide,
      threats: d.threats,
      vulnerability: d.vulnerability,
      damageScenarioId: d.damageScenarioId || undefined,
      impactDescription: d.impactDescription,
      existingControls: d.existingControls,
      owner: d.owner,
      ownerInitials: makeInitials(d.owner),
      likelihood: d.likelihood,
      impact: d.impact,
    };

    let id = this.editingId();
    if (id) {
      this.store.updateRisk(id, riskPayload);
    } else {
      id = this.store.addRisk(riskPayload);
    }

    this.store.setTreatment(id, {
      option: d.treatmentOption,
      strategy: d.strategy,
      targetDate: d.targetDate,
      residualLikelihood: d.residualLikelihood,
      residualImpact: d.residualImpact,
      plannedControls: d.plannedControls,
      acceptanceRationale: d.acceptanceRationale,
      reviewDueDate: d.reviewDueDate,
    });

    this.modalOpen.set(false);
  }

  onDelete() {
    const id = this.editingId();
    if (!id) return;
    if (confirm(`Remove risk ${id}? Linked treatments will also be cleared.`)) {
      this.store.removeRisk(id);
      this.modalOpen.set(false);
    }
  }
  confirmRemove(id: string) {
    if (confirm(`Remove risk ${id}? Linked treatments will also be cleared.`)) {
      this.store.removeRisk(id);
    }
  }
  goMethodology() {
    this.router.navigate(['/methodology']);
  }
}

function makeInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
