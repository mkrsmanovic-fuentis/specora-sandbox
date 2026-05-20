import { UpperCasePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  LucideAlertTriangle,
  LucideLink2,
  LucideSearch,
  LucideSparkles,
  LucideX,
} from '@lucide/angular';

import { IsmsStore } from '../core/isms-store';
import { AnnexControl, ImplementationStatus } from '../core/models';

@Component({
  standalone: true,
  selector: 'app-soa',
  imports: [
    FormsModule,
    LucideAlertTriangle,
    LucideLink2,
    LucideSearch,
    LucideSparkles,
    LucideX,
    UpperCasePipe,
  ],
  template: `
    <div class="px-10 pt-10 pb-24 max-w-[1480px] mx-auto">
      <header class="pb-7 mb-7 border-b border-line-soft flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div class="flex items-center gap-3 flex-wrap mb-2">
            <h1 class="text-3xl font-semibold tracking-tight text-fg">Statement of Applicability</h1>
            <span class="tok tok-default">ISO 27001 · Annex A</span>
          </div>
          <p class="text-[14px] leading-relaxed text-fg-2 max-w-[680px]">
            The auditor-facing register of every Annex A control with applicability, justification, and
            implementation tracking. Treatments classified as <b class="text-fg">Modify</b> in step 03
            link straight into this view.
          </p>
        </div>

        <div class="grid grid-cols-4 gap-2 min-w-[620px]">
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">TOTAL</div>
            <div class="text-[22px] font-semibold text-fg mt-0.5">{{ store.soaSummary().total }}</div>
          </div>
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">APPLICABLE</div>
            <div class="text-[22px] font-semibold text-accent mt-0.5">{{ store.soaSummary().applicable }}</div>
          </div>
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">EXCLUDED</div>
            <div class="text-[22px] font-semibold text-fg-3 mt-0.5">{{ store.soaSummary().excluded }}</div>
          </div>
          <div class="rounded-lg border border-line-soft bg-surface px-4 py-3">
            <div class="font-mono text-[10px] tracking-[0.12em] text-fg-4">IMPLEMENTED</div>
            <div class="text-[22px] font-semibold mt-0.5"
                 [style.color]="store.soaSummary().implemented === store.soaSummary().applicable ? 'var(--accent)' : 'var(--fg)'">
              {{ store.soaSummary().implemented }} / {{ store.soaSummary().applicable }}
            </div>
          </div>
        </div>
      </header>

      <!-- Filter row -->
      <div class="flex items-center gap-3 mb-5 flex-wrap">
        <div class="inline-flex items-center bg-bg border border-line-soft rounded-md p-0.5">
          <button class="h-7 px-2.5 rounded text-[12.5px] font-medium"
                  [class.bg-surface-hi]="appFilter() === 'all'"
                  [class.text-fg]="appFilter() === 'all'"
                  [class.text-fg-3]="appFilter() !== 'all'"
                  (click)="appFilter.set('all')">All</button>
          <button class="h-7 px-2.5 rounded text-[12.5px] font-medium"
                  [class.bg-surface-hi]="appFilter() === 'applicable'"
                  [class.text-fg]="appFilter() === 'applicable'"
                  [class.text-fg-3]="appFilter() !== 'applicable'"
                  (click)="appFilter.set('applicable')">Applicable</button>
          <button class="h-7 px-2.5 rounded text-[12.5px] font-medium"
                  [class.bg-surface-hi]="appFilter() === 'excluded'"
                  [class.text-fg]="appFilter() === 'excluded'"
                  [class.text-fg-3]="appFilter() !== 'excluded'"
                  (click)="appFilter.set('excluded')">Excluded</button>
          <button class="h-7 px-2.5 rounded text-[12.5px] font-medium"
                  [class.bg-surface-hi]="appFilter() === 'linked'"
                  [class.text-fg]="appFilter() === 'linked'"
                  [class.text-fg-3]="appFilter() !== 'linked'"
                  (click)="appFilter.set('linked')">
            Linked to treatments
            <span class="ml-1.5 font-mono text-[10px] text-fg-4">{{ linkedIds().size }}</span>
          </button>
        </div>

        <div class="flex items-center h-8 w-[280px] bg-bg border border-line-soft rounded-md focus-within:border-accent">
          <span class="pl-2.5 text-fg-4"><svg lucideSearch class="w-3.5 h-3.5"></svg></span>
          <input class="flex-1 bg-transparent border-0 outline-none px-2 text-[12.5px] text-fg placeholder:text-fg-4 h-full min-w-0"
                 placeholder="Search Annex A controls…"
                 [ngModel]="query()"
                 (ngModelChange)="query.set($event)" />
        </div>

        @if (highlight()) {
          <span class="inline-flex items-center gap-1.5 px-3 h-8 rounded-md border bg-bg-2"
                style="border-color: var(--line); color: var(--accent);">
            <svg lucideSparkles class="w-3.5 h-3.5"></svg>
            <span class="font-mono text-[11px]">Highlighting {{ highlight() }}</span>
            <button class="text-fg-4 hover:text-fg" (click)="highlight.set('')">
              <svg lucideX class="w-3 h-3"></svg>
            </button>
          </span>
        }
      </div>

      <!-- Groups -->
      <div class="flex flex-col gap-7">
        @for (group of groupedControls(); track group.name) {
          <section>
            <div class="flex items-baseline justify-between mb-3">
              <h2 class="text-[15px] font-semibold text-fg">{{ group.name }}</h2>
              <span class="font-mono text-[10.5px] text-fg-4 tracking-wider">
                {{ group.applicable }} APPLICABLE · {{ group.total }} TOTAL
              </span>
            </div>
            <div class="grid grid-cols-2 gap-4">
              @for (ctrl of group.items; track ctrl.id) {
                <article class="sp-card overflow-hidden"
                         [class.linked-card]="linkedIds().has(ctrl.id)"
                         [class.highlight-card]="highlight() === ctrl.id">
                  <div class="px-5 pt-4 pb-3 flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-mono text-[10.5px] tracking-[0.08em] text-fg-3">{{ ctrl.id }}</span>
                        @if (linkedIds().has(ctrl.id); as flag) {
                          <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9.5px] tracking-wider"
                                style="background: var(--accent-dim); color: var(--accent);">
                            <svg lucideLink2 class="w-3 h-3"></svg>
                            LINKED · {{ linkedRiskCount(ctrl.id) }}
                          </span>
                        }
                      </div>
                      <div class="text-[14px] font-semibold text-fg leading-tight">{{ ctrl.title }}</div>
                    </div>
                    <div class="shrink-0 inline-flex items-center bg-bg-2 border border-line-soft rounded-md p-0.5">
                      <button class="h-6 px-2 rounded text-[11px] font-medium"
                              [class.bg-accent]="ctrl.applicable"
                              [class.text-accent-fg]="ctrl.applicable"
                              [class.text-fg-3]="!ctrl.applicable"
                              (click)="setApplicable(ctrl.id, true)">Applicable</button>
                      <button class="h-6 px-2 rounded text-[11px] font-medium"
                              [class.bg-surface-hi]="!ctrl.applicable"
                              [class.text-fg]="!ctrl.applicable"
                              [class.text-fg-3]="ctrl.applicable"
                              (click)="setApplicable(ctrl.id, false)">Excluded</button>
                    </div>
                  </div>

                  <div class="px-5 pb-4">
                    <label class="flex flex-col gap-1.5">
                      <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">
                        {{ ctrl.applicable ? 'JUSTIFICATION FOR INCLUSION' : 'JUSTIFICATION FOR EXCLUSION' }}
                      </span>
                      <textarea class="bare" rows="2"
                                [ngModel]="ctrl.justification"
                                (ngModelChange)="store.updateControl(ctrl.id, { justification: $event })"
                                [placeholder]="ctrl.applicable
                                  ? 'Why this control applies to your scope and how it maps to policy.'
                                  : 'Why this control is not relevant to your scope.'"></textarea>
                    </label>

                    @if (ctrl.applicable) {
                      <div class="mt-3 grid grid-cols-[1fr_auto] gap-3 items-end">
                        <label class="flex flex-col gap-1">
                          <span class="text-[10px] font-mono tracking-[0.12em] text-fg-4">IMPLEMENTATION STATUS</span>
                          <select class="bare bare-sm"
                                  [ngModel]="ctrl.implementation"
                                  (ngModelChange)="onImplementationChange(ctrl, $event)">
                            <option value="not-started">Not started</option>
                            <option value="in-progress">In progress</option>
                            <option value="implemented">Implemented</option>
                          </select>
                        </label>

                        <div class="text-right">
                          <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">IMPL.</div>
                          <div class="font-mono text-[14px] text-fg">{{ ctrl.implementationPct }}%</div>
                        </div>
                      </div>

                      <div class="mt-2 h-1.5 rounded-full bg-bg-2 overflow-hidden">
                        <div class="h-full rounded-full"
                             [style.width.%]="ctrl.implementationPct"
                             [style.background]="ctrl.implementation === 'implemented' ? 'var(--ok)' :
                                                  ctrl.implementation === 'in-progress' ? 'var(--warn)' :
                                                  'var(--fg-4)'"></div>
                      </div>
                    } @else {
                      <div class="mt-3 flex items-center gap-2 text-[11.5px] text-fg-3">
                        <svg lucideAlertTriangle class="w-3.5 h-3.5 text-fg-4"></svg>
                        Excluded · documented justification required for audit.
                      </div>
                    }
                  </div>

                  @if (linkedIds().has(ctrl.id) && linkedTreatmentsFor(ctrl.id).length > 0) {
                    <div class="px-5 py-3 border-t border-line-soft bg-bg-2 flex flex-col gap-1.5">
                      <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">LINKED TREATMENTS</div>
                      @for (link of linkedTreatmentsFor(ctrl.id); track link.riskId) {
                        <div class="flex items-center gap-2 text-[11.5px]">
                          <span class="font-mono text-fg-3">{{ link.riskId }}</span>
                          <span class="text-fg-2 truncate flex-1">{{ link.asset }} · {{ link.threat }}</span>
                          <span class="pill pill-warn">
                            <span class="dot"></span>{{ link.option }}
                          </span>
                        </div>
                      }
                    </div>
                  }
                </article>
              }
            </div>
          </section>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .linked-card { border-color: rgb(140 240 200 / 0.35); }
      .highlight-card {
        border-color: var(--accent);
        box-shadow: 0 0 0 2px var(--accent-dim), 0 12px 30px -10px rgba(0,0,0,0.5);
      }
    `,
  ],
})
export class SoaView {
  readonly store = inject(IsmsStore);
  private readonly route = inject(ActivatedRoute);

  readonly query = signal('');
  readonly appFilter = signal<'all' | 'applicable' | 'excluded' | 'linked'>('all');
  readonly highlight = signal<string>('');

  readonly linkedIds = computed(() => {
    const ids = new Set<string>();
    for (const t of this.store.treatments()) {
      if (t.option !== 'modify') continue;
      for (const pc of t.plannedControls) ids.add(pc.id);
    }
    return ids;
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const af = this.appFilter();
    return this.store.controls().filter((c) => {
      if (af === 'applicable' && !c.applicable) return false;
      if (af === 'excluded' && c.applicable) return false;
      if (af === 'linked' && !this.linkedIds().has(c.id)) return false;
      if (q && !(`${c.id} ${c.title} ${c.justification}`.toLowerCase().includes(q))) return false;
      return true;
    });
  });

  readonly groupedControls = computed(() => {
    const groups = new Map<string, AnnexControl[]>();
    for (const ctrl of this.filtered()) {
      const list = groups.get(ctrl.group) ?? [];
      list.push(ctrl);
      groups.set(ctrl.group, list);
    }
    return [...groups.entries()].map(([name, items]) => ({
      name,
      items,
      total: items.length,
      applicable: items.filter((i) => i.applicable).length,
    }));
  });

  constructor() {
    effect(() => {
      const id = this.route.snapshot.queryParamMap.get('highlight');
      if (id) {
        this.highlight.set(id);
        this.appFilter.set('all');
      }
    });
  }

  setApplicable(id: string, applicable: boolean) {
    this.store.updateControl(id, { applicable });
  }

  onImplementationChange(ctrl: AnnexControl, status: ImplementationStatus) {
    const pct = status === 'implemented' ? 100 : status === 'in-progress' ? 50 : 0;
    this.store.updateControl(ctrl.id, {
      implementation: status,
      implementationPct: ctrl.implementationPct === 0 || ctrl.implementationPct === 50 || ctrl.implementationPct === 100
        ? pct
        : ctrl.implementationPct,
    });
  }

  linkedRiskCount(controlId: string): number {
    return this.store
      .treatments()
      .filter((t) => t.option === 'modify' && t.plannedControls.some((pc) => pc.id === controlId))
      .length;
  }

  linkedTreatmentsFor(controlId: string) {
    const risks = this.store.risks();
    const inv = this.store.inventoryById();
    const threatsMap = this.store.threatsById();
    return this.store
      .treatments()
      .filter((t) => t.option === 'modify' && t.plannedControls.some((pc) => pc.id === controlId))
      .map((t) => {
        const r = risks.find((x) => x.id === t.riskId);
        const asset = r
          ? r.scopeWide
            ? 'Scope-wide'
            : r.affects.map((id) => inv.get(id)?.name ?? id).join(', ') || 'Unlinked'
          : '';
        const threat = r
          ? r.threats.map((id) => threatsMap.get(id)?.title ?? id).join(' · ') || ''
          : '';
        return { riskId: t.riskId, asset, threat, option: t.option };
      });
  }
}
