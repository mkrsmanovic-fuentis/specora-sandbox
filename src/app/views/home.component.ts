import { Component } from '@angular/core';
import {
  LucideAlertTriangle,
  LucideBookOpen,
  LucideCheck,
  LucideChevronRight,
  LucideFileText,
  LucideMoreHorizontal,
  LucidePackage,
  LucidePlus,
  LucideShieldAlert,
  LucideUsers,
} from '@lucide/angular';

interface QueueItem {
  source: 'POLICY' | 'CONTROL' | 'RISK' | 'VENDOR' | 'PEOPLE';
  title: string;
  titleStrong: string;
  meta: string;
  due: string;
  dueTone: 'muted' | 'danger';
  action: string;
  actionTone: 'primary' | 'ghost';
}

interface Posture {
  kicker: string;
  value: string;
  trend: string;
  trendTone: 'up' | 'down' | 'flat';
  note: string;
}

interface DriftItem {
  dotTone: 'danger' | 'warn' | 'accent';
  channel: string;
  time: string;
  opacity?: number;
}

interface Kpi {
  kicker: string;
  value: string;
  unit: string;
  delta: string;
  deltaTone: 'up' | 'down' | 'flat';
  sparkPoints: string;
  sparkTone: 'accent' | 'warn' | 'muted';
}

interface Track {
  name: string;
  badge: string;
  badgeTone: 'isms' | 'default';
  percent: number;
  deadline: string;
  deadlineStrong: string;
  progressTone: 'accent' | 'warn' | 'muted';
  footLeft: string;
  footLeftTone: 'danger' | 'warn' | 'muted';
  footRight: string;
}

@Component({
  selector: 'app-home-view',
  standalone: true,
  imports: [
    LucideAlertTriangle,
    LucideBookOpen,
    LucideCheck,
    LucideChevronRight,
    LucideFileText,
    LucideMoreHorizontal,
    LucidePackage,
    LucidePlus,
    LucideShieldAlert,
    LucideUsers,
  ],
  template: `
    <section class="home px-8 py-6 flex flex-col gap-4">

      <!-- 8. QUICK ACTIONS -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="hm-kicker mr-1">QUICK</span>
        <button class="hm-qa"><svg lucidePlus class="w-3 h-3"></svg>Log incident</button>
        <button class="hm-qa"><svg lucidePlus class="w-3 h-3"></svg>Add risk</button>
        <button class="hm-qa"><svg lucidePlus class="w-3 h-3"></svg>Upload evidence</button>
        <button class="hm-qa"><svg lucidePlus class="w-3 h-3"></svg>Start audit prep</button>
        <button class="hm-qa"><svg lucideFileText class="w-3 h-3"></svg>Generate report</button>
      </div>

      <!-- 1. TODAY BAR -->
      <div class="hm-hero">
        <div class="flex items-start justify-between gap-6">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="hm-kicker text-accent">TODAY</span>
              <span class="hm-kicker">·</span>
              <span class="hm-kicker">10 days to ISO 27001 recertification</span>
            </div>
            <div class="text-[17px] leading-snug text-fg font-medium tracking-tight">
              You're <span class="font-mono font-semibold text-accent">78%</span> audit-ready.
              <span class="text-fg-2">Three blockers stand between you and <span class="text-fg">ISO 27001 recertification</span> on <span class="font-mono">May 14</span>.</span>
            </div>
            <div class="flex items-center gap-4 mt-3 text-[11.5px] font-mono text-fg-3">
              <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full" style="background:var(--danger);"></span>1 critical evidence gap</span>
              <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full" style="background:var(--warn);"></span>2 stale controls</span>
              <span class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full" style="background:var(--info);"></span>1 awaiting CISO sign-off</span>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button class="inline-flex items-center gap-1.5 h-8 px-3 bg-accent text-accent-fg rounded-md text-[12.5px] font-medium hover:opacity-90">
              Fix blockers <svg lucideChevronRight class="w-3 h-3"></svg>
            </button>
            <button class="inline-flex items-center gap-1.5 h-8 px-3 border border-line text-fg-2 rounded-md text-[12.5px] hover:bg-surface-hi">Snooze</button>
          </div>
        </div>
      </div>

      <!-- 3 + 4. ACTION QUEUE + NEXT BEST ACTION -->
      <div class="grid gap-4" style="grid-template-columns: 1.55fr 1fr;">

        <!-- ACTION QUEUE -->
        <div class="hm-card">
          <div class="hm-card-h">
            <div class="flex items-center gap-2">
              <span class="hm-title">Needs you</span>
              <span class="font-mono text-[10.5px] bg-surface-hi text-fg-3 border border-line-soft rounded-full px-1.5 leading-none py-0.5">{{ queue.length }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button class="w-7 h-7 grid place-items-center rounded text-fg-3 hover:bg-surface hover:text-fg" aria-label="More">
                <svg lucideMoreHorizontal class="w-3.5 h-3.5"></svg>
              </button>
            </div>
          </div>

          <ul class="divide-y divide-line-soft">
            @for (q of queue; track q.title) {
              <li class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3 hover:bg-surface-hi/40">
                <span class="hm-chip" [class]="'hm-src-' + q.source.toLowerCase()">
                  @switch (q.source) {
                    @case ('POLICY')  { <svg lucideBookOpen class="hm-chip-ico"></svg> }
                    @case ('CONTROL') { <svg lucideShieldAlert class="hm-chip-ico"></svg> }
                    @case ('RISK')    { <svg lucideAlertTriangle class="hm-chip-ico"></svg> }
                    @case ('VENDOR')  { <svg lucidePackage class="hm-chip-ico"></svg> }
                    @case ('PEOPLE')  { <svg lucideUsers class="hm-chip-ico"></svg> }
                  }
                  {{ q.source }}
                </span>
                <div class="min-w-0">
                  <div class="text-[13px] text-fg font-medium leading-snug truncate" [innerHTML]="q.title"></div>
                  <div class="text-[11px] font-mono text-fg-4 mt-0.5">{{ q.meta }}</div>
                </div>
                <span class="font-mono text-[10.5px]" [class.text-danger]="q.dueTone === 'danger'" [class.text-fg-3]="q.dueTone !== 'danger'">{{ q.due }}</span>
                <button
                  class="inline-flex items-center h-7 px-3 rounded text-[11.5px] font-medium"
                  [class.bg-accent]="q.actionTone === 'primary'"
                  [class.text-accent-fg]="q.actionTone === 'primary'"
                  [class.hover:opacity-90]="q.actionTone === 'primary'"
                  [class.border]="q.actionTone === 'ghost'"
                  [class.border-line]="q.actionTone === 'ghost'"
                  [class.text-fg-2]="q.actionTone === 'ghost'"
                  [class.hover:bg-surface-hi]="q.actionTone === 'ghost'">
                  {{ q.action }}
                </button>
              </li>
            }
          </ul>

          <div class="px-4 py-2.5 border-t border-line-soft flex items-center justify-between text-[11.5px]">
            <span class="text-fg-3">Only items <b class="text-fg-2">assigned to you</b> that block someone else.</span>
            <a class="text-fg-2 hover:text-fg cursor-pointer">All tasks <span class="font-mono text-fg-4">12</span> →</a>
          </div>
        </div>

        <!-- NEXT BEST ACTION -->
        <div class="hm-card flex flex-col" style="background: linear-gradient(180deg, color-mix(in oklab, var(--accent) 10%, var(--surface)), var(--surface));">
          <div class="hm-card-h">
            <div class="flex items-center gap-2">
              <span class="hm-title">For you, today</span>
            </div>
          </div>
          <div class="flex-1 px-5 py-5 flex flex-col gap-3">
            <div class="w-9 h-9 rounded-md grid place-items-center" style="background: color-mix(in oklab, var(--accent) 20%, transparent); color: var(--accent);">
              <svg lucideFileText class="w-4 h-4"></svg>
            </div>
            <div>
              <h4 class="text-[17px] font-semibold tracking-tight text-fg leading-snug">Generate the Q2 Board Report</h4>
              <p class="text-[12.5px] text-fg-2 mt-1.5 leading-relaxed">
                Last generated <span class="font-mono">92 days</span> ago. Your next board meeting is in
                <span class="font-mono text-fg">6 days</span>. We have enough fresh data to draft it now.
              </p>
            </div>
            <ul class="text-[11.5px] text-fg-3 space-y-1 mt-1">
              <li class="flex items-center gap-2"><svg lucideCheck class="w-3 h-3 text-accent"></svg>Risk register up to date</li>
              <li class="flex items-center gap-2"><svg lucideCheck class="w-3 h-3 text-accent"></svg>Incident log closed through April</li>
              <li class="flex items-center gap-2"><svg lucideAlertTriangle class="w-3 h-3 text-warn"></svg>3 KPIs need narrative</li>
            </ul>
            <div class="flex items-center gap-2 mt-auto pt-2">
              <button class="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 bg-accent text-accent-fg rounded-md text-[12.5px] font-semibold hover:opacity-90">
                Start draft <svg lucideChevronRight class="w-3 h-3"></svg>
              </button>
              <button class="inline-flex items-center h-9 px-3 text-fg-3 hover:text-fg rounded-md text-[12px]">Not now</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 5 + 6. POSTURE + DRIFT FEED -->
      <div class="grid gap-4" style="grid-template-columns: 1fr 1.1fr;">
        <!-- POSTURE -->
        <div class="hm-card">
          <div class="hm-card-h">
            <div class="flex items-center gap-2">
              <span class="hm-title">Health signals</span>
            </div>
          </div>
          <div class="grid grid-cols-2 hm-quad-grid">
            @for (p of posture; track p.kicker; let i = $index) {
              <button class="hm-quad text-left hover:bg-surface-hi/40"
                      [class.hm-quad-tl]="i === 0"
                      [class.hm-quad-tr]="i === 1"
                      [class.hm-quad-bl]="i === 2"
                      [class.hm-quad-br]="i === 3">
                <div class="hm-kicker mb-1.5">{{ p.kicker }}</div>
                <div class="flex items-baseline gap-2">
                  <span class="hm-num text-[26px]">{{ p.value }}</span>
                  <span class="hm-trend" [class]="'hm-trend-' + p.trendTone">{{ p.trend }}</span>
                </div>
                <div class="text-[11px] text-fg-3 mt-1">{{ p.note }}</div>
              </button>
            }
          </div>
        </div>

        <!-- DRIFT FEED -->
        <div class="hm-card flex flex-col">
          <div class="hm-card-h">
            <div class="flex items-center gap-2">
              <span class="hm-title">Changed since you were here</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-mono text-fg-3">since Fri 17:02</span>
            </div>
          </div>
          <ul class="px-3 py-1.5 flex-1">
            <li class="flex items-start gap-3 px-2 py-2.5 rounded-md hover:bg-surface-hi/50">
              <span class="hm-dot mt-1.5" style="background: var(--danger); color: var(--danger);"></span>
              <div class="flex-1 min-w-0">
                <div class="text-[12.5px] text-fg-2 leading-snug"><span class="text-fg font-medium">Control A.8.24</span> moved <span class="text-danger font-medium">passing → failing</span> · evidence stale</div>
                <div class="text-[10.5px] font-mono text-fg-4 mt-0.5">2h ago · ISMS</div>
              </div>
              <button class="text-[11px] font-mono text-fg-3 hover:text-fg px-2 py-1">OPEN</button>
            </li>
            <li class="flex items-start gap-3 px-2 py-2.5 rounded-md hover:bg-surface-hi/50">
              <span class="hm-dot mt-1.5" style="background: var(--danger); color: var(--danger);"></span>
              <div class="flex-1 min-w-0">
                <div class="text-[12.5px] text-fg-2 leading-snug">Critical vulnerability <span class="font-mono text-fg">CVE-2026-1148</span> affects <span class="text-fg">3 of your assets</span></div>
                <div class="text-[10.5px] font-mono text-fg-4 mt-0.5">6h ago · VULNS</div>
              </div>
              <button class="text-[11px] font-mono text-fg-3 hover:text-fg px-2 py-1">OPEN</button>
            </li>
            <li class="flex items-start gap-3 px-2 py-2.5 rounded-md hover:bg-surface-hi/50">
              <span class="hm-dot mt-1.5" style="background: var(--warn); color: var(--warn);"></span>
              <div class="flex-1 min-w-0">
                <div class="text-[12.5px] text-fg-2 leading-snug">
                  New risk above threshold · <span class="text-fg font-medium">R-042 Supplier outage</span>
                  <span class="hm-chip ml-1" style="height:16px; padding:0 5px; color:var(--warn); background:rgb(240 201 135 / 0.14); border-color:rgb(240 201 135 / 0.28);">HIGH</span>
                </div>
                <div class="text-[10.5px] font-mono text-fg-4 mt-0.5">yesterday · RISKS</div>
              </div>
              <button class="text-[11px] font-mono text-fg-3 hover:text-fg px-2 py-1">OPEN</button>
            </li>
            <li class="flex items-start gap-3 px-2 py-2.5 rounded-md hover:bg-surface-hi/50">
              <span class="hm-dot mt-1.5" style="background: var(--warn); color: var(--warn);"></span>
              <div class="flex-1 min-w-0">
                <div class="text-[12.5px] text-fg-2 leading-snug">Vendor <span class="text-fg font-medium">AWS</span> SOC 2 expired — re-review required</div>
                <div class="text-[10.5px] font-mono text-fg-4 mt-0.5">yesterday · VENDORS</div>
              </div>
              <button class="text-[11px] font-mono text-fg-3 hover:text-fg px-2 py-1">OPEN</button>
            </li>
            <li class="flex items-start gap-3 px-2 py-2.5 rounded-md hover:bg-surface-hi/50 opacity-80">
              <span class="hm-dot mt-1.5" style="background: var(--accent); color: var(--accent);"></span>
              <div class="flex-1 min-w-0">
                <div class="text-[12.5px] text-fg-2 leading-snug">Policy <span class="text-fg font-medium">Incident Response</span> re-approved by CISO</div>
                <div class="text-[10.5px] font-mono text-fg-4 mt-0.5">2d ago · POLICIES</div>
              </div>
              <button class="text-[11px] font-mono text-fg-3 hover:text-fg px-2 py-1">OPEN</button>
            </li>
          </ul>
        </div>
      </div>

      <!-- 7. KPIs -->
      <div class="hm-card">
        <div class="hm-card-h">
          <div class="flex items-center gap-2">
            <span class="hm-title">Pinned by you</span>
            <span class="font-mono text-[10.5px] bg-surface-hi text-fg-3 border border-line-soft rounded-full px-1.5 leading-none py-0.5">{{ kpis.length }}</span>
          </div>
          <button class="text-[11.5px] font-mono text-fg-3 hover:text-fg px-2 py-1">EDIT PINS</button>
        </div>
        <div class="grid grid-cols-4 divide-x divide-line-soft">
          @for (k of kpis; track k.kicker) {
            <div class="px-5 py-4 flex flex-col gap-2">
              <div class="hm-kicker">{{ k.kicker }}</div>
              <div class="flex items-baseline gap-2">
                <span class="hm-num text-[22px]">{{ k.value }}<span class="text-fg-3 text-[12px]">{{ k.unit }}</span></span>
                <span class="hm-trend text-[10.5px]" [class]="'hm-trend-' + k.deltaTone">{{ k.delta }}</span>
              </div>
              <svg class="w-full h-7" [class]="'hm-spark-' + k.sparkTone" viewBox="0 0 120 28" preserveAspectRatio="none">
                <polyline fill="none" stroke="currentColor" stroke-width="1.4" [attr.points]="k.sparkPoints"></polyline>
              </svg>
            </div>
          }
        </div>
      </div>

      <!-- 2. TRACK PROGRESS STRIP -->
      <div class="hm-card">
        <div class="hm-card-h">
          <div class="flex items-center gap-2">
            <span class="hm-title">Active frameworks</span>
            <span class="font-mono text-[10.5px] bg-surface-hi text-fg-3 border border-line-soft rounded-full px-1.5 leading-none py-0.5">{{ tracks.length }}</span>
          </div>
          <button class="inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[12px] text-fg-3 hover:text-fg hover:bg-surface-hi">
            <svg lucidePlus class="w-3 h-3"></svg>Add track
          </button>
        </div>
        <div class="grid grid-cols-3 divide-x divide-line-soft">
          @for (t of tracks; track t.name) {
            <button class="text-left px-5 py-4 hover:bg-surface-hi/40 transition flex flex-col gap-2">
              <div class="flex items-center justify-between gap-2">
                <span class="text-[13px] font-semibold text-fg">{{ t.name }}</span>
                <span class="hm-chip" [class.hm-src-isms]="t.badgeTone === 'isms'">{{ t.badge }}</span>
              </div>
              <div class="flex items-baseline justify-between">
                <span class="hm-num text-[22px]">{{ t.percent }}<span class="text-fg-3 text-[14px]">%</span></span>
                <span class="text-[11px] font-mono text-fg-3">{{ t.deadline }} <b class="text-fg">{{ t.deadlineStrong }}</b></span>
              </div>
              <div class="hm-progress" [class.warn]="t.progressTone === 'warn'" [class.muted]="t.progressTone === 'muted'">
                <i [style.width.%]="t.percent"></i>
              </div>
              <div class="flex items-center justify-between text-[11px] font-mono mt-1">
                <span [class.text-danger]="t.footLeftTone === 'danger'"
                      [class.text-warn]="t.footLeftTone === 'warn'"
                      [class.text-fg-3]="t.footLeftTone === 'muted'">
                  {{ t.footLeft }}
                </span>
                <span class="text-fg-3">{{ t.footRight }}</span>
              </div>
            </button>
          }
        </div>
      </div>

    </section>
  `,
  styles: [
    `
      :host { display: block; }

      .hm-kicker {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; letter-spacing: 0.12em;
        color: var(--fg-4);
      }
      .hm-title { font-size: 13px; font-weight: 600; color: var(--fg); }

      .hm-card {
        background: var(--surface);
        border: 1px solid var(--line-soft);
        border-radius: 10px;
      }
      .hm-card-h {
        display: flex; align-items: center; justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid var(--line-soft);
      }

      .hm-num {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-weight: 600; color: var(--fg);
      }

      .hm-chip {
        display: inline-flex; align-items: center; gap: 4px;
        height: 18px; padding: 0 6px;
        border-radius: 4px;
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 9.5px; letter-spacing: 0.08em;
        color: var(--fg-3); background: var(--bg); border: 1px solid var(--line-soft);
      }
      .hm-chip-ico { width: 10px; height: 10px; }
      .hm-src-policy  { color: var(--info);   background: rgb(141 198 245 / 0.10); border-color: rgb(141 198 245 / 0.22); }
      .hm-src-control { color: var(--accent); background: rgb(140 240 200 / 0.10); border-color: rgb(140 240 200 / 0.22); }
      .hm-src-risk    { color: var(--danger); background: rgb(242 164 164 / 0.10); border-color: rgb(242 164 164 / 0.22); }
      .hm-src-vendor  { color: var(--warn);   background: rgb(240 201 135 / 0.10); border-color: rgb(240 201 135 / 0.22); }
      .hm-src-people  { color: #c8a8f0;       background: rgb(200 168 240 / 0.10); border-color: rgb(200 168 240 / 0.22); }
      .hm-src-isms    { color: var(--accent); background: rgb(140 240 200 / 0.10); border-color: rgb(140 240 200 / 0.22); }

      /* Hero / today bar */
      .hm-hero {
        position: relative;
        background:
          radial-gradient(120% 200% at 100% 0%, color-mix(in oklab, var(--accent) 14%, transparent), transparent 55%),
          var(--surface-2);
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 18px 20px;
        overflow: hidden;
      }
      .hm-hero::before {
        content: ""; position: absolute; left: 0; top: 0; bottom: 0;
        width: 3px; background: var(--accent);
      }

      /* Progress bar */
      .hm-progress {
        height: 4px; border-radius: 2px; background: var(--bg);
        overflow: hidden;
      }
      .hm-progress > i {
        display: block; height: 100%;
        background: var(--accent);
      }
      .hm-progress.warn  > i { background: var(--warn); }
      .hm-progress.muted > i { background: var(--fg-4); }

      /* Quad tile */
      .hm-quad-grid { grid-template-rows: 1fr 1fr; }
      .hm-quad {
        padding: 12px 14px;
      }
      .hm-quad-tr { border-left: 1px solid var(--line-soft); }
      .hm-quad-bl { border-top:  1px solid var(--line-soft); }
      .hm-quad-br { border-top:  1px solid var(--line-soft); border-left: 1px solid var(--line-soft); }

      .hm-trend { font-size: 11px; color: var(--fg-3); display: inline-flex; align-items: center; gap: 4px; }
      .hm-trend-up   { color: var(--danger); }
      .hm-trend-down { color: var(--accent); }
      .hm-trend-flat { color: var(--fg-3); }

      /* Drift markers */
      .hm-dot {
        width: 6px; height: 6px; border-radius: 999px; flex-shrink: 0;
        box-shadow: 0 0 0 3px color-mix(in oklab, currentColor 18%, transparent);
      }

      /* Sparklines */
      .hm-spark-accent { color: var(--accent); }
      .hm-spark-warn   { color: var(--warn); }
      .hm-spark-muted  { color: var(--fg-3); }

      /* Quick action pills */
      .hm-qa {
        display: inline-flex; align-items: center; gap: 6px;
        height: 30px; padding: 0 12px;
        border-radius: 6px;
        background: var(--surface);
        border: 1px solid var(--line-soft);
        color: var(--fg-2);
        font-size: 12px;
        transition: border-color .12s, color .12s, background .12s;
      }
      .hm-qa:hover { border-color: var(--line); color: var(--fg); background: var(--surface-hi); }
    `,
  ],
})
export class HomeView {
  readonly queue: QueueItem[] = [
    {
      source: 'POLICY',
      title: 'Approve <span class="text-fg-2">Access Control Policy v2.3</span>',
      titleStrong: '',
      meta: '≈ 2 min · Ana Petrović requested',
      due: 'DUE TODAY',
      dueTone: 'muted',
      action: 'Review',
      actionTone: 'primary',
    },
    {
      source: 'CONTROL',
      title: 'Evidence missing — <span class="text-fg-2">A.8.24 Cryptography use</span>',
      titleStrong: '',
      meta: '≈ 5 min · evidence stale 47 d',
      due: 'OVERDUE 2d',
      dueTone: 'danger',
      action: 'Upload',
      actionTone: 'ghost',
    },
    {
      source: 'RISK',
      title: 'Accept or treat — <span class="text-fg-2">R-042 Supplier outage</span>',
      titleStrong: '',
      meta: '≈ 3 min · raised by automation',
      due: 'DUE FRI',
      dueTone: 'muted',
      action: 'Decide',
      actionTone: 'ghost',
    },
    {
      source: 'VENDOR',
      title: '<span class="text-fg-2">AWS</span> SOC 2 attestation expired — re-review',
      titleStrong: '',
      meta: '≈ 4 min · 12 services affected',
      due: 'DUE FRI',
      dueTone: 'muted',
      action: 'Review',
      actionTone: 'ghost',
    },
    {
      source: 'PEOPLE',
      title: 'Q2 access review — <span class="text-fg-2">Engineering team</span>',
      titleStrong: '',
      meta: '≈ 10 min · 23 accounts',
      due: 'DUE JUN 10',
      dueTone: 'muted',
      action: 'Start',
      actionTone: 'ghost',
    },
  ];

  readonly posture: Posture[] = [
    { kicker: 'OPEN RISKS · HI/CRIT',  value: '12', trend: '▲ 3', trendTone: 'up',   note: '2 newly above threshold' },
    { kicker: 'FAILING CONTROLS',      value: '7',  trend: '▼ 2', trendTone: 'down', note: '5 with stale evidence' },
    { kicker: 'CRITICAL VULNS',        value: '4',  trend: '▲ 1', trendTone: 'up',   note: '1 unpatched > 30 d' },
    { kicker: 'VENDOR ISSUES',         value: '2',  trend: '— 0', trendTone: 'flat', note: 'expired attestations' },
  ];

  readonly kpis: Kpi[] = [
    {
      kicker: 'MEAN TIME TO REMEDIATE',
      value: '4.2', unit: 'd',
      delta: '▼ 0.8d', deltaTone: 'down',
      sparkPoints: '0,8 12,12 24,9 36,14 48,11 60,16 72,13 84,19 96,17 108,21 120,24',
      sparkTone: 'accent',
    },
    {
      kicker: 'EVIDENCE FRESHNESS',
      value: '87', unit: '%',
      delta: '▲ 4 pp', deltaTone: 'down',
      sparkPoints: '0,22 12,20 24,21 36,16 48,18 60,14 72,12 84,13 96,10 108,8 120,6',
      sparkTone: 'accent',
    },
    {
      kicker: 'TRAINING COMPLETION',
      value: '92', unit: '%',
      delta: '— 0', deltaTone: 'flat',
      sparkPoints: '0,10 12,11 24,10 36,9 48,10 60,9 72,10 84,9 96,10 108,9 120,9',
      sparkTone: 'muted',
    },
    {
      kicker: 'POLICY ACKNOWLEDGED',
      value: '78', unit: '%',
      delta: '▼ 6 pp', deltaTone: 'up',
      sparkPoints: '0,4 12,6 24,5 36,8 48,7 60,10 72,12 84,14 96,16 108,17 120,20',
      sparkTone: 'warn',
    },
  ];

  readonly tracks: Track[] = [
    {
      name: 'ISO 27001:2022',
      badge: 'ACTIVE', badgeTone: 'isms',
      percent: 78, deadline: 'audit', deadlineStrong: 'May 14',
      progressTone: 'accent',
      footLeft: '3 blockers', footLeftTone: 'danger',
      footRight: '12 open · 89 done',
    },
    {
      name: 'SOC 2 Type II',
      badge: 'IN PROGRESS', badgeTone: 'default',
      percent: 45, deadline: 'window', deadlineStrong: 'Jun 30',
      progressTone: 'warn',
      footLeft: '4 failing', footLeftTone: 'warn',
      footRight: '8 open · 41 done',
    },
    {
      name: 'NIS2',
      badge: 'SCOPING', badgeTone: 'default',
      percent: 22, deadline: 'unscheduled', deadlineStrong: '',
      progressTone: 'muted',
      footLeft: 'gap analysis', footLeftTone: 'muted',
      footRight: '—',
    },
  ];
}
