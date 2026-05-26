import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAlertTriangle,
  LucideBarChart3,
  LucideCheck,
  LucideChevronDown,
  LucideChevronRight,
  LucideLock,
  LucideShare2,
  LucideWorkflow,
} from '@lucide/angular';

type Lvl = 0 | 1 | 2 | 3;
type DimKey = 'C' | 'I' | 'A';

const LEVEL_NAMES = ['None', 'Normal', 'High', 'Very high'];
const LEVEL_SHORT = ['NONE', 'NORMAL', 'HIGH', 'VERY HIGH'];
const LEVEL_LETTER = ['—', 'N', 'H', 'V'];

interface Principle {
  type: string;
  meta: string;
  icon: 'bar' | 'flow';
  status: 'inline' | 'advisory' | 'conflict';
  recLevel?: Lvl;
  explain: string;
}
interface RecDot {
  level: Lvl;
  label: string;
  emphasis?: boolean;
  title: string;
}
interface LinkedSeg {
  pct: number;
  level: Lvl;
}
//test
interface Dim {
  key: DimKey;
  name: string;
  icon: 'lock' | 'check' | 'bar';
  metaText: string;
  initialLevel: Lvl;
  lastSet: string;
  lastBy: string;
  description: string;
  recHeaderMeta: string;
  recDots: RecDot[];
  principles: Principle[];
  linked: { count: number; stack: LinkedSeg[]; types: { n: number; label: string }[] };
}

const DIMS: Dim[] = [
  {
    key: 'C',
    name: 'Confidentiality',
    icon: 'lock',
    metaText: 'Who may see this asset',
    initialLevel: 3,
    lastSet: 'Last set Mar 12, 2026',
    lastBy: 'By R. Krüger',
    description:
      'Contains identifying customer records and contractual terms. Disclosure outside of the data-processing scope would breach our enterprise customer agreements and trigger Art. 33 notifications.',
    recHeaderMeta: 'From 14 linked assets · 2 principles',
    recDots: [
      { level: 2, label: 'C', title: 'Cumulative principle · 6 linked assets' },
      { level: 3, label: 'M', emphasis: true, title: "Maximum principle · 'Onboarding customers' is Very high" },
    ],
    principles: [
      {
        type: 'Maximum principle',
        meta: 'MAX · LINKED ASSETS',
        icon: 'bar',
        status: 'inline',
        explain:
          'Linked asset <b>Onboarding customers</b> carries <b>Very high</b> confidentiality. Current level matches — no change needed.',
      },
      {
        type: 'Cumulative principle',
        meta: 'SUM · LINKED ASSETS',
        icon: 'flow',
        status: 'inline',
        explain:
          'Combined weight of 14 linked assets evaluates to <b>High</b>. Current level is one step above — acceptable per policy ISO-27k §A.5.12.',
      },
    ],
    linked: {
      count: 14,
      stack: [{ pct: 14, level: 1 }, { pct: 38, level: 2 }, { pct: 48, level: 3 }],
      types: [{ n: 4, label: 'Process' }, { n: 7, label: 'IT Asset' }, { n: 3, label: 'Supplier' }],
    },
  },
  {
    key: 'I',
    name: 'Integrity',
    icon: 'check',
    metaText: 'Accuracy & trust of the data',
    initialLevel: 1,
    lastSet: 'Last set Jan 04, 2026',
    lastBy: 'By system · default',
    description: '',
    recHeaderMeta: 'From 14 linked assets · 2 principles',
    recDots: [{ level: 2, label: 'M · C', emphasis: true, title: 'Both principles recommend High' }],
    principles: [
      {
        type: 'Maximum principle',
        meta: 'MAX · LINKED ASSETS',
        icon: 'bar',
        status: 'advisory',
        recLevel: 2,
        explain:
          'Linked process <b>Billing reconciliation</b> requires <b>High</b> integrity to satisfy financial reporting controls. To stay aligned, this asset should match.',
      },
      {
        type: 'Cumulative principle',
        meta: 'SUM · LINKED ASSETS',
        icon: 'flow',
        status: 'advisory',
        recLevel: 2,
        explain:
          'Combined integrity weight of <b>14 linked assets</b> evaluates to <b>High</b>. Six of those carry independent control obligations that depend on this record.',
      },
    ],
    linked: {
      count: 14,
      stack: [{ pct: 7, level: 0 }, { pct: 28, level: 1 }, { pct: 50, level: 2 }, { pct: 15, level: 3 }],
      types: [{ n: 4, label: 'Process' }, { n: 7, label: 'IT Asset' }, { n: 3, label: 'Supplier' }],
    },
  },
  {
    key: 'A',
    name: 'Availability',
    icon: 'bar',
    metaText: 'Uptime needed',
    initialLevel: 2,
    lastSet: 'Last set Feb 28, 2026',
    lastBy: 'By M. Schultz',
    description:
      '99.5% monthly availability committed in customer MSAs. Tolerance for short maintenance windows during scheduled DR drills.',
    recHeaderMeta: 'Principles disagree — pick one',
    recDots: [
      { level: 2, label: 'M', emphasis: true, title: "Maximum principle · 'Customer support SLA' is High" },
      { level: 3, label: 'C', emphasis: true, title: 'Cumulative principle · 14 linked assets sum to Very high' },
    ],
    principles: [
      {
        type: 'Maximum principle',
        meta: 'MAX · LINKED ASSETS',
        icon: 'bar',
        status: 'inline',
        explain:
          'Highest-availability linked record <b>Customer support SLA</b> is <b>High</b>. Matches current level.',
      },
      {
        type: 'Cumulative principle',
        meta: 'SUM · LINKED ASSETS',
        icon: 'flow',
        status: 'conflict',
        recLevel: 3,
        explain:
          'Combined load of <b>14 linked assets</b> evaluates to <b>Very high</b>. Maximum principle disagrees because no single dependency is Very high — your call which principle governs.',
      },
    ],
    linked: {
      count: 14,
      stack: [{ pct: 5, level: 0 }, { pct: 18, level: 1 }, { pct: 56, level: 2 }, { pct: 21, level: 3 }],
      types: [{ n: 4, label: 'Process' }, { n: 7, label: 'IT Asset' }, { n: 3, label: 'Supplier' }],
    },
  },
];

@Component({
  standalone: true,
  selector: 'app-protection-requirements',
  imports: [
    FormsModule,
    LucideAlertTriangle,
    LucideBarChart3,
    LucideCheck,
    LucideChevronDown,
    LucideChevronRight,
    LucideLock,
    LucideShare2,
    LucideWorkflow,
  ],
  template: `
    <div class="pr-body">

      <!-- intro -->
      <div class="pr-intro">
        <div></div>
        <div class="pr-intro-actions">
          <button class="pr-btn pr-btn-primary">
            <svg lucideShare2 class="w-3.5 h-3.5"></svg>Propagate downstream
          </button>
        </div>
      </div>

      <!-- attention banner -->
      @if (attentionCount() > 0) {
        <div class="pr-attention">
          <span class="pr-attention-ico"><svg lucideAlertTriangle class="w-3 h-3"></svg></span>
          <div>
            <b>{{ attentionCount() }} dimensions need your attention.</b>
            <span class="text-fg-3"> Integrity is below the recommended level. Availability has conflicting principles.</span>
          </div>
          <button class="pr-attention-jump">
            Jump to first<svg lucideChevronDown class="w-3 h-3"></svg>
          </button>
        </div>
      }

      <!-- dimension cards -->
      @for (dim of dims; track dim.key) {
        <div class="pr-card dim-{{ dim.key }} lvl-{{ level(dim.key) }}"
             [attr.data-unsaved]="isUnsaved(dim.key) ? '1' : null">

          <!-- header -->
          <div class="pr-card-h">
            <div class="pr-dim-ico">
              @switch (dim.icon) {
                @case ('lock')  { <svg lucideLock class="w-4 h-4"></svg> }
                @case ('check') { <svg lucideCheck class="w-4 h-4"></svg> }
                @case ('bar')   { <svg lucideBarChart3 class="w-4 h-4"></svg> }
              }
            </div>
            <div>
              <div class="pr-dim-name">{{ dim.name }}</div>
              <div class="pr-dim-meta"><span class="pr-dim-letter">{{ dim.key }}</span>{{ dim.metaText }}</div>
            </div>
            <div class="pr-stamp">
              @if (isUnsaved(dim.key)) { <span class="pr-unsaved">Unsaved</span> }
              <span class="pr-level-pill">{{ levelName(dim.key) }}</span>
              <div class="pr-stamp-time">
                <span class="ts">{{ dim.lastSet }}</span>
                <span class="by">{{ dim.lastBy }}</span>
              </div>
            </div>
          </div>

          <!-- body -->
          <div class="pr-card-b">

            <!-- level selector with rec dots -->
            <div class="pr-sel-wrap">
              <div class="pr-recs">
                @for (slot of steps; track slot) {
                  <div class="pr-rec-slot">
                    @if (dotAt(dim, slot); as dot) {
                      <span class="pr-rec-dot lvl-{{ slot }}" [attr.data-emphasis]="dot.emphasis ? '1' : null" [title]="dot.title">{{ dot.label }}</span>
                    }
                  </div>
                }
              </div>
              <div class="pr-track" role="radiogroup" [attr.aria-label]="dim.name + ' level'">
                @for (l of steps; track l) {
                  <button class="pr-seg lvl-{{ l }}" role="radio"
                          [attr.aria-selected]="level(dim.key) === l"
                          (click)="setLevel(dim.key, l)">
                    <span class="pr-seg-letter">{{ letter(l) }}</span>
                    <span class="pr-seg-label">{{ name(l) }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- description -->
            <div>
              <div class="pr-desc-lbl">
                <span>Why this level?</span>
                <span class="pr-desc-hint">Audit trail · markdown supported</span>
              </div>
              <textarea class="pr-desc" placeholder="Explain the rationale for this protection level…"
                        [ngModel]="desc(dim.key)" (ngModelChange)="setDesc(dim.key, $event)"></textarea>
            </div>

            <!-- recommendations -->
            <div class="pr-rec-block">
              <div class="pr-rec-h">
                <span>Recommendation</span>
                <span class="pr-rec-h-meta">{{ dim.recHeaderMeta }}</span>
              </div>

              @for (p of dim.principles; track $index) {
                <div class="pr-principle" [class]="p.recLevel != null ? 'lvl-' + p.recLevel : ''" [attr.data-status]="p.status">
                  <div class="pr-principle-head">
                    <span class="pr-principle-ico">
                      @switch (p.icon) {
                        @case ('bar')  { <svg lucideBarChart3 class="w-3 h-3"></svg> }
                        @case ('flow') { <svg lucideWorkflow class="w-3 h-3"></svg> }
                      }
                    </span>
                    <div class="pr-principle-name">{{ p.type }} <span class="pr-principle-meta">{{ p.meta }}</span></div>
                  </div>

                  @switch (p.status) {
                    @case ('inline')   { <span class="pr-chip pr-chip-inline">In line</span> }
                    @case ('advisory') { <span class="pr-chip pr-chip-advisory">Advisory</span> }
                    @case ('conflict') { <span class="pr-chip pr-chip-conflict">Conflict</span> }
                  }

                  @if (p.status === 'inline') {
                    <div class="pr-principle-explain" [innerHTML]="p.explain"></div>
                  } @else {
                    <div class="pr-cmp">
                      <span class="pr-cmp-lbl">Current</span>
                      <span class="pr-cmp-val lvl-{{ level(dim.key) }}">{{ short(level(dim.key)) }}</span>
                      <span class="pr-cmp-arrow"><svg lucideChevronRight class="w-3 h-3"></svg></span>
                      <span class="pr-cmp-lbl">Recommended</span>
                      <span class="pr-cmp-val lvl-{{ p.recLevel }}">{{ short(p.recLevel!) }}</span>
                      <button class="pr-apply" (click)="setLevel(dim.key, p.recLevel!)">
                        <svg lucideCheck class="w-3 h-3"></svg>Apply {{ name(p.recLevel!) }}
                      </button>
                      <div class="pr-cmp-explain" [innerHTML]="p.explain"></div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- card actions (Save / Revert) — revealed when unsaved -->
            @if (isUnsaved(dim.key)) {
              <div class="pr-card-actions">
                <button class="pr-btn pr-btn-ghost" (click)="revert(dim.key)">Revert</button>
                <button class="pr-btn pr-btn-primary" (click)="save(dim.key)"><svg lucideCheck class="w-3 h-3"></svg>Save changes</button>
              </div>
            }
          </div>

          <!-- linked-at-a-glance footer -->
          <a class="pr-linked" href="javascript:void(0)">
            <span class="pr-linked-count"><span class="n">{{ dim.linked.count }}</span>linked</span>
            <span class="pr-linked-stack">
              @for (seg of dim.linked.stack; track $index) {
                <span [style.width.%]="seg.pct" [style.background]="'var(--lvl-' + seg.level + ')'"></span>
              }
            </span>
            <span class="pr-linked-types">
              @for (t of dim.linked.types; track t.label) {
                <span><b>{{ t.n }}</b> {{ t.label }}</span>
              }
            </span>
            <span class="pr-linked-jump">
              <span>View</span>
              <svg lucideChevronRight class="w-3 h-3"></svg>
            </span>
          </a>
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        /* per-level colors — consistent everywhere a level is rendered */
        --lvl-0: var(--fg-3);
        --lvl-0-bg: color-mix(in oklab, var(--fg-3) 14%, transparent);
        --lvl-1: var(--info);
        --lvl-1-bg: color-mix(in oklab, var(--info) 14%, transparent);
        --lvl-2: var(--warn);
        --lvl-2-bg: color-mix(in oklab, var(--warn) 14%, transparent);
        --lvl-3: var(--danger);
        --lvl-3-bg: color-mix(in oklab, var(--danger) 14%, transparent);
        /* per-dimension brand tints */
        --dim-C: var(--info);
        --dim-I: var(--warn);
        --dim-A: var(--accent);
      }

      .pr-body { padding: 22px; display: flex; flex-direction: column; gap: 14px; }

      .pr-intro {
        display: grid; grid-template-columns: 1fr auto; gap: 18px; align-items: center;
        padding: 4px 2px 0;
      }
      .pr-intro-kicker {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.12em; color: var(--fg-4); text-transform: uppercase;
      }
      .pr-intro-title { font-size: 15px; font-weight: 600; color: var(--fg); margin-top: 4px; }
      .pr-intro-sub { font-size: 12.5px; color: var(--fg-3); margin-top: 3px; max-width: 560px; }
      .pr-intro-actions { display: inline-flex; gap: 8px; align-items: center; }

      .pr-attention {
        display: flex; align-items: center; gap: 12px;
        padding: 9px 14px 9px 12px;
        border-radius: 10px;
        background: color-mix(in oklab, var(--warn) 8%, var(--surface));
        border: 1px solid color-mix(in oklab, var(--warn) 24%, var(--line-soft));
        font-size: 12.5px; color: var(--fg-2);
      }
      .pr-attention-ico {
        width: 22px; height: 22px; border-radius: 6px;
        display: grid; place-items: center;
        background: color-mix(in oklab, var(--warn) 18%, transparent);
        color: var(--warn); flex-shrink: 0;
      }
      .pr-attention b { color: var(--fg); font-weight: 600; }
      .pr-attention-jump {
        margin-left: auto;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10.5px; letter-spacing: 0.08em; color: var(--fg-3); text-transform: uppercase;
        display: inline-flex; align-items: center; gap: 6px;
        padding: 4px 8px; border-radius: 6px;
        border: 1px solid var(--line-soft); background: var(--surface); cursor: pointer;
      }
      .pr-attention-jump:hover { border-color: var(--line); color: var(--fg-2); }

      .pr-card {
        background: var(--surface);
        border: 1px solid var(--line-soft);
        border-radius: 12px; overflow: hidden;
        transition: border-color .12s;
      }
      .pr-card:hover { border-color: var(--line); }
      .pr-card[data-unsaved="1"] {
        border-color: color-mix(in oklab, var(--warn) 38%, var(--line));
        box-shadow: 0 0 0 1px color-mix(in oklab, var(--warn) 24%, transparent);
      }

      .pr-card-h {
        display: grid; grid-template-columns: auto 1fr auto;
        gap: 16px; align-items: center;
        padding: 14px 18px; border-bottom: 1px solid var(--line-soft);
      }
      .pr-dim-ico {
        width: 34px; height: 34px; border-radius: 8px;
        display: grid; place-items: center;
        background: color-mix(in oklab, var(--dim) 12%, var(--surface-2));
        color: var(--dim);
        border: 1px solid color-mix(in oklab, var(--dim) 22%, var(--line-soft));
      }
      .pr-dim-name { font-size: 14.5px; font-weight: 600; color: var(--fg); line-height: 1.15; }
      .pr-dim-meta {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.12em; color: var(--fg-4); text-transform: uppercase;
        margin-top: 4px; display: inline-flex; align-items: center; gap: 8px;
      }
      .pr-dim-meta .pr-dim-letter {
        width: 16px; height: 16px; border-radius: 4px;
        display: grid; place-items: center;
        background: color-mix(in oklab, var(--dim) 14%, transparent);
        color: var(--dim); font-weight: 700; letter-spacing: 0;
      }

      .pr-level-pill {
        display: inline-flex; align-items: center; gap: 7px;
        height: 26px; padding: 0 10px; border-radius: 999px;
        background: var(--lvl-bg); color: var(--lvl);
        border: 1px solid color-mix(in oklab, var(--lvl) 38%, transparent);
        font-size: 11.5px; font-weight: 600;
      }
      .pr-level-pill::before {
        content: ""; width: 7px; height: 7px; border-radius: 999px;
        background: var(--lvl);
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--lvl) 22%, transparent);
      }

      .pr-stamp { display: flex; align-items: center; gap: 10px; font-size: 11.5px; color: var(--fg-3); }
      .pr-stamp-time { display: inline-flex; flex-direction: column; align-items: flex-end; gap: 1px; }
      .pr-stamp-time .ts { color: var(--fg-2); }
      .pr-stamp-time .by {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.08em; color: var(--fg-4); text-transform: uppercase;
      }
      .pr-unsaved {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 3px 8px 3px 7px; border-radius: 999px;
        background: color-mix(in oklab, var(--warn) 14%, transparent);
        color: var(--warn);
        border: 1px solid color-mix(in oklab, var(--warn) 28%, transparent);
        font-size: 10.5px; font-family: 'JetBrains Mono', ui-monospace, monospace;
        letter-spacing: 0.06em; text-transform: uppercase;
      }
      .pr-unsaved::before { content: ""; width: 5px; height: 5px; border-radius: 999px; background: var(--warn); }

      .pr-card-b { padding: 18px 18px 14px; display: flex; flex-direction: column; gap: 18px; }

      .pr-sel-wrap { display: flex; flex-direction: column; gap: 0; padding-top: 28px; position: relative; }
      .pr-recs {
        position: absolute; top: 0; left: 0; right: 0;
        display: grid; grid-template-columns: repeat(4, 1fr);
        height: 22px; pointer-events: none;
      }
      .pr-rec-slot { position: relative; display: flex; align-items: center; justify-content: center; pointer-events: none; }
      .pr-rec-dot {
        pointer-events: auto;
        display: inline-flex; align-items: center; gap: 5px;
        height: 18px; padding: 0 7px 0 5px; border-radius: 999px;
        background: var(--surface);
        border: 1px solid color-mix(in oklab, var(--lvl) 35%, var(--line-soft));
        color: var(--fg-2);
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 9.5px; letter-spacing: 0.06em; cursor: help; position: relative;
      }
      .pr-rec-dot::before { content: ""; width: 6px; height: 6px; border-radius: 999px; background: var(--lvl); }
      .pr-rec-dot::after {
        content: ""; position: absolute; left: 50%; top: 100%;
        width: 1px; height: 6px;
        background: color-mix(in oklab, var(--lvl) 45%, transparent);
        transform: translateX(-50%);
      }
      .pr-rec-dot[data-emphasis="1"] {
        background: color-mix(in oklab, var(--lvl) 14%, var(--surface));
        border-color: color-mix(in oklab, var(--lvl) 50%, transparent);
      }

      .pr-track {
        display: grid; grid-template-columns: repeat(4, 1fr);
        background: var(--bg); border: 1px solid var(--line);
        border-radius: 10px; padding: 3px; gap: 3px;
      }
      .pr-seg {
        display: inline-flex; flex-direction: column; align-items: center; justify-content: center;
        height: 56px; border-radius: 7px; color: var(--fg-3); cursor: pointer;
        font-size: 13px; font-weight: 500; text-align: center; position: relative;
        transition: background-color .12s, color .12s, box-shadow .12s;
        border: 1px solid transparent;
      }
      .pr-seg .pr-seg-letter {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 16px; font-weight: 600; color: var(--fg-2); line-height: 1;
      }
      .pr-seg .pr-seg-label {
        font-size: 10.5px; color: var(--fg-4); margin-top: 5px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        letter-spacing: 0.06em; text-transform: uppercase;
      }
      .pr-seg:hover { background: var(--surface-hi); color: var(--fg); }
      .pr-seg:hover .pr-seg-letter { color: var(--fg); }
      .pr-seg[aria-selected="true"] {
        background: var(--lvl-bg); color: var(--lvl);
        box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--lvl) 55%, transparent);
      }
      .pr-seg[aria-selected="true"] .pr-seg-letter { color: var(--lvl); }
      .pr-seg[aria-selected="true"] .pr-seg-label { color: var(--lvl); opacity: 0.85; }

      .pr-desc-lbl {
        display: flex; align-items: baseline; justify-content: space-between;
        font-size: 12px; color: var(--fg-3); margin-bottom: 6px;
      }
      .pr-desc-lbl .pr-desc-hint {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.08em; color: var(--fg-4); text-transform: uppercase;
      }
      .pr-desc {
        width: 100%; min-height: 64px; resize: vertical;
        padding: 10px 12px; background: var(--bg);
        border: 1px solid var(--line-soft); border-radius: 8px;
        color: var(--fg); font: inherit; font-size: 13px; line-height: 1.5;
        transition: border-color .12s, background .12s;
      }
      .pr-desc:hover { border-color: var(--line); }
      .pr-desc:focus {
        outline: none; border-color: color-mix(in oklab, var(--accent) 60%, var(--line));
        background: var(--surface-2);
      }
      .pr-desc::placeholder { color: var(--fg-4); }

      .pr-rec-block { display: flex; flex-direction: column; gap: 10px; }
      .pr-rec-h {
        display: flex; align-items: baseline; justify-content: space-between;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10.5px; letter-spacing: 0.12em; color: var(--fg-4); text-transform: uppercase;
      }
      .pr-rec-h .pr-rec-h-meta { color: var(--fg-3); }

      .pr-principle {
        display: grid; grid-template-columns: 1fr auto; gap: 12px 16px;
        padding: 12px 14px; background: var(--surface-2);
        border: 1px solid var(--line-soft); border-radius: 10px;
      }
      .pr-principle[data-status="advisory"] {
        border-color: color-mix(in oklab, var(--warn) 32%, var(--line-soft));
        background: color-mix(in oklab, var(--warn) 5%, var(--surface-2));
      }
      .pr-principle[data-status="conflict"] {
        border-color: color-mix(in oklab, var(--danger) 32%, var(--line-soft));
        background: color-mix(in oklab, var(--danger) 4%, var(--surface-2));
      }
      .pr-principle-head { display: flex; align-items: center; gap: 9px; min-width: 0; }
      .pr-principle-ico {
        width: 24px; height: 24px; border-radius: 6px;
        display: grid; place-items: center;
        background: var(--surface-hi); border: 1px solid var(--line-soft);
        color: var(--fg-2); flex-shrink: 0;
      }
      .pr-principle-name { font-size: 13px; color: var(--fg); font-weight: 500; }
      .pr-principle-name .pr-principle-meta {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 9.5px; color: var(--fg-4); letter-spacing: 0.1em;
        margin-left: 6px; text-transform: uppercase;
      }

      .pr-chip {
        display: inline-flex; align-items: center; gap: 6px;
        height: 22px; padding: 0 9px; border-radius: 999px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
        font-weight: 600; border: 1px solid transparent;
      }
      .pr-chip-inline {
        background: color-mix(in oklab, var(--accent) 12%, transparent);
        color: var(--accent); border-color: color-mix(in oklab, var(--accent) 28%, transparent);
      }
      .pr-chip-inline::before { content: ""; width: 5px; height: 5px; border-radius: 999px; background: var(--accent); }
      .pr-chip-advisory {
        background: color-mix(in oklab, var(--warn) 14%, transparent);
        color: var(--warn); border-color: color-mix(in oklab, var(--warn) 30%, transparent);
      }
      .pr-chip-advisory::before { content: ""; width: 5px; height: 5px; border-radius: 999px; background: var(--warn); }
      .pr-chip-conflict {
        background: color-mix(in oklab, var(--danger) 14%, transparent);
        color: var(--danger); border-color: color-mix(in oklab, var(--danger) 30%, transparent);
      }
      .pr-chip-conflict::before { content: ""; width: 5px; height: 5px; border-radius: 999px; background: var(--danger); }

      .pr-cmp {
        grid-column: 1 / -1;
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
        padding-top: 8px; border-top: 1px dashed var(--line-soft);
      }
      .pr-cmp-lbl {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.08em; color: var(--fg-4); text-transform: uppercase;
      }
      .pr-cmp-val {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px; letter-spacing: 0.06em; font-weight: 600;
        display: inline-flex; align-items: center; gap: 5px;
        padding: 2px 7px; border-radius: 5px;
        background: var(--lvl-bg); color: var(--lvl);
        border: 1px solid color-mix(in oklab, var(--lvl) 30%, transparent);
      }
      .pr-cmp-arrow { color: var(--fg-4); display: inline-flex; }
      .pr-cmp-explain { flex: 1 1 100%; font-size: 12px; color: var(--fg-3); line-height: 1.5; margin-top: 2px; }
      .pr-cmp-explain b { color: var(--fg-2); font-weight: 500; }
      .pr-apply {
        margin-left: auto;
        display: inline-flex; align-items: center; gap: 6px;
        height: 26px; padding: 0 12px; border-radius: 6px;
        background: var(--accent); color: var(--accent-fg);
        font-size: 11.5px; font-weight: 600; border: 0; cursor: pointer;
        transition: filter .12s;
      }
      .pr-apply:hover { filter: brightness(1.05); }

      .pr-principle-explain {
        grid-column: 1 / -1; font-size: 12px; color: var(--fg-3); line-height: 1.5;
        padding-top: 8px; border-top: 1px dashed var(--line-soft);
      }
      .pr-principle-explain b { color: var(--fg-2); font-weight: 500; }

      .pr-linked {
        display: grid; grid-template-columns: auto 1fr auto auto;
        gap: 14px; align-items: center;
        padding: 11px 18px; border-top: 1px solid var(--line-soft);
        background: var(--surface-2);
        font-size: 11.5px; color: var(--fg-3); cursor: pointer;
        transition: background-color .12s; text-decoration: none;
      }
      .pr-linked:hover { background: var(--surface-hi); }
      .pr-linked-count {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px; color: var(--fg-2);
        display: inline-flex; align-items: baseline; gap: 4px;
      }
      .pr-linked-count .n { font-size: 15px; font-weight: 600; color: var(--fg); }
      .pr-linked-stack {
        display: flex; height: 8px; border-radius: 999px; overflow: hidden;
        background: var(--bg); border: 1px solid var(--line-soft);
      }
      .pr-linked-stack > span { display: block; height: 100%; }
      .pr-linked-types {
        display: inline-flex; gap: 10px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; color: var(--fg-3); letter-spacing: 0.06em; text-transform: uppercase;
      }
      .pr-linked-types b { color: var(--fg-2); font-weight: 600; }
      .pr-linked-jump { color: var(--fg-4); display: inline-flex; align-items: center; gap: 4px; }

      .pr-card-actions {
        display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding-top: 6px;
      }
      .pr-btn {
        display: inline-flex; align-items: center; gap: 6px;
        height: 30px; padding: 0 12px;
        background: var(--surface-2); border: 1px solid var(--line-soft);
        border-radius: 6px; color: var(--fg-2);
        font-size: 12px; cursor: pointer;
        transition: border-color .12s, color .12s, background .12s;
      }
      .pr-btn:hover { border-color: var(--line); color: var(--fg); background: var(--surface-hi); }
      .pr-btn-primary {
        background: var(--accent); color: var(--accent-fg);
        border-color: var(--accent); font-weight: 600;
      }
      .pr-btn-primary:hover { filter: brightness(1.05); color: var(--accent-fg); }
      .pr-btn-ghost { background: transparent; border-color: transparent; color: var(--fg-3); }
      .pr-btn-ghost:hover { background: var(--surface-hi); color: var(--fg-2); border-color: transparent; }

      /* helpers */
      .lvl-0 { --lvl: var(--lvl-0); --lvl-bg: var(--lvl-0-bg); }
      .lvl-1 { --lvl: var(--lvl-1); --lvl-bg: var(--lvl-1-bg); }
      .lvl-2 { --lvl: var(--lvl-2); --lvl-bg: var(--lvl-2-bg); }
      .lvl-3 { --lvl: var(--lvl-3); --lvl-bg: var(--lvl-3-bg); }
      .dim-C { --dim: var(--dim-C); }
      .dim-I { --dim: var(--dim-I); }
      .dim-A { --dim: var(--dim-A); }
    `,
  ],
})
export class ProtectionRequirementsView {
  readonly dims = DIMS;
  readonly steps: Lvl[] = [0, 1, 2, 3];

  // current + saved snapshots per dimension
  private readonly levels = signal<Record<DimKey, Lvl>>({ C: 3, I: 1, A: 2 });
  private readonly savedLevels = signal<Record<DimKey, Lvl>>({ C: 3, I: 1, A: 2 });
  private readonly descriptions = signal<Record<DimKey, string>>({
    C: DIMS[0].description,
    I: DIMS[1].description,
    A: DIMS[2].description,
  });
  private readonly savedDescriptions = signal<Record<DimKey, string>>({
    C: DIMS[0].description,
    I: DIMS[1].description,
    A: DIMS[2].description,
  });
  // Integrity card ships pre-edited (matches the design's seeded "Unsaved" state).
  private readonly unsaved = signal<Set<DimKey>>(new Set<DimKey>(['I']));

  readonly attentionCount = computed(
    () => this.dims.filter((d) => d.principles.some((p) => p.status !== 'inline')).length,
  );

  // ── level helpers
  level(k: DimKey): Lvl {
    return this.levels()[k];
  }
  levelName(k: DimKey): string {
    return LEVEL_NAMES[this.level(k)];
  }
  name(l: Lvl): string {
    return LEVEL_NAMES[l];
  }
  short(l: Lvl): string {
    return LEVEL_SHORT[l];
  }
  letter(l: Lvl): string {
    return LEVEL_LETTER[l];
  }

  desc(k: DimKey): string {
    return this.descriptions()[k];
  }
  setDesc(k: DimKey, v: string) {
    this.descriptions.update((d) => ({ ...d, [k]: v }));
    this.markUnsaved(k);
  }

  isUnsaved(k: DimKey): boolean {
    return this.unsaved().has(k);
  }

  dotAt(dim: Dim, level: number): RecDot | undefined {
    return dim.recDots.find((d) => d.level === level);
  }

  // ── interactions (optimistic re-evaluation)
  setLevel(k: DimKey, l: Lvl) {
    this.levels.update((m) => ({ ...m, [k]: l }));
    this.markUnsaved(k);
  }
  private markUnsaved(k: DimKey) {
    this.unsaved.update((s) => {
      if (s.has(k)) return s;
      const next = new Set(s);
      next.add(k);
      return next;
    });
  }
  save(k: DimKey) {
    this.savedLevels.update((m) => ({ ...m, [k]: this.levels()[k] }));
    this.savedDescriptions.update((m) => ({ ...m, [k]: this.descriptions()[k] }));
    this.unsaved.update((s) => {
      const next = new Set(s);
      next.delete(k);
      return next;
    });
  }
  revert(k: DimKey) {
    this.levels.update((m) => ({ ...m, [k]: this.savedLevels()[k] }));
    this.descriptions.update((m) => ({ ...m, [k]: this.savedDescriptions()[k] }));
    this.unsaved.update((s) => {
      const next = new Set(s);
      next.delete(k);
      return next;
    });
  }
}
