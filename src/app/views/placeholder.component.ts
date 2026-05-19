import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideLayers } from '@lucide/angular';

@Component({
  standalone: true,
  selector: 'app-placeholder',
  imports: [LucideLayers],
  template: `
    <div class="px-10 pt-10 pb-24 max-w-[1280px] mx-auto">
      <header class="pb-7 mb-8 border-b border-line-soft">
        <h1 class="text-3xl font-semibold tracking-tight text-fg">{{ title() }}</h1>
        <p class="text-[14.5px] leading-relaxed text-fg-2 max-w-[680px] mt-2">
          Top-level workspace. Content for this module will live here.
        </p>
      </header>

      <section class="rounded-xl border border-dashed border-line-soft bg-surface p-16 text-center">
        <div class="w-12 h-12 mx-auto rounded-full grid place-items-center bg-bg-2 text-fg-3 mb-4">
          <svg lucideLayers class="w-5 h-5"></svg>
        </div>
        <h2 class="text-[16px] font-semibold text-fg">Coming soon</h2>
        <p class="text-[13px] text-fg-3 max-w-[440px] mx-auto mt-2">
          {{ title() }} is part of the global menu. Wire up its views once the requirements land.
        </p>
      </section>
    </div>
  `,
})
export class PlaceholderView {
  private readonly route = inject(ActivatedRoute);
  readonly title = signal<string>('Module');

  constructor() {
    this.route.data
      .pipe(takeUntilDestroyed())
      .subscribe((d) => this.title.set((d['title'] as string) ?? 'Module'));
  }
}
