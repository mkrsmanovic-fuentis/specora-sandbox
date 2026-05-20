import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import {
  LucideActivity,
  LucideAlertTriangle,
  LucideArrowLeft,
  LucideBell,
  LucideChevronDown,
  LucideChevronRight,
  LucideClipboardList,
  LucideFileCheck2,
  LucideHelpCircle,
  LucidePackage,
  LucideSearch,
  LucideShieldAlert,
  LucideShieldCheck,
  LucideSlidersHorizontal,
  LucideTarget,
  LucideZap,
} from '@lucide/angular';

import { IsmsStore } from './core/isms-store';
import { SimulatorPanel } from './shell/simulator-panel.component';

type GlobalKey = 'inventory' | 'risk' | 'gap' | 'monitoring';
type MenuView = 'global' | GlobalKey;

interface GlobalItem {
  key: GlobalKey;
  label: string;
  /** When true the rail drills into an inner menu. When false the click navigates. */
  hasChildren: boolean;
  /** Route for direct-nav items. */
  route?: string;
}

interface NavItem {
  path: string;
  label: string;
  step: string;
}

const RISK_ROUTES = ['/criteria', '/register', '/treatment', '/soa'];

function isRiskUrl(url: string): boolean {
  return RISK_ROUTES.some((r) => url === r || url.startsWith(r + '?') || url.startsWith(r + '/'));
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideActivity,
    LucideAlertTriangle,
    LucideArrowLeft,
    LucideBell,
    LucideChevronDown,
    LucideChevronRight,
    LucideClipboardList,
    LucideFileCheck2,
    LucideHelpCircle,
    LucidePackage,
    LucideSearch,
    LucideShieldAlert,
    LucideShieldCheck,
    LucideSlidersHorizontal,
    LucideTarget,
    LucideZap,
    SimulatorPanel,
  ],
  template: `
    <div class="grid grid-cols-[280px_1fr] min-h-screen">
      <!-- LEFT RAIL -->
      <aside class="bg-bg-2 border-r border-line-soft sticky top-0 h-screen flex flex-col overflow-hidden">
        <div class="px-5 pt-5 pb-3 border-b border-line-soft">
          <div class="flex items-center gap-2">
            <span class="w-7 h-7 rounded-md grid place-items-center text-accent-fg font-bold text-[12px] shrink-0"
                  style="background:linear-gradient(135deg, var(--accent), #5cd8a8); box-shadow:0 0 0 1px rgb(140 240 200/0.30), 0 0 18px rgb(140 240 200/0.25);">
              S
            </span>
            <span class="text-[15px] font-semibold text-fg">specora</span>
            <span class="font-mono font-normal text-fg-3 text-xs">sandbox</span>
          </div>
        </div>

        <nav class="flex-1 overflow-hidden relative" aria-label="Sidebar">
          <!-- GLOBAL pane -->
          <div class="innernav-pane absolute inset-0 overflow-y-auto px-3 py-3 flex flex-col gap-0.5"
               [class.innernav-pane-active]="activeMenu() === 'global'"
               [class.innernav-pane-leave-left]="leavingMenu() === 'global'"
               [attr.aria-hidden]="activeMenu() === 'global' ? null : true"
               [attr.inert]="activeMenu() === 'global' ? null : ''">
            <div class="px-2 pt-2 pb-1 text-[10px] font-mono tracking-[0.12em] text-fg-4">Workspace</div>
            @for (item of globalItems; track item.key) {
              <button type="button"
                      class="rail-link group flex items-center gap-2.5 px-2 py-2 rounded-md text-left hover:bg-surface w-full"
                      [class.rail-active]="isGlobalActive(item)"
                      (click)="onGlobalClick(item)">
                <span class="rail-icon w-7 h-7 rounded-md grid place-items-center shrink-0 bg-surface border border-line-soft text-fg-3">
                  @switch (item.key) {
                    @case ('inventory')  { <svg lucidePackage class="w-3.5 h-3.5"></svg> }
                    @case ('risk')       { <svg lucideShieldAlert class="w-3.5 h-3.5"></svg> }
                    @case ('gap')        { <svg lucideTarget class="w-3.5 h-3.5"></svg> }
                    @case ('monitoring') { <svg lucideActivity class="w-3.5 h-3.5"></svg> }
                  }
                </span>
                <span class="flex-1 text-[13px] text-fg-2 group-hover:text-fg rail-label">{{ item.label }}</span>
                @if (item.hasChildren) {
                  <svg lucideChevronRight class="w-3.5 h-3.5 text-fg-4 opacity-0 group-hover:opacity-100 transition-opacity"></svg>
                }
              </button>
            }
          </div>

          <!-- RISK inner pane -->
          <div class="innernav-pane absolute inset-0 overflow-y-auto px-3 py-3 flex flex-col gap-0.5"
               [class.innernav-pane-active]="activeMenu() === 'risk'"
               [class.innernav-pane-leave-left]="leavingMenu() === 'risk'"
               [attr.aria-hidden]="activeMenu() === 'risk' ? null : true"
               [attr.inert]="activeMenu() === 'risk' ? null : ''">
            <button type="button"
                    class="back-link flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-surface text-fg-3 hover:text-fg w-full"
                    (click)="back()">
              <svg lucideArrowLeft class="w-3.5 h-3.5"></svg>
              <span class="text-[12.5px] font-medium">Risk Workflow</span>
            </button>

            <div class="mx-2 my-2 border-t border-line-soft"></div>

            @for (item of nav; track item.path) {
              <a
                [routerLink]="['/', item.path]"
                routerLinkActive="rail-active"
                class="rail-link group flex items-start gap-2.5 px-2 py-2 rounded-md text-left hover:bg-surface">
                <span class="rail-icon w-7 h-7 rounded-md grid place-items-center shrink-0 bg-surface border border-line-soft text-fg-3">
                  @switch (item.path) {
                    @case ('criteria')  { <svg lucideSlidersHorizontal class="w-3.5 h-3.5"></svg> }
                    @case ('register')  { <svg lucideAlertTriangle class="w-3.5 h-3.5"></svg> }
                    @case ('treatment') { <svg lucideShieldCheck class="w-3.5 h-3.5"></svg> }
                    @case ('soa')       { <svg lucideFileCheck2 class="w-3.5 h-3.5"></svg> }
                  }
                </span>
                <span class="flex-1 min-w-0">
                  <span class="flex items-center gap-2">
                    <span class="font-mono text-[9.5px] tracking-[0.12em] text-fg-4">{{ item.step }}</span>
                    @if (item.path === 'register' && store.registerSummary().reviewRequired > 0) {
                      <span class="font-mono text-[9px] tracking-wider px-1 py-0.5 rounded"
                            style="background:rgb(240 201 135 / 0.20); color:var(--warn)">
                        REVIEW
                      </span>
                    }
                    @if (item.path === 'treatment' && store.registerSummary().breaching > 0) {
                      <span class="font-mono text-[9px] tracking-wider px-1 py-0.5 rounded"
                            style="background:rgb(242 164 164 / 0.20); color:var(--danger)">
                        {{ store.registerSummary().breaching }}
                      </span>
                    }
                  </span>
                  <span class="text-[13px] text-fg-2 group-hover:text-fg block leading-tight rail-label">{{ item.label }}</span>
                </span>
              </a>
            }
          </div>
        </nav>

        <div class="px-4 py-3 border-t border-line-soft flex items-center gap-2.5">
          <span class="w-7 h-7 rounded-full grid place-items-center text-accent-fg font-semibold text-[11px] bg-accent">MK</span>
          <div class="flex-1 min-w-0">
            <div class="text-[12.5px] text-fg truncate">Marko K.</div>
            <div class="text-[10.5px] text-fg-4 truncate">Risk Lead · Risk Framework</div>
          </div>
          <button class="btn-iconplain" aria-label="Account"><svg lucideChevronDown class="w-3.5 h-3.5"></svg></button>
        </div>
      </aside>

      <!-- MAIN -->
      <main class="overflow-hidden h-screen flex flex-col">
        <!-- TOPBAR -->
        <div class="bg-bg-2 border-b border-line-soft flex items-center gap-4 px-6 h-14 shrink-0">
          <div class="flex items-center gap-2 text-[11.5px] text-fg-3">
            <span>ISMS</span>
            <svg class="w-3 h-3 text-fg-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            <span>Risk workflow</span>
            <svg class="w-3 h-3 text-fg-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
            <span class="text-fg">{{ pageTitle() }}</span>
          </div>

          <div class="flex-1 flex justify-center min-w-0">
            <button class="w-full max-w-[420px] inline-flex items-center gap-2 h-9 px-3 bg-bg border border-line-soft rounded-md text-fg-3 hover:border-line">
              <svg lucideSearch class="w-4 h-4"></svg>
              <span class="text-[12.5px] flex-1 text-left">Search risks, controls, treatments…</span>
              <span class="font-mono text-[10px] bg-surface border border-line-soft rounded px-1.5 py-0.5 text-fg-4">⌘K</span>
            </button>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button class="relative inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-fg-2 hover:bg-surface hover:text-fg">
              <svg lucideClipboardList class="w-4 h-4"></svg>
              <span class="text-[12.5px] font-medium">Tasks</span>
              <span class="min-w-[16px] h-[16px] px-1 rounded-full bg-surface border border-line-soft text-fg-3 font-mono text-[10px] font-bold grid place-items-center">
                {{ store.registerSummary().breaching }}
              </span>
            </button>
            <button class="relative inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md hover:bg-surface"
                    [class.text-fg]="simulatorOpen()"
                    [class.text-fg-2]="!simulatorOpen()"
                    [style.background]="simulatorOpen() ? 'var(--surface)' : ''"
                    (click)="simulatorOpen.set(!simulatorOpen())">
              <svg lucideZap class="w-4 h-4"></svg>
              <span class="text-[12.5px] font-medium">Continuous review</span>
              @if (store.events().length > 0) {
                <span class="min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-accent-fg font-mono text-[10px] font-bold grid place-items-center">
                  {{ store.events().length }}
                </span>
              }
            </button>
            <button class="relative inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-fg-2 hover:bg-surface hover:text-fg" aria-label="Notifications">
              <svg lucideBell class="w-4 h-4"></svg>
              @if (store.registerSummary().reviewRequired > 0) {
                <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger"></span>
              }
            </button>
            <span class="w-px h-5 bg-line-soft mx-1"></span>
            <button class="btn-iconplain" aria-label="Help"><svg lucideHelpCircle class="w-4 h-4"></svg></button>
          </div>
        </div>

        <!-- PAGE GRID — content + simulator panel -->
        <div class="flex-1 overflow-hidden grid"
             [style.gridTemplateColumns]="simulatorOpen() ? '1fr 360px' : '1fr 0px'"
             style="transition: grid-template-columns 0.2s ease;">
          <div class="overflow-y-auto">
            <router-outlet />
          </div>
          @if (simulatorOpen()) {
            <app-simulator-panel (closed)="simulatorOpen.set(false)" />
          }
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host { display: block; }

      /* Subtle pane swap — slide-fade ±12px */
      .innernav-pane {
        opacity: 0;
        transform: translateX(12px);
        pointer-events: none;
        transition: opacity 180ms ease, transform 220ms cubic-bezier(0.22, 0.61, 0.36, 1);
      }
      .innernav-pane.innernav-pane-active {
        opacity: 1;
        transform: translateX(0);
        pointer-events: auto;
      }
      .innernav-pane.innernav-pane-leave-left {
        opacity: 0;
        transform: translateX(-12px);
        pointer-events: none;
      }
      @media (prefers-reduced-motion: reduce) {
        .innernav-pane {
          transition: opacity 80ms linear;
          transform: none !important;
        }
      }

      .rail-link {
        transition: background 0.12s ease;
      }
      .rail-link.rail-active {
        background: var(--accent-dim);
      }
      .rail-link.rail-active .rail-label { color: var(--fg); font-weight: 500; }
      .rail-link.rail-active .rail-icon { color: var(--accent); border-color: var(--accent); background: rgb(140 240 200 / 0.08); }
    `,
  ],
})
export class App {
  readonly store = inject(IsmsStore);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);

  readonly simulatorOpen = signal(false);
  readonly currentTitle = signal('Risk Workflow');
  readonly pageTitle = computed(() => this.currentTitle());

  readonly activeMenu = signal<MenuView>('global');
  /** While a pane is animating out, it stays mounted with `innernav-pane-leave-left`. Cleared after the transition. */
  readonly leavingMenu = signal<MenuView | null>(null);
  private leaveTimer: ReturnType<typeof setTimeout> | null = null;

  readonly globalItems: GlobalItem[] = [
    { key: 'inventory',  label: 'Inventory',  hasChildren: false, route: 'inventory' },
    { key: 'risk',       label: 'Risk',       hasChildren: true },
    { key: 'gap',        label: 'Gap',        hasChildren: false, route: 'gap' },
    { key: 'monitoring', label: 'Monitoring', hasChildren: false, route: 'monitoring' },
  ];

  readonly nav: NavItem[] = [
    { path: 'criteria',  step: 'STEP 01', label: 'Risk criteria' },
    { path: 'register',  step: 'STEP 02', label: 'Risk register' },
    { path: 'treatment', step: 'STEP 03', label: 'Treatment plan' },
    { path: 'soa',       step: 'STEP 04', label: 'Statement of Applicability' },
  ];

  constructor() {
    // Track page title (used in topbar)
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const route = this.findDeepest(this.route);
        this.currentTitle.set((route.snapshot.data['title'] as string) ?? 'Risk Workflow');
      });

    // Snap the rail to the matching menu state on the first resolved navigation.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        take(1),
      )
      .subscribe(() => {
        if (isRiskUrl(this.router.url)) this.activeMenu.set('risk');
      });
  }

  isGlobalActive(item: GlobalItem): boolean {
    const url = this.router.url;
    if (item.key === 'risk') return isRiskUrl(url);
    return item.route ? url.startsWith('/' + item.route) : false;
  }

  onGlobalClick(item: GlobalItem) {
    if (item.hasChildren) {
      this.swapMenu(item.key);
      if (item.key === 'risk' && !isRiskUrl(this.router.url)) {
        this.router.navigate(['/register']);
      }
      return;
    }
    if (item.route) this.router.navigate(['/', item.route]);
  }

  back() {
    this.swapMenu('global');
  }

  private swapMenu(next: MenuView) {
    const prev = this.activeMenu();
    if (prev === next) return;
    if (this.leaveTimer) clearTimeout(this.leaveTimer);
    this.leavingMenu.set(prev);
    this.activeMenu.set(next);
    // Match the longer of the two pane transitions (220ms transform).
    this.leaveTimer = setTimeout(() => this.leavingMenu.set(null), 240);
  }

  private findDeepest(route: ActivatedRoute): ActivatedRoute {
    let r = route;
    while (r.firstChild) r = r.firstChild;
    return r;
  }
}
