import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideArchive,
  LucideChevronDown,
  LucideColumns3,
  LucideEdit3,
  LucideEye,
  LucideFilter,
  LucideMoreHorizontal,
  LucidePlus,
  LucideSearch,
  LucideShare2,
  LucideShieldCheck,
  LucideTrash2,
  LucideUsers,
} from '@lucide/angular';

import { Classification, InfoAsset, SEED } from './inventory-information.data';

@Component({
  standalone: true,
  selector: 'app-inventory-information',
  imports: [
    FormsModule,
    RouterLink,
    LucideArchive,
    LucideChevronDown,
    LucideColumns3,
    LucideEdit3,
    LucideEye,
    LucideFilter,
    LucideMoreHorizontal,
    LucidePlus,
    LucideSearch,
    LucideShare2,
    LucideShieldCheck,
    LucideTrash2,
    LucideUsers,
  ],
  host: { '(document:click)': 'closePopovers()' },
  template: `
    <div class="flex-1 flex flex-col min-h-0 px-10 pt-6 pb-6 max-w-[1480px] mx-auto w-full">

      <!-- Table card — fills available height; only body scrolls -->
      <section class="flex-1 min-h-0 flex flex-col rounded-xl border border-line-soft bg-surface overflow-hidden">

        <!-- TOP TOOLBAR -->
        <div class="shrink-0 px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-3 flex-wrap relative">

          <!-- Search -->
          <div class="flex items-center h-8 w-[260px] bg-bg border border-line-soft rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_2px_var(--accent-dim)]">
            <span class="pl-2.5 text-fg-4"><svg lucideSearch class="w-3.5 h-3.5"></svg></span>
            <input
              class="flex-1 bg-transparent border-0 outline-none px-2 text-[12.5px] text-fg placeholder:text-fg-4 h-full min-w-0"
              placeholder="Search ID, name, location…"
              [ngModel]="query()"
              (ngModelChange)="query.set($event)" />
            <kbd class="mr-2 font-mono text-[9.5px] tracking-wider text-fg-4 border border-line-soft rounded px-1 py-0.5">⌘K</kbd>
          </div>

          <div class="flex-1"></div>

          <!-- Filters popover -->
          <div class="relative" (click)="$event.stopPropagation()">
            <button type="button"
                    [class.bg-surface-hi]="popover() === 'filters'"
                    [class.text-fg]="popover() === 'filters'"
                    class="inline-flex items-center gap-1.5 h-8 px-3 border border-line-soft rounded-md text-[12.5px] text-fg-2 hover:text-fg hover:bg-surface-hi"
                    (click)="togglePopover('filters')">
              <svg lucideFilter class="w-3.5 h-3.5"></svg>
              Filters
              @if (activeFilterCount() > 0) {
                <span class="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-fg font-mono text-[10px]">
                  {{ activeFilterCount() }}
                </span>
              }
            </button>

            @if (popover() === 'filters') {
              <div class="absolute top-[calc(100%+6px)] right-0 z-30 w-[300px] bg-surface border border-line rounded-lg shadow-lg-soft p-1">
                <div class="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
                  <span class="text-[12px] font-semibold text-fg">Filters</span>
                  <button type="button" class="text-[11px] font-mono text-fg-4 hover:text-fg-2 tracking-wider"
                          (click)="clearFilters()">CLEAR ALL</button>
                </div>
                <div class="px-3 py-2 border-t border-line-soft">
                  <div class="text-[10.5px] font-mono text-fg-4 tracking-[0.12em] mb-2">CLASSIFICATION</div>
                  <div class="flex flex-col gap-1.5">
                    @for (c of classifications; track c) {
                      <label class="flex items-center gap-2 text-[12.5px] text-fg-2 cursor-pointer">
                        <input type="checkbox" class="tbl-check"
                               [checked]="classificationFilter().has(c)"
                               (change)="toggleClassification(c)" />
                        {{ c }}
                        <span class="ml-auto font-mono text-[10.5px] text-fg-4">{{ countOf(c) }}</span>
                      </label>
                    }
                  </div>
                </div>
                <div class="px-3 py-2 border-t border-line-soft">
                  <div class="text-[10.5px] font-mono text-fg-4 tracking-[0.12em] mb-2">OWNER</div>
                  <div class="flex flex-col gap-1.5">
                    @for (o of ownerList; track o) {
                      <label class="flex items-center gap-2 text-[12.5px] text-fg-2 cursor-pointer">
                        <input type="checkbox" class="tbl-check"
                               [checked]="ownerFilter().has(o)"
                               (change)="toggleOwner(o)" />
                        {{ o }}
                      </label>
                    }
                  </div>
                </div>
                <div class="px-3 py-2.5 border-t border-line-soft flex items-center justify-end gap-2">
                  <button type="button" class="h-7 px-2.5 text-[12px] text-fg-3 hover:text-fg"
                          (click)="closePopovers()">Cancel</button>
                  <button type="button" class="h-7 px-3 bg-accent text-accent-fg rounded text-[12px] font-medium"
                          (click)="closePopovers()">Apply</button>
                </div>
              </div>
            }
          </div>

          <!-- Columns popover -->
          <div class="relative" (click)="$event.stopPropagation()">
            <button type="button"
                    [class.bg-surface-hi]="popover() === 'columns'"
                    [class.text-fg]="popover() === 'columns'"
                    class="inline-flex items-center gap-1.5 h-8 px-3 border border-line-soft rounded-md text-[12.5px] text-fg-2 hover:text-fg hover:bg-surface-hi"
                    (click)="togglePopover('columns')">
              <svg lucideColumns3 class="w-3.5 h-3.5"></svg>
              Columns
            </button>

            @if (popover() === 'columns') {
              <div class="absolute top-[calc(100%+6px)] right-0 z-30 w-[220px] bg-surface border border-line rounded-lg shadow-lg-soft p-1">
                <div class="px-3 pt-2.5 pb-1.5 text-[10.5px] font-mono text-fg-4 tracking-[0.12em]">VISIBLE COLUMNS</div>
                <div class="flex flex-col px-1 pb-1">
                  @for (col of columns; track col.key) {
                    <label class="flex items-center gap-2 px-2 py-1.5 rounded text-[12.5px] text-fg-2 cursor-pointer hover:bg-bg-2">
                      <input type="checkbox" class="tbl-check"
                             [checked]="visibleCols().has(col.key)"
                             (change)="toggleColumn(col.key)" />
                      {{ col.label }}
                    </label>
                  }
                </div>
              </div>
            }
          </div>

          <div class="h-5 w-px bg-line-soft"></div>

          <button type="button" class="inline-flex items-center gap-1.5 h-8 px-3 border border-line-soft bg-surface rounded-md text-[12.5px] text-fg-2 hover:text-fg hover:bg-surface-hi">
            <svg lucideUsers class="w-3.5 h-3.5"></svg>
            Assign…
          </button>
          <button type="button" class="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3 bg-accent text-accent-fg rounded-md text-[12.5px] font-semibold hover:opacity-90">
            <svg lucidePlus class="w-3.5 h-3.5"></svg>
            New asset
          </button>
        </div>

        <!-- PANE (with bulk-bar overlay) — flex container so the body can scroll -->
        <div class="relative flex-1 min-h-0 flex flex-col">

          <!-- BULK BAR -->
          @if (selectedIds().size > 0) {
            <div class="absolute inset-x-0 top-0 z-20 h-11 px-5 border-b border-line-soft bg-surface-hi flex items-center gap-3">
              <span class="inline-flex items-center gap-2 text-[12.5px] text-fg">
                <span class="font-mono text-[11px] tracking-wider bg-accent text-accent-fg px-1.5 py-0.5 rounded">{{ selectedIds().size }}</span>
                <span>selected</span>
                <button type="button" class="ml-1 text-fg-3 hover:text-fg text-[11.5px] font-mono tracking-wider"
                        (click)="clearSelection()">CLEAR</button>
              </span>
              <div class="h-4 w-px bg-line-soft ml-1"></div>
              <button type="button" class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] text-fg-2 hover:text-fg hover:bg-bg-2">
                <svg lucideUsers class="w-3.5 h-3.5"></svg>Assign…
              </button>
              <button type="button" class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] text-fg-2 hover:text-fg hover:bg-bg-2">
                <svg lucideShare2 class="w-3.5 h-3.5"></svg>Share
              </button>
              <button type="button" class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] text-fg-2 hover:text-fg hover:bg-bg-2">
                <svg lucideArchive class="w-3.5 h-3.5"></svg>Archive
              </button>
              <div class="flex-1"></div>
              <button type="button" class="inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-[12px] text-danger hover:bg-bg-2">
                <svg lucideTrash2 class="w-3.5 h-3.5"></svg>Delete
              </button>
            </div>
          }

          <!-- HEADER ROW (fixed) -->
          <div class="shrink-0 tbl-grid tbl-row border-b border-line-soft bg-bg-2 text-fg-4 text-[10.5px] font-mono tracking-[0.12em]"
               [style.grid-template-columns]="gridTemplate()" style="min-height:40px">
            <div>
              <input type="checkbox" class="tbl-check"
                     [checked]="allSelected()"
                     (change)="toggleSelectAll()" />
            </div>
            @if (isCol('id')) {
              <div>ID <svg lucideChevronDown class="inline-block w-2.5 h-2.5 -mt-0.5"></svg></div>
            }
            @if (isCol('name')) { <div>NAME · LOCATION</div> }
            @if (isCol('owner')) { <div>OWNER</div> }
            @if (isCol('classification')) { <div>CLASSIFICATION</div> }
            @if (isCol('cia')) { <div class="text-center">C · I · A</div> }
            @if (isCol('reviewed')) { <div>REVIEWED</div> }
            <div></div>
          </div>

          <!-- BODY (scrollable) -->
          <div class="flex-1 min-h-0 overflow-y-auto divide-y divide-line-soft">
            @for (a of filtered(); track a.id) {
              <div class="tbl-grid tbl-row hover:bg-surface-2 transition-colors relative group"
                   [style.grid-template-columns]="gridTemplate()"
                   [attr.data-selected]="selectedIds().has(a.id) ? '1' : null">
                @if (selectedIds().has(a.id)) {
                  <span class="absolute inset-y-0 left-0 w-[2px]" style="background: var(--accent)"></span>
                }

                <div>
                  <input type="checkbox" class="tbl-check"
                         [checked]="selectedIds().has(a.id)"
                         (change)="toggleSelect(a.id)" />
                </div>

                @if (isCol('id')) {
                  <div>
                    <a [routerLink]="['/', 'inventory', 'information', a.id]"
                       class="font-mono text-[12px] text-fg-2 hover:text-accent">{{ a.id }}</a>
                  </div>
                }

                @if (isCol('name')) {
                  <a [routerLink]="['/', 'inventory', 'information', a.id]"
                     class="min-w-0 block cursor-pointer">
                    <div class="text-[13px] text-fg truncate group-hover:text-accent">{{ a.name }}</div>
                    <div class="text-[11px] text-fg-4 truncate">{{ a.location }}</div>
                  </a>
                }

                @if (isCol('owner')) {
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-6 h-6 rounded-full grid place-items-center text-[10px] font-semibold"
                          [style.background]="ownerColor(a.ownerInitials).bg"
                          [style.color]="ownerColor(a.ownerInitials).fg">
                      {{ a.ownerInitials }}
                    </span>
                    <span class="text-[12.5px] text-fg-2 truncate">{{ a.owner }}</span>
                  </div>
                }

                @if (isCol('classification')) {
                  <div>
                    <span class="tok" [class]="classificationBadgeClass(a.classification)">
                      {{ a.classification }}
                    </span>
                  </div>
                }

                @if (isCol('cia')) {
                  <div class="grid place-items-center">
                    <div class="flex items-center gap-0.5">
                      <span class="impact-dot" [style.background]="dimColor(a.cia.c)" title="Confidentiality">{{ a.cia.c }}</span>
                      <span class="impact-dot" [style.background]="dimColor(a.cia.i)" title="Integrity">{{ a.cia.i }}</span>
                      <span class="impact-dot" [style.background]="dimColor(a.cia.a)" title="Availability">{{ a.cia.a }}</span>
                    </div>
                  </div>
                }

                @if (isCol('reviewed')) {
                  <div>
                    <span class="font-mono text-[11px]"
                          [class.text-danger]="a.reviewedTone === 'overdue'"
                          [class.text-warn]="a.reviewedTone === 'stale'"
                          [class.text-fg-3]="a.reviewedTone === 'fresh'">
                      {{ a.reviewed }}
                    </span>
                  </div>
                }

                <!-- Row actions (hidden until hover) -->
                <div class="justify-self-end opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  <a aria-label="View" [routerLink]="['/', 'inventory', 'information', a.id]" class="w-7 h-7 grid place-items-center rounded text-fg-3 hover:text-fg hover:bg-surface-hi"><svg lucideEye class="w-3.5 h-3.5"></svg></a>
                  <button aria-label="Edit"  class="w-7 h-7 grid place-items-center rounded text-fg-3 hover:text-fg hover:bg-surface-hi"><svg lucideEdit3 class="w-3.5 h-3.5"></svg></button>
                  <button aria-label="More"  class="w-7 h-7 grid place-items-center rounded text-fg-3 hover:text-fg hover:bg-surface-hi"><svg lucideMoreHorizontal class="w-3.5 h-3.5"></svg></button>
                </div>
              </div>
            } @empty {
              <div class="px-10 py-16 text-center">
                <div class="text-[13px] text-fg-2">No information assets match the current filters.</div>
                <button class="btn-ghost mt-3" (click)="clearFilters(); query.set('')">Reset filters</button>
              </div>
            }
          </div>

          <!-- FOOTER (fixed) -->
          <div class="shrink-0 px-5 py-3 border-t border-line-soft bg-bg-2 flex items-center justify-between text-[11.5px] text-fg-3">
            <span>
              Showing <b class="text-fg">{{ filtered().length }}</b> of {{ assets.length }} ·
              {{ selectedIds().size }} selected
            </span>
            <span class="flex items-center gap-2 font-mono text-[10px] tracking-wider text-fg-4">
              <svg lucideShieldCheck class="w-3 h-3 text-accent"></svg>
              SCOPE · INFORMATION ASSETS
            </span>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }

      .impact-dot {
        width: 18px;
        height: 18px;
        display: inline-grid;
        place-items: center;
        font: 600 10px/1 'JetBrains Mono', monospace;
        color: rgba(0, 0, 0, 0.78);
        border-radius: 4px;
      }
    `,
  ],
})
export class InventoryInformationView {
  // Data
  readonly assets: InfoAsset[] = SEED;

  readonly classifications: Classification[] = ['Public', 'Internal', 'Confidential', 'Restricted'];

  readonly columns: { key: string; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name · Location' },
    { key: 'owner', label: 'Owner' },
    { key: 'classification', label: 'Classification' },
    { key: 'cia', label: 'C · I · A' },
    { key: 'reviewed', label: 'Reviewed' },
  ];

  // State signals
  readonly query = signal('');
  readonly classificationFilter = signal<Set<Classification>>(new Set());
  readonly ownerFilter = signal<Set<string>>(new Set());
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly popover = signal<'filters' | 'columns' | null>(null);
  readonly visibleCols = signal<Set<string>>(
    new Set(['id', 'name', 'owner', 'classification', 'cia', 'reviewed']),
  );

  readonly ownerList = Array.from(new Set(SEED.map((a) => a.owner))).sort();

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cf = this.classificationFilter();
    const of_ = this.ownerFilter();
    return this.assets.filter((a) => {
      if (cf.size > 0 && !cf.has(a.classification)) return false;
      if (of_.size > 0 && !of_.has(a.owner)) return false;
      if (!q) return true;
      return `${a.id} ${a.name} ${a.location} ${a.owner}`.toLowerCase().includes(q);
    });
  });

  readonly activeFilterCount = computed(
    () => this.classificationFilter().size + this.ownerFilter().size,
  );

  readonly allSelected = computed(() => {
    const visible = this.filtered();
    if (visible.length === 0) return false;
    const ids = this.selectedIds();
    return visible.every((a) => ids.has(a.id));
  });

  readonly overdueCount = computed(
    () => this.assets.filter((a) => a.reviewedTone === 'overdue').length,
  );

  countOf(c: Classification): number {
    return this.assets.filter((a) => a.classification === c).length;
  }

  // -------- Popovers --------
  togglePopover(key: 'filters' | 'columns') {
    this.popover.update((p) => (p === key ? null : key));
  }
  closePopovers() {
    this.popover.set(null);
  }

  // -------- Selection --------
  toggleSelect(id: string) {
    this.selectedIds.update((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  toggleSelectAll() {
    const visibleIds = this.filtered().map((a) => a.id);
    const allHit = this.allSelected();
    this.selectedIds.update((s) => {
      const next = new Set(s);
      if (allHit) for (const id of visibleIds) next.delete(id);
      else for (const id of visibleIds) next.add(id);
      return next;
    });
  }
  clearSelection() {
    this.selectedIds.set(new Set());
  }

  // -------- Filters --------
  toggleClassification(c: Classification) {
    this.classificationFilter.update((s) => {
      const next = new Set(s);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }
  toggleOwner(o: string) {
    this.ownerFilter.update((s) => {
      const next = new Set(s);
      next.has(o) ? next.delete(o) : next.add(o);
      return next;
    });
  }
  clearFilters() {
    this.classificationFilter.set(new Set());
    this.ownerFilter.set(new Set());
  }

  // -------- Columns --------
  isCol(key: string): boolean {
    return this.visibleCols().has(key);
  }
  toggleColumn(key: string) {
    this.visibleCols.update((s) => {
      const next = new Set(s);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }
  gridTemplate(): string {
    const parts = ['32px']; // checkbox column
    if (this.isCol('id')) parts.push('92px');
    if (this.isCol('name')) parts.push('minmax(0, 1fr)');
    if (this.isCol('owner')) parts.push('150px');
    if (this.isCol('classification')) parts.push('150px');
    if (this.isCol('cia')) parts.push('100px');
    if (this.isCol('reviewed')) parts.push('92px');
    parts.push('40px'); // actions
    return parts.join(' ');
  }

  // -------- Visual helpers --------
  classificationBadgeClass(c: Classification): string {
    switch (c) {
      case 'Public':       return 'tok-ok';
      case 'Internal':     return 'tok-info';
      case 'Confidential': return 'tok-warn';
      case 'Restricted':   return 'tok-danger';
    }
  }

  dimColor(value: number): string {
    if (value >= 5) return 'rgb(242 164 164 / 0.85)';
    if (value === 4) return 'rgb(229 152 90 / 0.85)';
    if (value === 3) return 'rgb(240 201 135 / 0.85)';
    if (value === 2) return 'rgb(140 240 200 / 0.65)';
    return 'rgb(140 240 200 / 0.40)';
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
