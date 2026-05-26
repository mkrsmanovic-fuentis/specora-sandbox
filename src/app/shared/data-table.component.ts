import { Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideArchive,
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

export interface TableColumn {
  key: string;
  label: string;
  /** Visual cell renderer. */
  kind: 'mono' | 'text' | 'name' | 'badge';
  /** Grid track size, e.g. '92px' or 'minmax(0, 1fr)'. */
  width: string;
  align?: 'left' | 'center';
  /** Primary cell value. */
  get: (row: any) => string;
  /** Sub-line value (kind === 'name'). */
  sub?: (row: any) => string;
  /** Badge tone class, e.g. 'tok-ok' (kind === 'badge'). */
  badgeClass?: (row: any) => string;
}

/**
 * Generic data table — same shell as the inventory information table:
 * search · Filters · Columns toolbar, select-all/row checkboxes, bulk bar,
 * scrollable body, hover row actions, footer. Reuses the global .tbl-* / .pill-* classes.
 */
@Component({
  standalone: true,
  selector: 'app-data-table',
  imports: [
    FormsModule,
    LucideArchive,
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
    <section class="flex-1 min-h-0 flex flex-col rounded-xl border border-line-soft bg-surface overflow-hidden">

      <!-- TOP TOOLBAR -->
      <div class="shrink-0 px-5 py-3 border-b border-line-soft bg-bg-2 flex items-center gap-3 flex-wrap relative">

        <!-- Search -->
        <div class="flex items-center h-8 w-[260px] bg-bg border border-line-soft rounded-md focus-within:border-accent focus-within:shadow-[0_0_0_2px_var(--accent-dim)]">
          <span class="pl-2.5 text-fg-4"><svg lucideSearch class="w-3.5 h-3.5"></svg></span>
          <input
            class="flex-1 bg-transparent border-0 outline-none px-2 text-[12.5px] text-fg placeholder:text-fg-4 h-full min-w-0"
            [placeholder]="searchPlaceholder()"
            [ngModel]="query()"
            (ngModelChange)="query.set($event)" />
          <kbd class="mr-2 font-mono text-[9.5px] tracking-wider text-fg-4 border border-line-soft rounded px-1 py-0.5">⌘K</kbd>
        </div>

        <div class="flex-1"></div>

        <!-- Filters popover -->
        @if (filterKey()) {
          <div class="relative" (click)="$event.stopPropagation()">
            <button type="button"
                    [class.bg-surface-hi]="popover() === 'filters'"
                    [class.text-fg]="popover() === 'filters'"
                    class="inline-flex items-center gap-1.5 h-8 px-3 border border-line-soft rounded-md text-[12.5px] text-fg-2 hover:text-fg hover:bg-surface-hi"
                    (click)="togglePopover('filters')">
              <svg lucideFilter class="w-3.5 h-3.5"></svg>
              Filters
              @if (filterSet().size > 0) {
                <span class="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-accent-fg font-mono text-[10px]">
                  {{ filterSet().size }}
                </span>
              }
            </button>

            @if (popover() === 'filters') {
              <div class="absolute top-[calc(100%+6px)] right-0 z-30 w-[260px] bg-surface border border-line rounded-lg shadow-lg-soft p-1">
                <div class="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
                  <span class="text-[12px] font-semibold text-fg">{{ filterLabel() }}</span>
                  <button type="button" class="text-[11px] font-mono text-fg-4 hover:text-fg-2 tracking-wider"
                          (click)="clearFilters()">CLEAR ALL</button>
                </div>
                <div class="px-3 py-2 border-t border-line-soft flex flex-col gap-1.5">
                  @for (v of filterValues(); track v) {
                    <label class="flex items-center gap-2 text-[12.5px] text-fg-2 cursor-pointer">
                      <input type="checkbox" class="tbl-check"
                             [checked]="filterSet().has(v)"
                             (change)="toggleFilter(v)" />
                      {{ v }}
                      <span class="ml-auto font-mono text-[10.5px] text-fg-4">{{ countOf(v) }}</span>
                    </label>
                  }
                </div>
              </div>
            }
          </div>
        }

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
                @for (col of columns(); track col.key) {
                  <label class="flex items-center gap-2 px-2 py-1.5 rounded text-[12.5px] text-fg-2 cursor-pointer hover:bg-bg-2">
                    <input type="checkbox" class="tbl-check"
                           [checked]="isVisible(col.key)"
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
          {{ primaryLabel() }}
        </button>
      </div>

      <!-- PANE (with bulk-bar overlay) -->
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

        <!-- HEADER ROW -->
        <div class="shrink-0 tbl-grid tbl-row border-b border-line-soft bg-bg-2 text-fg-4 text-[10.5px] font-mono tracking-[0.12em]"
             [style.grid-template-columns]="gridTemplate()" style="min-height:40px">
          <div>
            <input type="checkbox" class="tbl-check"
                   [checked]="allSelected()"
                   (change)="toggleSelectAll()" />
          </div>
          @for (col of visibleColumns(); track col.key) {
            <div [class.text-center]="col.align === 'center'">{{ col.label }}</div>
          }
          <div></div>
        </div>

        <!-- BODY -->
        <div class="flex-1 min-h-0 overflow-y-auto divide-y divide-line-soft">
          @for (row of filtered(); track row[idKey()]) {
            <div class="tbl-grid tbl-row hover:bg-surface-2 transition-colors relative group"
                 [style.grid-template-columns]="gridTemplate()"
                 [attr.data-selected]="selectedIds().has(row[idKey()]) ? '1' : null">
              @if (selectedIds().has(row[idKey()])) {
                <span class="absolute inset-y-0 left-0 w-[2px]" style="background: var(--accent)"></span>
              }

              <div>
                <input type="checkbox" class="tbl-check"
                       [checked]="selectedIds().has(row[idKey()])"
                       (change)="toggleSelect(row[idKey()])" />
              </div>

              @for (col of visibleColumns(); track col.key) {
                @switch (col.kind) {
                  @case ('mono') {
                    <div [class.text-center]="col.align === 'center'">
                      <span class="font-mono text-[12px] text-fg-2">{{ col.get(row) }}</span>
                    </div>
                  }
                  @case ('name') {
                    <div class="min-w-0">
                      <div class="text-[13px] text-fg truncate">{{ col.get(row) }}</div>
                      @if (col.sub) {
                        <div class="text-[11px] text-fg-4 truncate">{{ col.sub(row) }}</div>
                      }
                    </div>
                  }
                  @case ('badge') {
                    <div [class.text-center]="col.align === 'center'">
                      <span class="tok" [class]="col.badgeClass ? col.badgeClass(row) : 'tok-default'">
                        {{ col.get(row) }}
                      </span>
                    </div>
                  }
                  @default {
                    <div class="min-w-0" [class.text-center]="col.align === 'center'">
                      <span class="text-[12.5px] text-fg-2 truncate">{{ col.get(row) }}</span>
                    </div>
                  }
                }
              }

              <!-- Row actions -->
              <div class="justify-self-end opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                <button aria-label="View"  class="w-7 h-7 grid place-items-center rounded text-fg-3 hover:text-fg hover:bg-surface-hi"><svg lucideEye class="w-3.5 h-3.5"></svg></button>
                <button aria-label="Edit"  class="w-7 h-7 grid place-items-center rounded text-fg-3 hover:text-fg hover:bg-surface-hi"><svg lucideEdit3 class="w-3.5 h-3.5"></svg></button>
                <button aria-label="More"  class="w-7 h-7 grid place-items-center rounded text-fg-3 hover:text-fg hover:bg-surface-hi"><svg lucideMoreHorizontal class="w-3.5 h-3.5"></svg></button>
              </div>
            </div>
          } @empty {
            <div class="px-10 py-16 text-center">
              <div class="text-[13px] text-fg-2">No rows match the current filters.</div>
              <button class="btn-ghost mt-3" (click)="clearFilters(); query.set('')">Reset filters</button>
            </div>
          }
        </div>

        <!-- FOOTER -->
        <div class="shrink-0 px-5 py-3 border-t border-line-soft bg-bg-2 flex items-center justify-between text-[11.5px] text-fg-3">
          <span>
            Showing <b class="text-fg">{{ filtered().length }}</b> of {{ rows().length }} ·
            {{ selectedIds().size }} selected
          </span>
          <span class="flex items-center gap-2 font-mono text-[10px] tracking-wider text-fg-4">
            <svg lucideShieldCheck class="w-3 h-3 text-accent"></svg>
            {{ scopeLabel() }}
          </span>
        </div>
      </div>
    </section>
  `,
})
export class DataTableView {
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input.required<any[]>();
  readonly idKey = input<string>('id');
  readonly scopeLabel = input<string>('SCOPE');
  readonly searchPlaceholder = input<string>('Search…');
  readonly primaryLabel = input<string>('New');
  /** Column key to drive the Filters popover (distinct values). Empty = no Filters button. */
  readonly filterKey = input<string>('');

  readonly query = signal('');
  readonly filterSet = signal<Set<string>>(new Set());
  readonly selectedIds = signal<Set<string>>(new Set());
  readonly popover = signal<'filters' | 'columns' | null>(null);
  readonly visibleCols = signal<Set<string> | null>(null);

  private filterColumn(): TableColumn | undefined {
    return this.columns().find((c) => c.key === this.filterKey());
  }
  readonly filterLabel = computed(() => this.filterColumn()?.label ?? 'Filter');
  readonly filterValues = computed(() => {
    const col = this.filterColumn();
    if (!col) return [];
    return Array.from(new Set(this.rows().map((r) => col.get(r)))).sort();
  });

  readonly visibleColumns = computed(() => {
    const vis = this.visibleCols();
    if (!vis) return this.columns();
    return this.columns().filter((c) => vis.has(c.key));
  });

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const fs = this.filterSet();
    const fcol = this.filterColumn();
    const cols = this.columns();
    return this.rows().filter((r) => {
      if (fs.size > 0 && fcol && !fs.has(fcol.get(r))) return false;
      if (!q) return true;
      const hay = cols.map((c) => `${c.get(r)} ${c.sub ? c.sub(r) : ''}`).join(' ').toLowerCase();
      return hay.includes(q);
    });
  });

  readonly allSelected = computed(() => {
    const visible = this.filtered();
    if (visible.length === 0) return false;
    const ids = this.selectedIds();
    const key = this.idKey();
    return visible.every((r) => ids.has(r[key]));
  });

  countOf(v: string): number {
    const col = this.filterColumn();
    if (!col) return 0;
    return this.rows().filter((r) => col.get(r) === v).length;
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
    const key = this.idKey();
    const visibleIds = this.filtered().map((r) => r[key]);
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
  toggleFilter(v: string) {
    this.filterSet.update((s) => {
      const next = new Set(s);
      next.has(v) ? next.delete(v) : next.add(v);
      return next;
    });
  }
  clearFilters() {
    this.filterSet.set(new Set());
  }

  // -------- Columns --------
  isVisible(key: string): boolean {
    const v = this.visibleCols();
    return v ? v.has(key) : true;
  }
  toggleColumn(key: string) {
    this.visibleCols.update((s) => {
      const next = new Set(s ?? this.columns().map((c) => c.key));
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  gridTemplate(): string {
    const parts = ['32px'];
    for (const col of this.visibleColumns()) parts.push(col.width);
    parts.push('40px');
    return parts.join(' ');
  }
}
