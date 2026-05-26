import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBarChart3,
  LucideBox,
  LucideCheck,
  LucideChevronDown,
  LucideChevronRight,
  LucideEdit3,
  LucideEye,
  LucideFileText,
  LucideHome,
  LucideLink2,
  LucideLock,
  LucideMoreHorizontal,
  LucideShare2,
  LucideShield,
  LucideWorkflow,
} from '@lucide/angular';

import { Classification, InfoAsset, SEED } from './inventory-information.data';
import { DataTableView, TableColumn } from '../shared/data-table.component';
import { ProtectionRequirementsView } from './protection-requirements.component';

type Dimension = 'c' | 'i' | 'a';
type SectionKey = 'base' | 'specifics' | 'protection';
type TabKey = 'overview' | 'linked' | 'protection' | 'assessment';

const LEVELS = ['None', 'Normal', 'High', 'Very high'];

interface ClassMeta {
  label: string;
  color: string;
  bg: string;
}

const KIND_BADGE: Record<string, string> = {
  Process: 'tok-ok',
  Application: 'tok-info',
  Supplier: 'tok-warn',
  'Sub-asset': 'tok-danger',
};

const CLASS_META: Record<Classification, ClassMeta> = {
  Public: { label: 'PUBLIC', color: 'var(--ok)', bg: 'rgb(140 240 200 / 0.14)' },
  Internal: { label: 'INTERNAL', color: 'var(--info)', bg: 'rgb(141 198 245 / 0.14)' },
  Confidential: { label: 'CONFIDENTIAL', color: 'var(--warn)', bg: 'rgb(240 201 135 / 0.14)' },
  Restricted: { label: 'STRICTLY CONFIDENTIAL', color: 'var(--danger)', bg: 'rgb(242 164 164 / 0.14)' },
};

@Component({
  standalone: true,
  selector: 'app-asset-detail',
  imports: [
    DataTableView,
    ProtectionRequirementsView,
    RouterLink,
    LucideArrowLeft,
    LucideBarChart3,
    LucideBox,
    LucideCheck,
    LucideChevronDown,
    LucideChevronRight,
    LucideEdit3,
    LucideEye,
    LucideFileText,
    LucideHome,
    LucideLink2,
    LucideLock,
    LucideMoreHorizontal,
    LucideShare2,
    LucideShield,
    LucideWorkflow,
  ],
  template: `
    @if (asset(); as a) {
      <div class="flex-1 flex flex-col min-h-0 px-10 pt-6 pb-6 max-w-[1480px] mx-auto w-full">
        <div class="ad-frame flex-1 min-h-0 flex flex-col">

          <!-- STICKY IDENTITY BAR -->
          <div class="ad-sticky shrink-0">
            <!-- top row: breadcrumb + actions -->
            <div class="flex items-center justify-between gap-4 px-5 pt-3 pb-2.5">
              <div class="flex items-center gap-2 min-w-0">
                <a [routerLink]="['/', 'inventory', 'information']"
                   class="w-7 h-7 grid place-items-center rounded-md text-fg-3 hover:bg-surface-hi hover:text-fg" aria-label="Back">
                  <svg lucideArrowLeft class="w-4 h-4"></svg>
                </a>
                <div class="flex items-center gap-1.5 text-[11.5px] text-fg-3 min-w-0">
                  <a [routerLink]="['/']" class="grid place-items-center hover:text-fg" aria-label="Home">
                    <svg lucideHome class="w-3.5 h-3.5"></svg>
                  </a>
                  <svg lucideChevronRight class="w-3 h-3 text-fg-4"></svg>
                  <a [routerLink]="['/', 'inventory', 'information']" class="hover:text-fg">Information assets</a>
                  <svg lucideChevronRight class="w-3 h-3 text-fg-4"></svg>
                  <span class="text-fg truncate">{{ a.name }}</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <button class="ad-btn ad-btn-icon" aria-label="Share"><svg lucideShare2 class="w-3.5 h-3.5"></svg></button>
                <button class="ad-btn ad-btn-icon" aria-label="More"><svg lucideMoreHorizontal class="w-3.5 h-3.5"></svg></button>
                <button class="ad-btn ad-btn-primary"><svg lucideEdit3 class="w-3.5 h-3.5"></svg>Edit</button>
              </div>
            </div>
            <!-- identity row -->
            <div class="grid grid-cols-[auto_1fr_auto] items-center gap-5 px-5 pb-3.5">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg grid place-items-center" style="background: color-mix(in oklab, var(--accent) 14%, var(--surface-2)); color: var(--accent);">
                  <svg lucideBox class="w-5 h-5"></svg>
                </div>
                <div>
                  <h3 class="text-[18px] font-semibold text-fg leading-tight">{{ a.name }}</h3>
                  <a class="text-fg-3 hover:text-fg cursor-pointer inline-flex items-center gap-1.5 text-[13px] mt-1">
                    <svg lucideWorkflow class="w-3 h-3 text-fg-4"></svg>
                    <span>{{ a.location }}</span>
                  </a>
                </div>
              </div>
              <div class="flex items-center justify-center gap-6 text-[11.5px]">
                <div class="flex flex-col gap-1">
                  <span class="ad-kicker">Status</span>
                  <span class="inline-flex items-center self-start px-2 py-0.5 rounded text-[11px] font-mono font-semibold" style="background:rgb(140 240 200 / 0.14); color:var(--ok)">ACTIVE</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="ad-kicker">Classification</span>
                  <span class="inline-flex items-center self-start px-2 py-0.5 rounded text-[11px] font-mono font-semibold"
                        [style.background]="classMeta().bg" [style.color]="classMeta().color">{{ classMeta().label }}</span>
                </div>
                <div class="w-px h-7 bg-line-soft"></div>
                <div class="flex flex-col gap-1">
                  <span class="ad-kicker">Owner</span>
                  <span class="text-fg-2">{{ a.owner }}</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="ad-kicker">Updated</span>
                  <span class="text-fg-2">{{ a.reviewed }}</span>
                </div>
              </div>
              <div></div>
            </div>
            <!-- tabs -->
            <div class="px-5 flex items-center gap-1">
              <button class="ad-tab" [attr.aria-selected]="tab() === 'overview'" (click)="tab.set('overview')">
                <svg lucideFileText class="w-3.5 h-3.5"></svg>Overview
              </button>
              <button class="ad-tab" [attr.aria-selected]="tab() === 'linked'" (click)="tab.set('linked')">
                <svg lucideLink2 class="w-3.5 h-3.5"></svg>Linked objects
                <span class="ad-tab-count">14</span>
              </button>
              <button class="ad-tab" [attr.aria-selected]="tab() === 'protection'" (click)="tab.set('protection')">
                <svg lucideShield class="w-3.5 h-3.5"></svg>Protection requirements
              </button>
              <button class="ad-tab" [attr.aria-selected]="tab() === 'assessment'" (click)="tab.set('assessment')">
                <svg lucideCheck class="w-3.5 h-3.5"></svg>Assessment assets
                <span class="ad-tab-count">3</span>
              </button>
            </div>
          </div>

          <!-- BODY -->
          <div class="flex-1 min-h-0 flex flex-col bg-bg-2">

            @if (tab() === 'linked') {
              <!-- LINKED OBJECTS -->
              <div class="flex-1 min-h-0 flex flex-col px-5 py-6">
                <app-data-table
                  [columns]="linkedColumns"
                  [rows]="linkedObjects"
                  scopeLabel="LINKED OBJECTS"
                  searchPlaceholder="Search ID, name, kind…"
                  primaryLabel="Link object"
                  filterKey="kind" />
              </div>
            } @else if (tab() === 'assessment') {
              <!-- ASSESSMENT ASSETS -->
              <div class="flex-1 min-h-0 flex flex-col px-5 py-6">
                <app-data-table
                  [columns]="assessmentColumns"
                  [rows]="assessments"
                  scopeLabel="ASSESSMENT ASSETS"
                  searchPlaceholder="Search ID, name, framework…"
                  primaryLabel="New assessment"
                  filterKey="framework" />
              </div>
            } @else if (tab() === 'protection') {
              <!-- PROTECTION REQUIREMENTS -->
              <div class="flex-1 min-h-0 overflow-y-auto">
                <app-protection-requirements />
              </div>
            } @else {

            <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 px-5 py-6">

            <!-- SECTION 1: BASE DATA -->
            <div class="ad-card" [class.is-open]="isOpen('base')">
              <div class="ad-card-h" (click)="toggle('base')">
                <div>
                  <div class="text-[13.5px] font-semibold text-fg">Base data</div>
                  <div class="text-[12px] text-fg-3 mt-0.5">Core identity fields shared by every asset.</div>
                </div>
                <svg lucideChevronDown class="w-4 h-4 ad-chev"></svg>
              </div>
              <div class="ad-card-body">
                <div class="ad-grid">
                  <div class="ad-field">
                    <span class="ad-field-lbl">Name</span>
                    <span class="ad-field-val">{{ a.name }}</span>
                  </div>
                  <div class="ad-field">
                    <span class="ad-field-lbl">Status</span>
                    <span class="ad-field-val"><span class="ad-status">Active</span></span>
                  </div>
                  <div class="ad-field">
                    <span class="ad-field-lbl">Classification</span>
                    <span class="ad-field-val">
                      <span class="ad-class" [style.color]="classMeta().color" [style.background]="classMeta().bg">
                        <svg lucideLock class="w-2.5 h-2.5"></svg>{{ classMeta().label }}
                      </span>
                    </span>
                  </div>
                  <div class="ad-field">
                    <span class="ad-field-lbl">Subtypes</span>
                    <span class="ad-field-val flex flex-wrap gap-1.5">
                      <span class="ad-chip">Personal data</span>
                      <span class="ad-chip">Contractual</span>
                      <span class="ad-chip">Operational</span>
                    </span>
                  </div>
                </div>
                <div class="ad-field" style="grid-template-columns: 160px 1fr; border-top: 1px solid var(--line-soft); border-bottom: 0; padding-top: 12px; margin-top: 4px;">
                  <span class="ad-field-lbl">Description</span>
                  <span class="ad-field-val">Customer records collected and processed through the hosted SaaS platform — account profiles, billing addresses, support history, and product usage telemetry. Replicated across primary and DR regions; subject to contractual processing terms with all enterprise customers.</span>
                </div>
              </div>
            </div>

            <!-- SECTION 2: INFORMATION SPECIFICS -->
            <div class="ad-card" [class.is-open]="isOpen('specifics')">
              <div class="ad-card-h" (click)="toggle('specifics')">
                <div>
                  <div class="text-[13.5px] font-semibold text-fg">Information specifics</div>
                  <div class="text-[12px] text-fg-3 mt-0.5">Metadata describing how this asset is stored and handled.</div>
                </div>
                <svg lucideChevronDown class="w-4 h-4 ad-chev"></svg>
              </div>
              <div class="ad-card-body">
                <div class="ad-grid">
                  <div class="ad-field">
                    <span class="ad-field-lbl">Data category</span>
                    <span class="ad-field-val">Customer · Operational</span>
                  </div>
                  <div class="ad-field">
                    <span class="ad-field-lbl">Storage location</span>
                    <span class="ad-field-val">{{ a.location }}</span>
                  </div>
                  <div class="ad-field">
                    <span class="ad-field-lbl">Retention period</span>
                    <span class="ad-field-val">7 years after contract termination</span>
                  </div>
                  <div class="ad-field">
                    <span class="ad-field-lbl">Personal data</span>
                    <span class="ad-field-val">Yes — pseudonymised at rest</span>
                  </div>
                  <div class="ad-field">
                    <span class="ad-field-lbl">Sensitive data</span>
                    <span class="ad-field-empty">— not set</span>
                  </div>
                  <div class="ad-field">
                    <span class="ad-field-lbl">Data subject group</span>
                    <span class="ad-field-empty">— not set</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECTION 3: PROTECTION REQUIREMENTS -->
            <div class="ad-card" [class.is-open]="isOpen('protection')" style="position: relative;">
              <div class="ad-card-h" (click)="toggle('protection')">
                <div>
                  <div class="text-[13.5px] font-semibold text-fg">Protection requirements</div>
                  <div class="text-[12px] text-fg-3 mt-0.5">Confidentiality, integrity and availability levels set for this asset.</div>
                </div>
                <div class="flex items-center gap-1.5" (click)="$event.stopPropagation()">
                  <button class="ad-btn" style="height:26px; font-size:11px;"><svg lucideEye class="w-3 h-3"></svg>Recommend</button>
                  <button class="ad-btn" style="height:26px; font-size:11px;"><svg lucideShare2 class="w-3 h-3"></svg>Propagate</button>
                </div>
                <svg lucideChevronDown class="w-4 h-4 ad-chev"></svg>
              </div>
              <div class="ad-card-body">

                <div class="ad-pr-row">
                  <div class="ad-pr-name">
                    <span class="ad-pr-ico" style="color: var(--info); background: rgb(141 198 245 / 0.10); border-color: rgb(141 198 245 / 0.22);"><svg lucideLock class="w-3 h-3"></svg></span>
                    <div>
                      <div>Confidentiality</div>
                      <div class="ad-pr-meta">C · WHO MAY SEE</div>
                    </div>
                  </div>
                  <div class="ad-level" role="radiogroup" aria-label="Confidentiality level">
                    @for (lvl of levels; track $index) {
                      <span class="ad-level-step" role="radio"
                            [attr.aria-selected]="level('c') === $index"
                            (click)="setLevel('c', $index)">
                        <span class="ad-step-num">{{ $index }}</span>{{ lvl }}
                      </span>
                    }
                  </div>
                  <div class="ad-pr-side"><span class="ad-pr-confirm">In line with 14 linked assets</span></div>
                </div>

                <div class="ad-pr-row">
                  <div class="ad-pr-name">
                    <span class="ad-pr-ico" style="color: var(--warn); background: rgb(240 201 135 / 0.10); border-color: rgb(240 201 135 / 0.22);"><svg lucideCheck class="w-3 h-3"></svg></span>
                    <div>
                      <div>Integrity</div>
                      <div class="ad-pr-meta">I · ACCURACY &amp; TRUST</div>
                    </div>
                  </div>
                  <div class="ad-level" role="radiogroup" aria-label="Integrity level">
                    @for (lvl of levels; track $index) {
                      <span class="ad-level-step" role="radio"
                            [attr.aria-selected]="level('i') === $index"
                            (click)="setLevel('i', $index)">
                        <span class="ad-step-num">{{ $index }}</span>{{ lvl }}
                      </span>
                    }
                  </div>
                  <div class="ad-pr-side">
                    <span class="ad-pr-rec">
                      <span>Recommend</span>
                      <span class="ad-pr-rec-val">HIGH</span>
                      <button class="ad-pr-apply" (click)="setLevel('i', 2)">Apply</button>
                    </span>
                  </div>
                </div>

                <div class="ad-pr-row">
                  <div class="ad-pr-name">
                    <span class="ad-pr-ico" style="color: var(--accent); background: rgb(140 240 200 / 0.10); border-color: rgb(140 240 200 / 0.22);"><svg lucideBarChart3 class="w-3 h-3"></svg></span>
                    <div>
                      <div>Availability</div>
                      <div class="ad-pr-meta">A · UPTIME NEEDED</div>
                    </div>
                  </div>
                  <div class="ad-level" role="radiogroup" aria-label="Availability level">
                    @for (lvl of levels; track $index) {
                      <span class="ad-level-step" role="radio"
                            [attr.aria-selected]="level('a') === $index"
                            (click)="setLevel('a', $index)">
                        <span class="ad-step-num">{{ $index }}</span>{{ lvl }}
                      </span>
                    }
                  </div>
                  <div class="ad-pr-side"><span class="ad-pr-confirm">In line with parent process</span></div>
                </div>

              </div>
            </div>
            </div>
            }

          </div>
        </div>
      </div>
    } @else {
      <div class="px-10 py-16 text-center">
        <div class="text-[13px] text-fg-2">Asset not found.</div>
        <a [routerLink]="['/', 'inventory', 'information']" class="btn-ghost mt-3 inline-block">Back to information assets</a>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }

      .ad-frame {
        background: var(--bg);
        border: 1px solid var(--line-soft);
        border-radius: 12px;
        overflow: hidden;
      }
      .ad-sticky {
        position: sticky; top: 0; z-index: 5;
        background: color-mix(in oklab, var(--surface) 92%, transparent);
        backdrop-filter: blur(8px);
        border-bottom: 1px solid var(--line);
      }
      .ad-kicker {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.12em;
        color: var(--fg-4); text-transform: uppercase;
      }
      .ad-mono {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px; color: var(--fg-3);
      }
      .ad-card {
        background: var(--surface);
        border: 1px solid var(--line-soft);
        border-radius: 10px;
        transition: border-color .12s;
      }
      .ad-card:hover { border-color: var(--line); }
      .ad-card-h {
        display: grid;
        grid-template-columns: 1fr auto auto;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        user-select: none;
      }
      .ad-card.is-open .ad-card-h { border-bottom: 1px solid var(--line-soft); }
      .ad-card-body { padding: 18px 20px 20px; display: none; }
      .ad-card.is-open .ad-card-body { display: block; }
      .ad-card.is-open .ad-chev { transform: rotate(180deg); }
      .ad-chev { transition: transform .15s ease; color: var(--fg-3); }

      /* tabs */
      .ad-tab {
        display: inline-flex; align-items: center; gap: 8px;
        height: 40px; padding: 0 14px;
        border-bottom: 2px solid transparent;
        color: var(--fg-3);
        font-size: 13px; font-weight: 500;
        cursor: pointer; user-select: none;
        transition: color .12s, border-color .12s;
      }
      .ad-tab:hover { color: var(--fg); }
      .ad-tab[aria-selected="true"] {
        color: var(--fg);
        border-bottom-color: var(--accent);
      }
      .ad-tab-count {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10.5px;
        background: var(--bg);
        border: 1px solid var(--line-soft);
        color: var(--fg-3);
        padding: 1px 6px; border-radius: 999px;
      }

      /* status dot */
      .ad-status {
        display: inline-flex; align-items: center; gap: 6px;
        color: var(--accent);
        font-size: 12px; font-weight: 500;
      }
      .ad-status::before {
        content: ""; width: 7px; height: 7px; border-radius: 999px;
        background: var(--accent);
        box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 22%, transparent);
      }
      .ad-class {
        display: inline-flex; align-items: center; gap: 5px;
        height: 22px; padding: 0 8px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.08em;
      }

      /* field grid */
      .ad-grid {
        display: grid; grid-template-columns: repeat(2, 1fr);
        column-gap: 28px;
      }
      .ad-field {
        padding: 10px 0;
        border-bottom: 1px solid var(--line-soft);
        display: grid;
        grid-template-columns: 160px 1fr;
        align-items: baseline;
        gap: 18px;
      }
      .ad-field:nth-last-child(-n+2) { border-bottom: 0; }
      .ad-field-lbl { font-size: 11.5px; color: var(--fg-3); }
      .ad-field-val { font-size: 13px; color: var(--fg); line-height: 1.45; }
      .ad-field-empty {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 12px; color: var(--fg-4);
      }

      /* subtype chip */
      .ad-chip {
        display: inline-flex; align-items: center; gap: 5px;
        height: 22px; padding: 0 9px;
        border-radius: 999px;
        background: var(--bg);
        border: 1px solid var(--line-soft);
        color: var(--fg-2);
        font-size: 11.5px;
      }

      /* level selector */
      .ad-level {
        display: grid; grid-template-columns: repeat(4, 1fr);
        background: var(--bg);
        border: 1px solid var(--line-soft);
        border-radius: 8px;
        padding: 3px;
        gap: 2px;
        min-width: 380px;
      }
      .ad-level-step {
        display: inline-flex; align-items: center; justify-content: center;
        height: 32px;
        border-radius: 5px;
        font-size: 12px; color: var(--fg-3);
        font-weight: 500;
        transition: background .12s, color .12s, box-shadow .12s;
        cursor: pointer;
        position: relative;
      }
      .ad-level-step:hover { background: var(--surface-hi); color: var(--fg); }
      .ad-level-step[aria-selected="true"] {
        background: var(--accent-dim);
        color: var(--fg);
        box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--accent) 50%, transparent);
      }
      .ad-level-step .ad-step-num {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 9.5px; color: var(--fg-4);
        position: absolute; top: 2px; left: 5px;
      }
      .ad-level-step[aria-selected="true"] .ad-step-num { color: var(--accent); }

      /* protection row */
      .ad-pr-row {
        display: grid;
        grid-template-columns: 140px 1fr 280px;
        align-items: center;
        gap: 20px;
        padding: 14px 0;
        border-bottom: 1px solid var(--line-soft);
      }
      .ad-pr-row:last-child { border-bottom: 0; }
      .ad-pr-name {
        display: flex; align-items: center; gap: 10px;
        font-size: 13px; font-weight: 500; color: var(--fg);
      }
      .ad-pr-name .ad-pr-ico {
        width: 24px; height: 24px; border-radius: 6px;
        display: grid; place-items: center;
        background: var(--surface-2);
        border: 1px solid var(--line-soft);
        color: var(--fg-2);
      }
      .ad-pr-meta {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; color: var(--fg-4);
        letter-spacing: 0.08em;
      }
      .ad-pr-side {
        display: flex; align-items: center; gap: 8px;
        font-size: 11.5px;
      }
      .ad-pr-confirm {
        color: var(--fg-3);
        display: inline-flex; align-items: center; gap: 6px;
      }
      .ad-pr-confirm::before {
        content: ""; width: 6px; height: 6px; border-radius: 999px; background: var(--accent);
      }
      .ad-pr-rec {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 4px 4px 4px 9px;
        border-radius: 999px;
        background: rgb(240 201 135 / 0.12);
        border: 1px solid rgb(240 201 135 / 0.30);
        color: var(--warn);
        font-size: 11px;
      }
      .ad-pr-rec .ad-pr-rec-val {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.06em;
      }
      .ad-pr-apply {
        height: 22px; padding: 0 10px;
        border-radius: 999px;
        background: var(--warn); color: #2c1f00;
        font-size: 11px; font-weight: 600;
        cursor: pointer; border: 0;
      }
      .ad-pr-apply:hover { filter: brightness(1.05); }

      /* buttons */
      .ad-btn {
        display: inline-flex; align-items: center; gap: 6px;
        height: 30px; padding: 0 12px;
        border-radius: 6px;
        background: var(--surface);
        border: 1px solid var(--line-soft);
        color: var(--fg-2);
        font-size: 12px;
        cursor: pointer;
        transition: border-color .12s, color .12s, background .12s;
      }
      .ad-btn:hover { border-color: var(--line); color: var(--fg); background: var(--surface-hi); }
      .ad-btn-primary {
        background: var(--accent); color: var(--accent-fg);
        border-color: var(--accent);
        font-weight: 600;
      }
      .ad-btn-primary:hover { filter: brightness(1.05); color: var(--accent-fg); }
      .ad-btn-icon { width: 30px; padding: 0; justify-content: center; }
    `,
  ],
})
export class AssetDetailView {
  /** Route param bound via withComponentInputBinding(). */
  readonly id = input<string>('');

  readonly levels = LEVELS;

  // -------- Dummy linked objects (Linked objects tab) --------
  readonly linkedObjects = [
    { id: 'PR-018',  name: 'Customer billing process',        meta: 'Owner · Lana D.',          kind: 'Process',     color: 'var(--accent)' },
    { id: 'APP-204', name: 'Stripe payments integration',     meta: 'SaaS · external',          kind: 'Application', color: 'var(--info)' },
    { id: 'SUP-031', name: 'Amazon Web Services',             meta: 'Sub-processor · DPA signed', kind: 'Supplier',    color: 'var(--warn)' },
    { id: 'IA-014',  name: 'Customer support transcripts',    meta: 'Sub-asset',                kind: 'Sub-asset',   color: 'var(--danger)' },
    { id: 'PR-009',  name: 'Customer onboarding workflow',    meta: 'Owner · Marko K.',         kind: 'Process',     color: 'var(--accent)' },
    { id: 'APP-118', name: 'Salesforce CRM',                  meta: 'SaaS · external',          kind: 'Application', color: 'var(--info)' },
    { id: 'APP-077', name: 'Datadog observability',           meta: 'SaaS · external',          kind: 'Application', color: 'var(--info)' },
    { id: 'SUP-052', name: 'SendGrid (Twilio)',               meta: 'Sub-processor',            kind: 'Supplier',    color: 'var(--warn)' },
    { id: 'IA-021',  name: 'Account profile records',         meta: 'Sub-asset',                kind: 'Sub-asset',   color: 'var(--danger)' },
    { id: 'PR-024',  name: 'Data retention & deletion',       meta: 'Owner · Ana Petrović',     kind: 'Process',     color: 'var(--accent)' },
    { id: 'APP-156', name: 'Snowflake data warehouse',        meta: 'SaaS · external',          kind: 'Application', color: 'var(--info)' },
    { id: 'SUP-040', name: 'Cloudflare',                      meta: 'Sub-processor · CDN',      kind: 'Supplier',    color: 'var(--warn)' },
    { id: 'IA-026',  name: 'Product usage telemetry',         meta: 'Sub-asset',                kind: 'Sub-asset',   color: 'var(--danger)' },
    { id: 'PR-031',  name: 'Incident response runbook',       meta: 'Owner · Goran T.',         kind: 'Process',     color: 'var(--accent)' },
  ];

  readonly linkedColumns: TableColumn[] = [
    { key: 'id',   label: 'ID',            kind: 'mono', width: '96px',           get: (r) => r.id },
    { key: 'name', label: 'NAME · DETAIL', kind: 'name', width: 'minmax(0, 1fr)', get: (r) => r.name, sub: (r) => r.meta },
    { key: 'kind', label: 'KIND',          kind: 'badge', width: '150px',         get: (r) => r.kind, badgeClass: (r) => KIND_BADGE[r.kind] ?? 'tok-default' },
  ];

  // -------- Dummy assessments (Assessment assets tab) --------
  readonly assessments = [
    { id: 'RA-2024-07', name: 'Annual ISO 27001 risk assessment',     framework: 'ISO/IEC 27001', year: '2024', completion: 100 },
    { id: 'GA-2023-11', name: 'GDPR data protection gap analysis',     framework: 'GDPR',          year: '2023', completion: 82 },
    { id: 'RA-2023-03', name: 'Cloud hosting risk review',            framework: 'SOC 2 Type II', year: '2023', completion: 64 },
  ];

  readonly assessmentColumns: TableColumn[] = [
    { key: 'id',         label: 'ID',         kind: 'mono', width: '110px',          get: (r) => r.id },
    { key: 'name',       label: 'ASSESSMENT', kind: 'name', width: 'minmax(0, 1fr)', get: (r) => r.name },
    { key: 'framework',  label: 'FRAMEWORK',  kind: 'text', width: '160px',          get: (r) => r.framework },
    { key: 'year',       label: 'YEAR',       kind: 'mono', width: '70px', align: 'center', get: (r) => r.year },
    { key: 'status',     label: 'STATUS',     kind: 'badge', width: '140px',         get: (r) => (r.completion >= 100 ? 'Complete' : 'In progress'), badgeClass: (r) => (r.completion >= 100 ? 'tok-ok' : 'tok-info') },
    { key: 'completion', label: 'COMPLETE',   kind: 'mono', width: '90px', align: 'center', get: (r) => r.completion + '%' },
  ];

  readonly asset = computed<InfoAsset | undefined>(() => SEED.find((x) => x.id === this.id()));

  readonly classMeta = computed<ClassMeta>(() => {
    const a = this.asset();
    return a ? CLASS_META[a.classification] : CLASS_META.Internal;
  });

  // -------- Collapsible sections --------
  private readonly openSections = signal<Set<SectionKey>>(new Set(['base', 'specifics', 'protection']));
  isOpen(k: SectionKey): boolean {
    return this.openSections().has(k);
  }
  toggle(k: SectionKey) {
    this.openSections.update((s) => {
      const next = new Set(s);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }

  // -------- Tabs (visual only — body stays Overview, per the design) --------
  readonly tab = signal<TabKey>('overview');

  // -------- CIA level selector --------
  private readonly levelState = signal<Record<Dimension, number> | null>(null);

  level(d: Dimension): number {
    const explicit = this.levelState();
    if (explicit) return explicit[d];
    const a = this.asset();
    if (!a) return 0;
    return mapCia(a.cia[d]);
  }

  setLevel(d: Dimension, idx: number) {
    const a = this.asset();
    const base: Record<Dimension, number> =
      this.levelState() ??
      (a ? { c: mapCia(a.cia.c), i: mapCia(a.cia.i), a: mapCia(a.cia.a) } : { c: 0, i: 0, a: 0 });
    this.levelState.set({ ...base, [d]: idx });
  }
}

/** Map a 1–5 CIA score onto the 4-step level selector (0 None · 1 Normal · 2 High · 3 Very high). */
function mapCia(v: number): number {
  if (v >= 5) return 3;
  if (v === 4) return 3;
  if (v === 3) return 2;
  if (v <= 0) return 0;
  return 1;
}
