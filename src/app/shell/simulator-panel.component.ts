import { Component, EventEmitter, Output, inject } from '@angular/core';
import {
  LucideActivity,
  LucideCloud,
  LucideNetwork,
  LucideRefreshCw,
  LucideShieldAlert,
  LucideSparkles,
  LucideX,
  LucideZap,
} from '@lucide/angular';
import { IsmsStore } from '../core/isms-store';
import { SimulationEvent } from '../core/models';

@Component({
  selector: 'app-simulator-panel',
  standalone: true,
  imports: [
    LucideActivity,
    LucideCloud,
    LucideNetwork,
    LucideRefreshCw,
    LucideShieldAlert,
    LucideSparkles,
    LucideX,
    LucideZap,
  ],
  template: `
    <aside class="bg-bg-2 border-l border-line-soft h-full flex flex-col overflow-hidden">
      <div class="px-5 pt-5 pb-3 border-b border-line-soft flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">CONTINUOUS REVIEW</div>
          <div class="mt-0.5 text-[15px] font-semibold text-fg flex items-center gap-2">
            <svg lucideZap class="w-4 h-4 text-accent"></svg>
            Disruption simulator
          </div>
          <p class="text-[11.5px] text-fg-3 mt-1 leading-snug">
            Trigger operational events to push state through the store. Affected risks pick up a
            <span class="text-warn">Review&nbsp;Required</span> badge until you clear it.
          </p>
        </div>
        <button class="btn-iconplain" aria-label="Close" (click)="closed.emit()">
          <svg lucideX class="w-3.5 h-3.5"></svg>
        </button>
      </div>

      <div class="px-4 py-4 border-b border-line-soft flex flex-col gap-2">
        <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">SIMULATE EVENT</div>
        <button class="sim-btn" (click)="trigger('ransomware')">
          <span class="sim-ico" style="background:rgb(242 164 164 / 0.16); color:var(--danger);">
            <svg lucideShieldAlert class="w-3.5 h-3.5"></svg>
          </span>
          <span class="flex-1 min-w-0 text-left">
            <span class="block text-[12.5px] text-fg leading-tight">Ransomware campaign</span>
            <span class="block text-[10.5px] text-fg-4 leading-snug">Affects endpoints, backups, identity</span>
          </span>
        </button>
        <button class="sim-btn" (click)="trigger('cloud-migration')">
          <span class="sim-ico" style="background:rgb(141 198 245 / 0.16); color:var(--info);">
            <svg lucideCloud class="w-3.5 h-3.5"></svg>
          </span>
          <span class="flex-1 min-w-0 text-left">
            <span class="block text-[12.5px] text-fg leading-tight">Cloud migration · AWS</span>
            <span class="block text-[10.5px] text-fg-4 leading-snug">Shifts risks tied to APIs, identity, vendors</span>
          </span>
        </button>
        <button class="sim-btn" (click)="trigger('supplier-breach')">
          <span class="sim-ico" style="background:rgb(229 152 90 / 0.18); color:#e5985a;">
            <svg lucideNetwork class="w-3.5 h-3.5"></svg>
          </span>
          <span class="flex-1 min-w-0 text-left">
            <span class="block text-[12.5px] text-fg leading-tight">Third-party supplier breach</span>
            <span class="block text-[10.5px] text-fg-4 leading-snug">Re-evaluates supplier-related risks</span>
          </span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-[10px] font-mono tracking-[0.12em] text-fg-4">EVENT FEED</div>
          @if (store.events().length > 0) {
            <button class="btn-ghost h-6 text-[11px]" (click)="store.clearEvents()">
              <svg lucideRefreshCw class="w-3 h-3"></svg>
              Reset
            </button>
          }
        </div>

        @if (store.events().length === 0) {
          <div class="rounded-lg border border-dashed border-line-soft p-5 text-center">
            <div class="w-9 h-9 mx-auto rounded-full grid place-items-center bg-surface border border-line-soft text-fg-3 mb-2">
              <svg lucideActivity class="w-4 h-4"></svg>
            </div>
            <div class="text-[12.5px] text-fg-2">No simulated events yet</div>
            <div class="text-[11px] text-fg-4 leading-snug mt-1">Trigger one of the disruptions above to push state into the register.</div>
          </div>
        } @else {
          <ul class="flex flex-col gap-2.5">
            @for (event of store.events(); track event.id) {
              <li class="rounded-lg border border-line-soft bg-surface p-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="inline-flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    <span class="text-[12.5px] font-medium text-fg">{{ event.label }}</span>
                  </span>
                  <span class="font-mono text-[10px] text-fg-4 shrink-0">{{ event.timestamp }}</span>
                </div>
                <p class="text-[11.5px] text-fg-2 leading-snug mt-1.5">{{ event.note }}</p>
                <div class="mt-2 flex flex-wrap items-center gap-1.5">
                  <span class="font-mono text-[9.5px] tracking-[0.12em] text-fg-4 mr-1">FLAGGED</span>
                  @for (rid of event.affectedRiskIds; track rid) {
                    <span class="font-mono text-[10.5px] px-1.5 py-0.5 rounded border border-line-soft bg-bg-2 text-fg-2">
                      {{ rid }}
                    </span>
                  }
                </div>
              </li>
            }
          </ul>
        }
      </div>

      <div class="px-4 py-3 border-t border-line-soft bg-bg flex items-center gap-2.5">
        <span class="w-7 h-7 rounded-md grid place-items-center bg-surface border border-line-soft text-accent">
          <svg lucideSparkles class="w-3.5 h-3.5"></svg>
        </span>
        <div class="flex-1 min-w-0">
          <div class="text-[11.5px] text-fg">Continuous compliance</div>
          <div class="text-[10.5px] text-fg-4">Events push signals into the register, treatment, and SoA in real time.</div>
        </div>
      </div>
    </aside>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        overflow: hidden;
      }
      .sim-btn {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        background: var(--surface);
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        text-align: left;
        cursor: pointer;
        transition: background 0.12s, border-color 0.12s;
      }
      .sim-btn:hover {
        background: var(--surface-hi);
        border-color: var(--line);
      }
      .sim-ico {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        display: inline-grid;
        place-items: center;
        flex-shrink: 0;
      }
    `,
  ],
})
export class SimulatorPanel {
  readonly store = inject(IsmsStore);
  @Output() closed = new EventEmitter<void>();

  trigger(kind: SimulationEvent['kind']) {
    this.store.simulate(kind);
  }
}
