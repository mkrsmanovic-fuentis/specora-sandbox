import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideCheckCircle2,
  LucideEdit3,
  LucideFilter,
  LucidePlus,
  LucideRefreshCw,
  LucideSearch,
  LucideShieldCheck,
  LucideSparkles,
  LucideTrash2,
  LucideX,
} from '@lucide/angular';

import { IsmsStore } from '../core/isms-store';
import { Risk, ScaleValue } from '../core/models';

type DraftRisk = Omit<Risk, 'id' | 'createdAt'>;

const EMPTY_DRAFT: DraftRisk = {
  asset: '',
  threat: '',
  vulnerability: '',
  impactDescription: '',
  existingControls: '',
  owner: '',
  ownerInitials: '',
  likelihood: 3,
  impact: 3,
};

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [
    FormsModule,
    LucideCheckCircle2,
    LucideEdit3,
    LucideFilter,
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
      <!-- Page header -->
      <header class="pb-7 mb-7 border-b border-line-soft flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <h1 class="text-3xl font-semibold tracking-tight text-fg">Risk register</h1>
            <span class="tok tok-default">ISO 27005 · 8.4</span>
          </div>
          <p class="text-[14px] leading-relaxed text-fg-2 max-w-[680px]">
            Inherent risk assessment workspace. Every row drives downstream signals — the score is recomputed
            with <code class="font-mono text-accent text-[12px]">L × I</code> the moment you change the matrix
            inputs, and breaching items are pushed straight into the Treatment Plan.
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
        <!-- Toolbar -->
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
             style="min-height:40px; grid-template-columns: 64px minmax(0,260px) minmax(0,1fr) 150px 90px 90px 80px 40px;">
          <div>ID</div>
          <div>ASSET / THREAT</div>
          <div>VULNERABILITY · CONTROLS</div>
          <div>OWNER</div>
          <div class="text-center">L</div>
          <div class="text-center">I</div>
          <div class="text-center">SCORE</div>
          <div></div>
        </div>

        <!-- Body -->
        <div class="divide-y divide-line-soft" >
          @for (risk of filteredRisks(); track risk.id) {
            <div class="tbl-grid tbl-row hover:bg-surface-2 relative"
                 style="grid-template-columns: 64px minmax(0,260px) minmax(0,1fr) 150px 90px 90px 80px 40px;"
                 [class.bg-bg-2]="risk.reviewRequired">
              @if (risk.reviewRequired) {
                <span class="absolute inset-y-0 left-0 w-[2px]" style="background: var(--warn)"></span>
              }

              <div>
                <span class="font-mono text-[12px] text-fg-2">{{ risk.id }}</span>
              </div>

              <div class="min-w-0">
                <div class="text-[13px] text-fg truncate font-medium">{{ risk.asset }}</div>
                <div class="text-[11.5px] text-fg-3 truncate">{{ risk.threat }}</div>
              </div>

              <div class="min-w-0">
                <div class="text-[12.5px] text-fg-2 truncate">{{ risk.vulnerability }}</div>
                <div class="text-[11px] text-fg-4 truncate">Existing: {{ risk.existingControls }}</div>
                @if (risk.reviewRequired) {
                  <div class="mt-1 flex items-center gap-1.5">
                    <span class="pill pill-warn"><span class="dot"></span>Review required</span>
                    @if (risk.reviewReason) {
                      <span class="text-[10.5px] font-mono text-fg-4">· {{ risk.reviewReason }}</span>
                    }
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
                <span class="font-mono text-[13px] text-fg">{{ risk.impact }}</span>
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

        <!-- Footer with seed scenario -->
        <div class="px-5 py-3 border-t border-line-soft bg-bg-2 flex items-center justify-between text-[11.5px] text-fg-3">
          <span>
            Showing <b class="text-fg">{{ filteredRisks().length }}</b> of {{ store.registerSummary().total }} ·
            avg score <b class="text-fg">{{ store.registerSummary().avgScore }}</b>
          </span>
          <span class="flex items-center gap-2 font-mono text-[10px] tracking-wider text-fg-4">
            <svg lucideSparkles class="w-3 h-3 text-accent"></svg>
            COMPUTED · L × I AT WRITE
          </span>
        </div>
      </section>
    </div>

    <!-- ===== Create / Edit modal ===== -->
    @if (modalOpen()) {
      <div class="overlay" (click)="closeModal($event)">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="px-6 py-4 border-b border-line-soft flex items-start justify-between gap-3">
            <div>
              <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">
                {{ editingId() ? 'EDIT RISK' : 'NEW RISK' }}
              </div>
              <div class="text-[18px] font-semibold text-fg mt-0.5">
                {{ editingId() ? editingId() : 'Capture inherent risk' }}
              </div>
              <div class="text-[12px] text-fg-3 mt-0.5">
                Score is recomputed automatically and the row enters Treatment if it lands at or above the threshold.
              </div>
            </div>
            <button class="btn-iconplain" aria-label="Close" (click)="modalOpen.set(false)">
              <svg lucideX class="w-3.5 h-3.5"></svg>
            </button>
          </div>

          <div class="px-6 py-5 grid grid-cols-2 gap-4">
            <label class="flex flex-col gap-1.5 col-span-2">
              <span class="text-[11px] font-mono tracking-[0.12em] text-fg-4">ASSET NAME</span>
              <div class="input-shell">
                <input type="text" placeholder="e.g. Customer Data Laptops"
                       [ngModel]="draft().asset"
                       (ngModelChange)="patch({ asset: $event })" />
              </div>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-mono tracking-[0.12em] text-fg-4">THREAT</span>
              <div class="input-shell">
                <input type="text" placeholder="e.g. Theft of device"
                       [ngModel]="draft().threat"
                       (ngModelChange)="patch({ threat: $event })" />
              </div>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-mono tracking-[0.12em] text-fg-4">VULNERABILITY</span>
              <div class="input-shell">
                <input type="text" placeholder="e.g. Lack of full-disk encryption"
                       [ngModel]="draft().vulnerability"
                       (ngModelChange)="patch({ vulnerability: $event })" />
              </div>
            </label>

            <label class="flex flex-col gap-1.5 col-span-2">
              <span class="text-[11px] font-mono tracking-[0.12em] text-fg-4">IMPACT DESCRIPTION</span>
              <textarea class="bare" rows="2"
                        placeholder="e.g. Unauthorized data disclosure"
                        [ngModel]="draft().impactDescription"
                        (ngModelChange)="patch({ impactDescription: $event })"></textarea>
            </label>

            <label class="flex flex-col gap-1.5 col-span-2">
              <span class="text-[11px] font-mono tracking-[0.12em] text-fg-4">EXISTING CONTROLS</span>
              <div class="input-shell">
                <input type="text" placeholder="e.g. MFA on login, asset tagging"
                       [ngModel]="draft().existingControls"
                       (ngModelChange)="patch({ existingControls: $event })" />
              </div>
            </label>

            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-mono tracking-[0.12em] text-fg-4">RISK OWNER</span>
              <div class="input-shell">
                <input type="text" placeholder="e.g. Marko K."
                       [ngModel]="draft().owner"
                       (ngModelChange)="patch({ owner: $event })" />
              </div>
            </label>

            <div class="flex items-end gap-3">
              <label class="flex-1 flex flex-col gap-1.5">
                <span class="text-[11px] font-mono tracking-[0.12em] text-fg-4">LIKELIHOOD</span>
                <select class="bare"
                        [ngModel]="draft().likelihood"
                        (ngModelChange)="setScale('likelihood', $event)">
                  @for (point of store.likelihoodScale(); track point.value) {
                    <option [ngValue]="point.value">{{ point.value }} · {{ point.label }}</option>
                  }
                </select>
              </label>
              <label class="flex-1 flex flex-col gap-1.5">
                <span class="text-[11px] font-mono tracking-[0.12em] text-fg-4">IMPACT</span>
                <select class="bare"
                        [ngModel]="draft().impact"
                        (ngModelChange)="setScale('impact', $event)">
                  @for (point of store.impactScale(); track point.value) {
                    <option [ngValue]="point.value">{{ point.value }} · {{ point.label }}</option>
                  }
                </select>
              </label>
            </div>

            <!-- Live score preview spans both -->
            <div class="col-span-2 rounded-lg border border-line-soft bg-bg-2 p-4 grid grid-cols-[1fr_auto] items-center gap-4">
              <div>
                <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">INHERENT RISK SCORE</div>
                <div class="mt-1 text-[12.5px] text-fg-2 leading-snug">
                  Likelihood <b class="text-fg">{{ draft().likelihood }}</b> × Impact
                  <b class="text-fg">{{ draft().impact }}</b> ={{ ' ' }}
                  <b class="text-fg">{{ draftScore() }}</b>
                  <span class="text-fg-4"> / {{ store.maxScore() }}</span>
                  · classified as
                  <b class="text-fg">{{ store.severityLabel(draftScore()) }}</b>
                  @if (draftScore() >= store.acceptanceThreshold()) {
                    · routes to Treatment Plan
                  }
                </div>
              </div>
              <span class="inline-flex items-center justify-center w-16 h-12 rounded-md font-mono text-[18px] font-semibold"
                    [class]="store.severityClass(draftScore())">
                {{ draftScore() }}
              </span>
            </div>
          </div>

          <div class="px-6 py-4 border-t border-line-soft bg-bg-2 flex items-center justify-end gap-2">
            @if (editingId()) {
              <button class="btn-ghost" (click)="onDelete()">
                <svg lucideTrash2 class="w-3.5 h-3.5"></svg>
                Delete
              </button>
            }
            <button class="btn-secondary" (click)="modalOpen.set(false)">Cancel</button>
            <button class="btn-primary" (click)="onSave()" [disabled]="!isDraftValid()">
              <svg lucideShieldCheck class="w-3.5 h-3.5"></svg>
              {{ editingId() ? 'Save changes' : 'Add to register' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class RegisterView {
  readonly store = inject(IsmsStore);

  readonly query = signal('');
  readonly filterBreaching = signal<boolean | null>(null);

  readonly modalOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly draft = signal<DraftRisk>({ ...EMPTY_DRAFT });

  readonly draftScore = computed(
    () => this.draft().likelihood * this.draft().impact,
  );

  readonly filteredRisks = computed(() => {
    const q = this.query().trim().toLowerCase();
    const bf = this.filterBreaching();
    return this.store.enrichedRisks().filter((r) => {
      if (bf !== null && r.breaches !== bf) return false;
      if (!q) return true;
      return [
        r.asset,
        r.threat,
        r.vulnerability,
        r.owner,
        r.impactDescription,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  });

  isDraftValid(): boolean {
    const d = this.draft();
    return !!(d.asset.trim() && d.threat.trim() && d.owner.trim());
  }

  patch(value: Partial<DraftRisk>) {
    this.draft.update((d) => ({ ...d, ...value }));
  }

  setScale(field: 'likelihood' | 'impact', value: number | string) {
    const v = Number(value) as ScaleValue;
    this.patch({ [field]: v } as Partial<DraftRisk>);
  }

  openCreate() {
    this.editingId.set(null);
    this.draft.set({ ...EMPTY_DRAFT });
    this.modalOpen.set(true);
  }

  openEdit(risk: Risk) {
    this.editingId.set(risk.id);
    this.draft.set({
      asset: risk.asset,
      threat: risk.threat,
      vulnerability: risk.vulnerability,
      impactDescription: risk.impactDescription,
      existingControls: risk.existingControls,
      owner: risk.owner,
      ownerInitials: risk.ownerInitials,
      likelihood: risk.likelihood,
      impact: risk.impact,
    });
    this.modalOpen.set(true);
  }

  closeModal(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.modalOpen.set(false);
    }
  }

  onSave() {
    if (!this.isDraftValid()) return;
    const d = this.draft();
    const ownerInitials = d.ownerInitials || initials(d.owner);
    const editing = this.editingId();
    if (editing) {
      this.store.updateRisk(editing, {
        ...d,
        ownerInitials,
        likelihood: d.likelihood as ScaleValue,
        impact: d.impact as ScaleValue,
      });
    } else {
      this.store.addRisk({
        ...d,
        ownerInitials,
        likelihood: d.likelihood as ScaleValue,
        impact: d.impact as ScaleValue,
      });
    }
    this.modalOpen.set(false);
  }

  onDelete() {
    const id = this.editingId();
    if (!id) return;
    this.store.removeRisk(id);
    this.modalOpen.set(false);
  }

  confirmRemove(id: string) {
    if (confirm(`Remove risk ${id}? Linked treatments will also be cleared.`)) {
      this.store.removeRisk(id);
    }
  }

  resetFilters() {
    this.query.set('');
    this.filterBreaching.set(null);
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
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
