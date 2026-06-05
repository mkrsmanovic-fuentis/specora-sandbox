import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Marks an `ng-template` as the item card template for `sp-stack-list`.
 *
 * ```html
 * <sp-stack-list [config]="cfg" [items]="items">
 *   <ng-template spStackItem let-item>
 *     <!-- your card markup here -->
 *   </ng-template>
 * </sp-stack-list>
 * ```
 */
@Directive({ selector: 'ng-template[spStackItem]', standalone: true })
export class SpStackItemDirective<T = unknown> {
  readonly tpl = inject<TemplateRef<{ $implicit: T }>>(TemplateRef);
}
