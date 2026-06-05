/**
 * Config contracts for {@link SpStackListComponent}.
 *
 * Ported from the shared `@specora-ui/shared/ui/components` stack-list. The
 * auth-gating fields (requiredRole / authMode) from the original are dropped —
 * this sandbox has no auth layer, so row/toolbar actions are always enabled.
 */

export interface SpStackListTab<T = unknown> {
  key: string;
  label: string;
  filterFn: (items: T[]) => T[];
}

export interface SpStackListToolbarAction {
  id: string;
  label: string;
  /** Sprite id (e.g. `i-plus`) rendered before the label. */
  icon?: string;
  variant?: 'primary' | 'outline' | 'ghost';
}

/** Per-row actions; revealed on row hover (right side). */
export interface SpStackListRowAction<T = unknown> {
  id: string;
  label: string | ((item: T) => string);
  /** Sprite id, or a fn deriving one per item. Omit to render the label text. */
  icon?: string | ((item: T) => string);
  disabled?: (item: T) => boolean;
  hidden?: (item: T) => boolean;
}

export interface SpStackListConfig<T = unknown> {
  /**
   * Inline search input. When `true` or omitted, search is shown (provide
   * `searchFields` to filter). Set to `false` to hide the search bar.
   */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Functions that extract searchable text from each item. */
  searchFields?: ((item: T) => string | undefined | null)[];
  /** Optional filter pills (All + one per entry). Omit/empty to hide tabs. */
  tabs?: SpStackListTab<T>[];
  /** Optional single action button rendered at the end of the toolbar. */
  toolbarAction?: SpStackListToolbarAction;
  /** Row actions revealed on hover (right side). */
  actions?: SpStackListRowAction<T>[];
  emptyTitle?: string;
  emptyDesc?: string;
  trackBy?: (item: T) => string | number;
}
