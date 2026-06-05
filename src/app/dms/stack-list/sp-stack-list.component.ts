import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  TemplateRef,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SpStackListConfig,
  SpStackListRowAction,
} from './sp-stack-list.models';
import { SpStackItemDirective } from './sp-stack-item.directive';

/**
 * Generic vertical "stack" list: a search/filter toolbar, a scrollable column
 * of consumer-templated cards, hover-revealed row actions, plus skeleton and
 * empty states.
 *
 * Ported from `@specora-ui/shared/ui/components` (used on the risk-detail
 * treatment view). Adapted for this sandbox: the original `sp-action` +
 * auth-role dependencies are replaced with plain buttons and the app's SVG
 * sprite icons (`#i-*`). The `:host` CSS variables resolve against the app
 * theme (`--accent`, `--surface`, `--line-soft`, `--fg*`, …), so it inherits
 * the dark theme with no extra wiring.
 *
 * @example
 * <sp-stack-list [config]="cfg()" [items]="rows()"
 *   (toolbarActionClick)="onCreate()"
 *   (rowActionClick)="onRowAction($event)">
 *   <ng-template spStackItem let-item>…card markup…</ng-template>
 * </sp-stack-list>
 */
@Component({
  selector: 'sp-stack-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    /* Flex column on the host so consumers can cap the component with a
       single max-height — the toolbar stays pinned while .sl-list scrolls. */
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      --sl-primary:    var(--accent,      #6ed3b1);
      --sl-primary-bg: var(--accent-dim,  rgba(110,211,177,.12));
      --sl-bg:         var(--bg,          #0a1220);
      --sl-card:       var(--surface,     #131d33);
      --sl-border:     var(--line-soft,   #1b2642);
      --sl-text:       var(--fg,          #e7ecf5);
      --sl-text2:      var(--fg-2,        #aab4c8);
      --sl-text3:      var(--fg-3,        #6f7d99);
      --sl-hover:      var(--surface-hi,  #1e2c4d);
    }

    /* ── Toolbar ──────────────────────────────────────────────── */
    .sl-bar { display: flex; align-items: center; gap: .625rem; flex-wrap: wrap; margin-bottom: .75rem; flex-shrink: 0; }
    .sl-search {
      display: flex; align-items: center; gap: 8px;
      height: 36px; padding: 0 12px;
      border: 1px solid var(--sl-border); border-radius: .5rem;
      background: var(--sl-card); min-width: 220px;
      transition: border-color .15s, box-shadow .15s;
    }
    .sl-search:focus-within { border-color: var(--sl-primary); box-shadow: 0 0 0 3px var(--sl-primary-bg); }
    .sl-search-icon { width: 14px; height: 14px; color: var(--sl-text3); flex-shrink: 0; }
    .sl-search input { border: none; outline: none; background: none; font-size: .875rem; color: var(--sl-text); font-family: inherit; width: 100%; }
    .sl-search input::placeholder { color: var(--sl-text3); }

    /* ── Filter pills ─────────────────────────────────────────── */
    .sl-pill {
      height: 32px; padding: 0 12px; border-radius: 9999px;
      border: 1px solid var(--sl-border); background: var(--sl-card);
      font-size: .75rem; font-weight: 500; color: var(--sl-text2);
      cursor: pointer; transition: all .12s; white-space: nowrap; font-family: inherit;
    }
    .sl-pill:hover:not(.sl-pill--active) { border-color: var(--sl-primary); color: var(--sl-primary); }
    .sl-pill--active { background: var(--sl-primary); border-color: var(--sl-primary); color: var(--accent-fg, #0a1220); font-weight: 600; }

    .sl-spacer { flex: 1; min-width: 0; }

    /* ── Toolbar action button ────────────────────────────────── */
    .sl-tb-btn {
      display: inline-flex; align-items: center; gap: 6px;
      height: 36px; padding: 0 14px; border-radius: 7px;
      font-size: 13px; font-weight: 600; font-family: inherit;
      cursor: pointer; border: 1px solid transparent; white-space: nowrap;
      transition: background-color .12s, color .12s, border-color .12s;
    }
    .sl-tb-btn svg { width: 14px; height: 14px; }
    .sl-tb-btn.v-primary { background: var(--sl-primary); color: var(--accent-fg, #0a1220); }
    .sl-tb-btn.v-primary:hover { filter: brightness(1.05); }
    .sl-tb-btn.v-outline { background: var(--sl-card); color: var(--sl-text); border-color: var(--sl-border); }
    .sl-tb-btn.v-outline:hover { background: var(--sl-hover); }
    .sl-tb-btn.v-ghost { background: transparent; color: var(--sl-text3); }
    .sl-tb-btn.v-ghost:hover { background: var(--sl-hover); color: var(--sl-text); }

    /* ── Item list ────────────────────────────────────────────── */
    .sl-list { display: flex; flex-direction: column; gap: .5rem; flex: 1; min-height: 0; overflow-y: auto; }
    .sl-list::-webkit-scrollbar { width: 6px; }
    .sl-list::-webkit-scrollbar-thumb { background: var(--line, rgba(148,163,184,.22)); border-radius: 3px; }

    /* ── Skeleton ─────────────────────────────────────────────── */
    .sl-skeleton { display: flex; flex-direction: column; gap: .5rem; }
    .sl-skel-card { border-radius: .75rem; border: 1px solid var(--sl-border); padding: 1rem; background: var(--sl-card); display: flex; align-items: center; gap: 1rem; }
    .sl-skel-icon { width: 32px; height: 32px; border-radius: .5rem; background: var(--sl-border); flex-shrink: 0; animation: sl-pulse 1.5s ease-in-out infinite; }
    .sl-skel-lines { flex: 1; display: flex; flex-direction: column; gap: .5rem; }
    .sl-skel-line { height: 12px; border-radius: .25rem; background: var(--sl-border); animation: sl-pulse 1.5s ease-in-out infinite; }
    @keyframes sl-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }

    /* ── Empty state ──────────────────────────────────────────── */
    .sl-empty { border-radius: .75rem; border: 1px solid var(--sl-border); background: var(--sl-card); padding: 3rem 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .75rem; text-align: center; }
    .sl-empty-icon { width: 44px; height: 44px; border-radius: .75rem; background: var(--sl-bg); border: 1px solid var(--sl-border); display: flex; align-items: center; justify-content: center; }
    .sl-empty-icon svg { width: 20px; height: 20px; color: var(--sl-text3); }
    .sl-empty-title { font-size: .9375rem; font-weight: 600; color: var(--sl-text2); }
    .sl-empty-desc { font-size: .875rem; color: var(--sl-text3); line-height: 1.55; max-width: 320px; }

    /* ── Row + hover ──────────────────────────────────────────── */
    .sl-row { position: relative; cursor: pointer; }
    .sl-item { border-radius: .75rem; transition: background .1s; }
    .sl-row:hover .sl-item { background: var(--sl-hover); }
    /* Projected card root lives in the parent view encapsulation; clear its
       fill on hover so the hover layer reads through. */
    :host ::ng-deep .sl-row:hover .sl-item > * { background: transparent !important; transition: background .1s; }

    .sl-actions {
      display: flex; align-items: center; gap: 2px;
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      opacity: 0; pointer-events: none; transition: opacity .15s;
      background: var(--sl-card); border: 1px solid var(--sl-border);
      border-radius: .5rem; padding: 2px 3px; box-shadow: 0 2px 8px rgba(0,0,0,.28);
    }
    .sl-row:hover .sl-actions { opacity: 1; pointer-events: auto; }
    .sl-act-btn {
      width: 28px; height: 28px; display: inline-grid; place-items: center;
      border-radius: 6px; border: 0; background: transparent; cursor: pointer;
      color: var(--sl-text3); transition: background-color .12s, color .12s;
    }
    .sl-act-btn:hover:not(:disabled) { background: var(--sl-hover); color: var(--sl-text); }
    .sl-act-btn:disabled { opacity: .4; cursor: not-allowed; }
    .sl-act-btn svg { width: 14px; height: 14px; }
  `],
  template: `
    <!-- Toolbar: search + filter pills + action (omitted when all disabled) -->
    @if (showToolbar()) {
      <div class="sl-bar">
        @if (cfg().searchable !== false) {
          <div class="sl-search">
            <svg class="sl-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/>
            </svg>
            <input
              type="text"
              [placeholder]="cfg().searchPlaceholder ?? 'Search…'"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)" />
          </div>
        }

        @if (cfg().tabs?.length) {
          <button class="sl-pill" [class.sl-pill--active]="activeTabKey() === 'ALL'" (click)="activeTabKey.set('ALL')">All</button>
          @for (tab of cfg().tabs!; track tab.key) {
            <button class="sl-pill" [class.sl-pill--active]="activeTabKey() === tab.key" (click)="activeTabKey.set(tab.key)">{{ tab.label }}</button>
          }
        }

        <span class="sl-spacer"></span>

        @if (cfg().toolbarAction; as act) {
          <button class="sl-tb-btn" [class]="'sl-tb-btn v-' + (act.variant ?? 'primary')" (click)="toolbarActionClick.emit(act.id)">
            @if (act.icon) {
              <svg aria-hidden="true"><use [attr.href]="'#' + act.icon"></use></svg>
            }
            {{ act.label }}
          </button>
        }
      </div>
    }

    <!-- Skeleton loading -->
    @if (loading()) {
      <div class="sl-skeleton">
        @for (i of [1, 2, 3]; track i) {
          <div class="sl-skel-card">
            <div class="sl-skel-icon"></div>
            <div class="sl-skel-lines">
              <div class="sl-skel-line" style="width:40%"></div>
              <div class="sl-skel-line" style="width:65%"></div>
            </div>
          </div>
        }
      </div>
    }

    <!-- Item list -->
    @if (!loading() && filteredItems().length > 0 && itemTpl) {
      <div class="sl-list">
        @for (item of filteredItems(); track trackItem(item, $index)) {
          <div class="sl-row">
            <div class="sl-item">
              <ng-container *ngTemplateOutlet="itemTpl; context: { $implicit: item }" />
            </div>
            @if (cfg().actions?.length) {
              <div class="sl-actions" (click)="$event.stopPropagation()">
                @for (action of cfg().actions!; track action.id) {
                  @if (!isRowActionHidden(action, item)) {
                    @let actIcon = resolveRowActionIcon(action, item);
                    @let actLabel = resolveRowActionLabel(action, item);
                    <button
                      class="sl-act-btn"
                      [attr.title]="actLabel"
                      [attr.aria-label]="actLabel"
                      [disabled]="isRowActionDisabled(action, item)"
                      (click)="rowActionClick.emit({ action: action.id, item })">
                      @if (actIcon) {
                        <svg aria-hidden="true"><use [attr.href]="'#' + actIcon"></use></svg>
                      } @else {
                        {{ actLabel }}
                      }
                    </button>
                  }
                }
              </div>
            }
          </div>
        }
      </div>
    }

    <!-- Empty state -->
    @if (!loading() && filteredItems().length === 0) {
      <div class="sl-empty">
        <div class="sl-empty-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M2 4h12M2 8h10M2 12h6"/>
          </svg>
        </div>
        <div class="sl-empty-title">{{ cfg().emptyTitle ?? 'No items found' }}</div>
        @if (cfg().emptyDesc) {
          <div class="sl-empty-desc">{{ cfg().emptyDesc }}</div>
        }
      </div>
    }
  `,
})
export class SpStackListComponent<T extends object = Record<string, unknown>> {
  readonly config  = input.required<SpStackListConfig<T>>();
  readonly items   = input<T[]>([]);
  readonly loading = input(false);

  readonly toolbarActionClick = output<string>();
  readonly rowActionClick = output<{ action: string; item: T }>();

  @ContentChild(SpStackItemDirective) private readonly itemDir?: SpStackItemDirective<T>;

  get itemTpl(): TemplateRef<{ $implicit: T }> | null {
    return (this.itemDir as SpStackItemDirective<T> | undefined)?.tpl ?? null;
  }

  readonly searchQuery  = signal('');
  readonly activeTabKey = signal('ALL');

  readonly cfg = computed(() => this.config());

  /** Toolbar row only when at least one of search, filter pills, or action is enabled. */
  readonly showToolbar = computed(() => {
    const c = this.cfg();
    return c.searchable !== false || (c.tabs?.length ?? 0) > 0 || !!c.toolbarAction;
  });

  readonly tabFilteredItems = computed(() => {
    const key = this.activeTabKey();
    const all = this.items();
    if (key === 'ALL') return all;
    const tab = this.cfg().tabs?.find(t => t.key === key);
    return tab ? tab.filterFn(all) : all;
  });

  readonly filteredItems = computed(() => {
    let rows = this.tabFilteredItems();
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      const fields = this.cfg().searchFields ?? [];
      if (fields.length) {
        rows = rows.filter(item => fields.some(fn => fn(item)?.toLowerCase().includes(q)));
      }
    }
    return rows;
  });

  trackItem(item: T, index: number): string | number {
    return this.cfg().trackBy?.(item) ?? index;
  }

  resolveRowActionLabel(action: SpStackListRowAction<T>, item: T): string {
    const l = action.label;
    return typeof l === 'function' ? l(item) : l;
  }

  resolveRowActionIcon(action: SpStackListRowAction<T>, item: T): string | undefined {
    const i = action.icon;
    if (i === undefined) return undefined;
    return typeof i === 'function' ? i(item) : i;
  }

  isRowActionHidden(action: SpStackListRowAction<T>, item: T): boolean {
    return action.hidden?.(item) ?? false;
  }

  isRowActionDisabled(action: SpStackListRowAction<T>, item: T): boolean {
    return action.disabled?.(item) ?? false;
  }
}
