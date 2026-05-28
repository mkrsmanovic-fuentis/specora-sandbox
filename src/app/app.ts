import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import {
  LucideActivity,
  LucideAlertTriangle,
  LucideArrowLeft,
  LucideBarChart3,
  LucideBell,
  LucideBookOpen,
  LucideBuilding2,
  LucideChevronDown,
  LucideChevronRight,
  LucideClipboardList,
  LucideEye,
  LucideFileCheck2,
  LucideFileText,
  LucideGrid3X3,
  LucideHelpCircle,
  LucideListChecks,
  LucideLock,
  LucideMonitor,
  LucidePackage,
  LucidePlus,
  LucideSearch,
  LucideServer,
  LucideShieldAlert,
  LucideShieldCheck,
  LucideSlidersHorizontal,
  LucideTarget,
  LucideUsers,
  LucideWorkflow,
  LucideX,
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
const INVENTORY_PREFIX = '/inventory';

function isRiskUrl(url: string): boolean {
  return RISK_ROUTES.some((r) => url === r || url.startsWith(r + '?') || url.startsWith(r + '/'));
}
function isInventoryUrl(url: string): boolean {
  return url === INVENTORY_PREFIX || url.startsWith(INVENTORY_PREFIX + '/');
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
    LucideBarChart3,
    LucideBell,
    LucideBookOpen,
    LucideBuilding2,
    LucideChevronDown,
    LucideChevronRight,
    LucideClipboardList,
    LucideEye,
    LucideFileCheck2,
    LucideFileText,
    LucideGrid3X3,
    LucideHelpCircle,
    LucideListChecks,
    LucideLock,
    LucideMonitor,
    LucidePackage,
    LucidePlus,
    LucideSearch,
    LucideServer,
    LucideShieldAlert,
    LucideShieldCheck,
    LucideSlidersHorizontal,
    LucideTarget,
    LucideUsers,
    LucideWorkflow,
    LucideX,
    LucideZap,
    SimulatorPanel,
  ],
  template: `
    <div class="grid min-h-screen" [style.gridTemplateColumns]="isHome() ? '1fr' : '280px 1fr'">
      <!-- LEFT RAIL — hidden on Home -->
      @if (!isHome()) {
      <aside class="bg-bg-2 border-r border-line-soft sticky top-0 h-screen flex flex-col overflow-hidden">
        <div class="px-5 pt-5 pb-3 border-b border-line-soft">
          <a routerLink="/"
             class="flex items-center gap-2 -mx-2 px-2 py-1 rounded-md hover:bg-surface transition-colors"
             aria-label="Home"
             (click)="goHome()">
            <span class="w-7 h-7 rounded-md grid place-items-center text-accent-fg font-bold text-[12px] shrink-0"
                  style="background:linear-gradient(135deg, var(--accent), #5cd8a8); box-shadow:0 0 0 1px rgb(140 240 200/0.30), 0 0 18px rgb(140 240 200/0.25);">
              S
            </span>
            <span class="text-[15px] font-semibold text-fg">specora</span>
            <span class="font-mono font-normal text-fg-3 text-xs">sandbox</span>
          </a>
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

          <!-- INVENTORY inner pane -->
          <div class="innernav-pane absolute inset-0 overflow-y-auto px-3 py-3 flex flex-col gap-0.5"
               [class.innernav-pane-active]="activeMenu() === 'inventory'"
               [class.innernav-pane-leave-left]="leavingMenu() === 'inventory'"
               [attr.aria-hidden]="activeMenu() === 'inventory' ? null : true"
               [attr.inert]="activeMenu() === 'inventory' ? null : ''">
            <button type="button"
                    class="back-link flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-surface text-fg-3 hover:text-fg w-full"
                    (click)="back()">
              <svg lucideArrowLeft class="w-3.5 h-3.5"></svg>
              <span class="text-[12.5px] font-medium">Inventory</span>
            </button>

            <div class="mx-2 my-2 border-t border-line-soft"></div>

            @for (item of inventoryItems; track item.path) {
              <a
                [routerLink]="['/', 'inventory', item.path]"
                routerLinkActive="rail-active"
                class="rail-link group flex items-center gap-2.5 px-2 py-2 rounded-md text-left hover:bg-surface">
                <span class="rail-icon w-7 h-7 rounded-md grid place-items-center shrink-0 bg-surface border border-line-soft text-fg-3">
                  @switch (item.path) {
                    @case ('information')  { <svg lucideFileText class="w-3.5 h-3.5"></svg> }
                    @case ('processes')    { <svg lucideListChecks class="w-3.5 h-3.5"></svg> }
                    @case ('it-assets')    { <svg lucideServer class="w-3.5 h-3.5"></svg> }
                    @case ('physical')     { <svg lucideBuilding2 class="w-3.5 h-3.5"></svg> }
                    @case ('organization') { <svg lucideUsers class="w-3.5 h-3.5"></svg> }
                  }
                </span>
                <span class="flex-1 text-[13px] text-fg-2 group-hover:text-fg rail-label">{{ item.label }}</span>
              </a>
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

            <!-- Continuous Review — sidebar drawer toggle, scoped to Risk -->
            <div class="mx-2 mt-3 mb-1 border-t border-line-soft"></div>
            <button type="button"
                    class="rail-link group flex items-center gap-2.5 px-2 py-2 rounded-md text-left hover:bg-surface w-full"
                    [class.rail-active]="simulatorOpen()"
                    (click)="simulatorOpen.set(!simulatorOpen())">
              <span class="rail-icon w-7 h-7 rounded-md grid place-items-center shrink-0 bg-surface border border-line-soft text-fg-3">
                <svg lucideZap class="w-3.5 h-3.5"></svg>
              </span>
              <span class="flex-1 text-[13px] text-fg-2 group-hover:text-fg rail-label">Continuous review</span>
              @if (store.events().length > 0) {
                <span class="min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-accent-fg font-mono text-[10px] font-bold grid place-items-center">
                  {{ store.events().length }}
                </span>
              }
            </button>
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
      }

      <!-- MAIN -->
      <main class="overflow-hidden h-screen flex flex-col">
        <!-- TOPBAR -->
        <div class="bg-bg-2 border-b border-line-soft flex items-center gap-3 px-6 h-14 shrink-0">

          <!-- Search -->
          <div class="flex-1 flex justify-center min-w-0">
            <button class="w-full max-w-[420px] inline-flex items-center gap-2 h-9 px-3 bg-bg border border-line-soft rounded-md text-fg-3 hover:border-line">
              <svg lucideSearch class="w-4 h-4"></svg>
              <span class="text-[12.5px] flex-1 text-left">Search risks, controls, treatments…</span>
              <span class="font-mono text-[10px] bg-surface border border-line-soft rounded px-1.5 py-0.5 text-fg-4">⌘K</span>
            </button>
          </div>

          <!-- Right cluster -->
          <div class="flex items-center gap-1.5 shrink-0">

            <!-- Tasks -->
            <div class="relative" (click)="$event.stopPropagation()">
              <button type="button"
                      [attr.aria-expanded]="openPopover() === 'tasks'"
                      aria-haspopup="dialog"
                      class="relative inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-fg-2 hover:bg-surface hover:text-fg"
                      [class.bg-surface]="openPopover() === 'tasks'"
                      [class.text-fg]="openPopover() === 'tasks'"
                      (click)="togglePopover('tasks')">
                <svg lucideClipboardList class="w-4 h-4"></svg>
                <span class="text-[12.5px] font-medium">Tasks</span>
                <span class="min-w-[16px] h-[16px] px-1 rounded-full bg-surface border border-line-soft text-fg-3 font-mono text-[10px] font-bold grid place-items-center">
                  {{ tasks.length }}
                </span>
              </button>

              @if (openPopover() === 'tasks') {
                <div class="absolute right-0 top-full mt-2 w-[380px] bg-bg-2 border border-line-soft rounded-lg shadow-lg-soft overflow-hidden z-50"
                     role="dialog" aria-label="Tasks">
                  <div class="flex items-center justify-between px-4 py-3 border-b border-line-soft">
                    <div class="flex items-baseline gap-3">
                      <h3 class="text-[14px] font-semibold text-fg">My tasks</h3>
                      <span class="font-mono text-[10.5px] text-fg-4">{{ tasks.length }} open · 2 due today</span>
                    </div>
                    <button type="button" aria-label="Close" class="w-7 h-7 grid place-items-center rounded text-fg-3 hover:bg-surface hover:text-fg"
                            (click)="closeAllPopovers()">
                      <svg lucideX class="w-3.5 h-3.5"></svg>
                    </button>
                  </div>
                  <div class="flex items-center gap-1.5 px-3 py-2 border-b border-line-soft">
                    <button class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] font-medium bg-accent-dim text-fg">
                      Today <span class="font-mono text-[10px] text-fg-3">2</span>
                    </button>
                    <button class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] font-medium text-fg-3 hover:bg-surface hover:text-fg">
                      This week <span class="font-mono text-[10px] text-fg-4">5</span>
                    </button>
                    <button class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] font-medium text-fg-3 hover:bg-surface hover:text-fg">
                      All
                    </button>
                  </div>
                  <ul class="flex flex-col divide-y divide-line-soft max-h-[360px] overflow-y-auto">
                    @for (t of tasks; track t.title) {
                      <li class="grid grid-cols-[18px_1fr_auto] items-start gap-2.5 px-4 py-2.5 hover:bg-surface">
                        <button type="button" aria-label="Done" class="w-4 h-4 mt-0.5 rounded border-[1.5px] border-line hover:border-accent"></button>
                        <div class="min-w-0">
                          <div class="text-[12.5px] text-fg font-medium leading-snug">{{ t.title }}</div>
                          <div class="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-fg-4">
                            <span [class]="t.source === 'IAM' ? 'text-info' : 'text-accent'">{{ t.source }}</span>
                            <span>·</span>
                            <span [class]="t.dueTone === 'danger' ? 'text-danger' : ''">{{ t.due }}</span>
                          </div>
                        </div>
                        @if (t.priority === 'URGENT') {
                          <span class="inline-flex items-center px-1.5 h-4 rounded text-[9.5px] font-mono font-semibold"
                                style="background:rgb(242 164 164 / 0.14); color:var(--danger);">URGENT</span>
                        } @else if (t.priority === 'HIGH') {
                          <span class="inline-flex items-center px-1.5 h-4 rounded text-[9.5px] font-mono font-semibold"
                                style="background:rgb(240 201 135 / 0.14); color:var(--warn);">HIGH</span>
                        } @else if (t.priority === 'MED') {
                          <span class="inline-flex items-center px-1.5 h-4 rounded text-[9.5px] font-mono font-semibold border border-line-soft text-fg-3 bg-surface">MED</span>
                        }
                      </li>
                    }
                  </ul>
                  <div class="px-4 py-2.5 border-t border-line-soft flex items-center justify-between">
                    <button class="text-[11.5px] text-fg-3 hover:text-fg">View all {{ tasks.length }} tasks →</button>
                    <button class="inline-flex items-center gap-1 h-6 px-2 rounded text-[11px] text-fg-3 hover:bg-surface hover:text-fg">
                      <svg lucidePlus class="w-3 h-3"></svg>New
                    </button>
                  </div>
                </div>
              }
            </div>

            <!-- Notifications -->
            <div class="relative" (click)="$event.stopPropagation()">
              <button type="button"
                      [attr.aria-expanded]="openPopover() === 'notifications'"
                      aria-haspopup="dialog"
                      aria-label="Notifications"
                      class="relative inline-flex items-center gap-1.5 h-9 px-2.5 rounded-md text-fg-2 hover:bg-surface hover:text-fg"
                      [class.bg-surface]="openPopover() === 'notifications'"
                      [class.text-fg]="openPopover() === 'notifications'"
                      (click)="togglePopover('notifications')">
                <svg lucideBell class="w-4 h-4"></svg>
                <span class="text-[12.5px] font-medium">Notifications</span>
                <span class="min-w-[16px] h-[16px] px-1 rounded-full bg-accent text-accent-fg font-mono text-[10px] font-bold grid place-items-center">
                  {{ notifUnread() }}
                </span>
              </button>

              @if (openPopover() === 'notifications') {
                <div class="absolute right-0 top-full mt-2 w-[360px] bg-bg-2 border border-line-soft rounded-lg shadow-lg-soft overflow-hidden z-50"
                     role="dialog" aria-label="Notifications">
                  <div class="flex items-center justify-between px-4 py-3 border-b border-line-soft">
                    <div class="flex items-baseline gap-3">
                      <h3 class="text-[14px] font-semibold text-fg">Inbox</h3>
                      <span class="font-mono text-[10.5px] text-fg-4">{{ notifTotal() }} · {{ notifUnread() }} unread</span>
                    </div>
                    <button type="button" aria-label="Close" class="w-7 h-7 grid place-items-center rounded text-fg-3 hover:bg-surface hover:text-fg"
                            (click)="closeAllPopovers()">
                      <svg lucideX class="w-3.5 h-3.5"></svg>
                    </button>
                  </div>
                  <div class="flex items-center gap-1.5 px-3 py-2 border-b border-line-soft">
                    <button class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] font-medium bg-accent-dim text-fg">
                      All <span class="font-mono text-[10px] text-fg-3">{{ notifTotal() }}</span>
                    </button>
                    <button class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] font-medium text-fg-3 hover:bg-surface hover:text-fg">
                      Unread <span class="font-mono text-[10px] text-fg-4">{{ notifUnread() }}</span>
                    </button>
                    <button class="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] font-medium text-fg-3 hover:bg-surface hover:text-fg">
                      Mentions <span class="font-mono text-[10px] text-fg-4">1</span>
                    </button>
                    <button class="ml-auto font-mono text-[10.5px] text-fg-3 hover:text-fg px-2 py-1 rounded hover:bg-surface">Mark all read</button>
                  </div>
                  <div class="max-h-[360px] overflow-y-auto px-2 py-1">
                    <div class="px-2.5 pt-2 pb-1.5 font-mono text-[9.5px] tracking-[0.12em] text-fg-4">TODAY</div>
                    @for (n of notifications.today; track n.title) {
                      <div class="w-full flex flex-col items-stretch text-left px-2.5 py-2.5 rounded-md hover:bg-surface relative">
                        @if (n.unread) {
                          <span class="absolute left-0 top-3 w-1 h-1 rounded-full bg-accent"></span>
                        }
                        <div class="flex items-baseline justify-between gap-3">
                          <div class="text-[12.5px] text-fg truncate font-medium">{{ n.title }}</div>
                          <span class="font-mono text-[10px] text-fg-4 shrink-0">{{ n.time }}</span>
                        </div>
                        <div class="text-[11.5px] text-fg-2 leading-snug mt-0.5 truncate">{{ n.meta }}</div>
                        @if (n.actions) {
                          <div class="flex items-center gap-1.5 mt-2">
                            <button class="h-7 px-2.5 rounded bg-accent text-accent-fg text-[11px] font-medium">Approve</button>
                            <button class="h-7 px-2.5 rounded text-fg-2 hover:bg-surface-hi text-[11px] font-medium">Review</button>
                          </div>
                        }
                      </div>
                    }
                    <div class="px-2.5 pt-3 pb-1.5 font-mono text-[9.5px] tracking-[0.12em] text-fg-4">YESTERDAY</div>
                    @for (n of notifications.yesterday; track n.title) {
                      <div class="w-full flex flex-col items-stretch text-left px-2.5 py-2.5 rounded-md hover:bg-surface">
                        <div class="flex items-baseline justify-between gap-3">
                          <div class="text-[12.5px] text-fg truncate font-medium">{{ n.title }}</div>
                          <span class="font-mono text-[10px] text-fg-4 shrink-0">{{ n.time }}</span>
                        </div>
                        <div class="text-[11.5px] text-fg-2 leading-snug mt-0.5 truncate">{{ n.meta }}</div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- App launcher (waffle) -->
            <div class="relative" (click)="$event.stopPropagation()">
              <button type="button"
                      aria-label="Apps"
                      [attr.aria-expanded]="openPopover() === 'launcher'"
                      aria-haspopup="dialog"
                      class="w-9 h-9 grid place-items-center rounded-md text-fg-3 hover:bg-surface hover:text-fg"
                      [class.bg-surface]="openPopover() === 'launcher'"
                      [class.text-fg]="openPopover() === 'launcher'"
                      (click)="togglePopover('launcher')">
                <svg lucideGrid3X3 class="w-4 h-4"></svg>
              </button>

              @if (openPopover() === 'launcher') {
                <div class="launch-panel absolute right-0 top-full mt-2 z-50" role="dialog" aria-label="App launcher">
                  <div class="flex items-center justify-between px-4 py-3 border-b border-line-soft">
                    <div class="flex items-baseline gap-2.5">
                      <h3 class="text-[13.5px] font-semibold text-fg">Switch app</h3>
                      <span class="font-mono text-[10px] tracking-[0.12em] text-fg-4">
                        {{ appTiles.length }} APPS · {{ activeAppKey() ? '1 ACTIVE' : '0 ACTIVE' }}
                      </span>
                    </div>
                    <button type="button" aria-label="Close"
                            class="w-6 h-6 grid place-items-center rounded text-fg-3 hover:bg-surface hover:text-fg"
                            (click)="closeAllPopovers()">
                      <svg lucideX class="w-3 h-3"></svg>
                    </button>
                  </div>

                  <div class="px-3 pt-3">
                    <div class="px-1 pb-1.5 font-mono text-[9.5px] tracking-[0.12em] text-fg-4">PINNED</div>
                  </div>
                  <div class="px-3 pb-2 grid grid-cols-3 gap-2">
                    @for (tile of appTiles; track tile.key) {
                      @if (tile.pinned) {
                        <button type="button" class="app-tile"
                                [attr.data-active]="isAppActive(tile) ? '1' : null"
                                (click)="openApp(tile)">
                          <span class="app-tile-ico">
                            @switch (tile.key) {
                              @case ('isms')       { <svg lucideShieldCheck class="w-4 h-4"></svg> }
                              @case ('risk')       { <svg lucideShieldAlert class="w-4 h-4"></svg> }
                              @case ('gap')        { <svg lucideBarChart3 class="w-4 h-4"></svg> }
                              @case ('monitoring') { <svg lucideEye class="w-4 h-4"></svg> }
                            }
                          </span>
                          <span>
                            <span class="app-tile-name block">{{ tile.label }}</span>
                            <span class="app-tile-meta block mt-0.5">{{ tile.desc }}</span>
                          </span>
                        </button>
                      }
                    }
                  </div>

                  <div class="px-3 pt-2">
                    <div class="px-1 pb-1.5 font-mono text-[9.5px] tracking-[0.12em] text-fg-4">ALL APPS</div>
                  </div>
                  <div class="px-3 pb-3 grid grid-cols-3 gap-2">
                    @for (tile of appTiles; track tile.key) {
                      @if (!tile.pinned) {
                        <button type="button" class="app-tile"
                                [attr.data-active]="isAppActive(tile) ? '1' : null"
                                (click)="openApp(tile)">
                          <span class="app-tile-ico">
                            @switch (tile.key) {
                              @case ('inventory') { <svg lucidePackage class="w-4 h-4"></svg> }
                              @case ('assets')    { <svg lucideMonitor class="w-4 h-4"></svg> }
                              @case ('catalogs')  { <svg lucideListChecks class="w-4 h-4"></svg> }
                              @case ('documents') { <svg lucideFileText class="w-4 h-4"></svg> }
                              @case ('policies')  { <svg lucideBookOpen class="w-4 h-4"></svg> }
                              @case ('workflows') { <svg lucideWorkflow class="w-4 h-4"></svg> }
                              @case ('iam')       { <svg lucideLock class="w-4 h-4"></svg> }
                              @case ('users')     { <svg lucideUsers class="w-4 h-4"></svg> }
                              @case ('incidents') { <svg lucideAlertTriangle class="w-4 h-4"></svg> }
                            }
                          </span>
                          <span>
                            <span class="app-tile-name block">{{ tile.label }}</span>
                            <span class="app-tile-meta block mt-0.5">{{ tile.desc }}</span>
                          </span>
                        </button>
                      }
                    }
                  </div>
                </div>
              }
            </div>

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

      /* App launcher */
      .launch-panel {
        background: var(--bg-2);
        border: 1px solid var(--line-soft);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 14px 40px -18px rgba(0,0,0,0.55), 0 1px 0 var(--line-soft);
        width: 408px;
      }
      .app-tile {
        position: relative;
        display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem;
        padding: 0.75rem 0.75rem 0.625rem;
        background: var(--surface);
        border: 1px solid var(--line-soft);
        border-radius: 9px;
        text-align: left;
        cursor: pointer;
        min-height: 94px;
        transition: background-color 140ms ease, border-color 140ms ease, transform 140ms ease;
      }
      .app-tile:hover {
        background: var(--surface-hi);
        border-color: var(--line);
        transform: translateY(-1px);
      }
      .app-tile[data-active="1"] {
        background: color-mix(in oklab, var(--accent) 10%, var(--surface));
        border-color: color-mix(in oklab, var(--accent) 40%, var(--line-soft));
      }
      .app-tile[data-active="1"]::after {
        content: "";
        position: absolute; top: 9px; right: 9px;
        width: 6px; height: 6px;
        background: var(--accent);
        border-radius: 999px;
        box-shadow: 0 0 0 2px var(--surface);
      }
      .app-tile-ico {
        width: 28px; height: 28px;
        display: inline-grid; place-items: center;
        background: var(--bg);
        border: 1px solid var(--line-soft);
        border-radius: 7px;
        color: var(--fg-2);
      }
      .app-tile[data-active="1"] .app-tile-ico {
        background: color-mix(in oklab, var(--accent) 18%, transparent);
        border-color: color-mix(in oklab, var(--accent) 35%, transparent);
        color: var(--accent);
      }
      .app-tile-name { font-size: 12.5px; font-weight: 600; color: var(--fg); line-height: 1.2; }
      .app-tile-meta { font-size: 10.5px; color: var(--fg-3); line-height: 1.35; }
    `,
  ],
  host: {
    '(document:click)': 'closeAllPopovers()',
  },
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
    { key: 'inventory',  label: 'Inventory',  hasChildren: true },
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

  readonly inventoryItems: { path: string; label: string }[] = [
    { path: 'information',  label: 'Information assets' },
    { path: 'processes',    label: 'Processes' },
    { path: 'it-assets',    label: 'IT assets' },
    { path: 'physical',     label: 'Physical' },
    { path: 'organization', label: 'Organization' },
  ];

  // -------- Popover state (App launcher · Tasks · Notifications) --------
  readonly openPopover = signal<'launcher' | 'tasks' | 'notifications' | null>(null);

  togglePopover(key: 'launcher' | 'tasks' | 'notifications') {
    this.openPopover.update((curr) => (curr === key ? null : key));
  }
  closeAllPopovers() {
    this.openPopover.set(null);
  }

  // -------- App launcher tile catalog --------
  readonly appTiles: { key: string; label: string; desc: string; route?: string; pinned: boolean }[] = [
    { key: 'isms',       label: 'ISMS',       desc: 'Management system',          route: '/register',   pinned: true  },
    { key: 'risk',       label: 'Risk',       desc: 'Identify & treat risks',     route: '/register',   pinned: true  },
    { key: 'gap',        label: 'GAP',        desc: 'Map to standards',           route: '/gap',        pinned: true  },
    { key: 'monitoring', label: 'Monitoring', desc: 'Live control signals',       route: '/monitoring', pinned: true  },
    { key: 'inventory',  label: 'Inventory',  desc: 'Scope & entities',           route: '/inventory',  pinned: false },
    { key: 'assets',     label: 'Assets',     desc: 'Devices & services',                                pinned: false },
    { key: 'catalogs',   label: 'Catalogs',   desc: 'Reusable taxonomies',                               pinned: false },
    { key: 'documents',  label: 'Documents',  desc: 'Drafts & evidence',                                 pinned: false },
    { key: 'policies',   label: 'Policies',   desc: 'Approved & in force',                               pinned: false },
    { key: 'workflows',  label: 'Workflows',  desc: 'Sequential procedures',                             pinned: false },
    { key: 'iam',        label: 'IAM',        desc: 'Access governance',                                 pinned: false },
    { key: 'users',      label: 'Users',      desc: 'Directory & invites',                               pinned: false },
    { key: 'incidents',  label: 'Incidents',  desc: 'Detect & resolve',                                  pinned: false },
  ];

  readonly activeAppKey = computed(() => {
    const url = this.currentUrl();
    if (isRiskUrl(url)) return 'risk';
    if (isInventoryUrl(url)) return 'inventory';
    if (url.startsWith('/gap')) return 'gap';
    if (url.startsWith('/monitoring')) return 'monitoring';
    return null;
  });

  readonly currentUrl = signal(this.router.url);
  readonly isHome = computed(() => {
    const u = this.currentUrl().split('?')[0].split('#')[0];
    return u === '/' || u === '';
  });

  isAppActive(tile: { key: string; route?: string }): boolean {
    return this.activeAppKey() === tile.key;
  }

  openApp(tile: { route?: string }) {
    this.closeAllPopovers();
    if (tile.route) this.router.navigateByUrl(tile.route);
  }

  // -------- Tasks & notifications mock data --------
  readonly tasks: { title: string; source: string; due: string; dueTone: 'danger' | ''; priority?: 'URGENT' | 'HIGH' | 'MED' }[] = [
    { title: 'Review backup encryption policy v2.1',                source: 'ISMS', due: 'Today · 17:00', dueTone: 'danger', priority: 'URGENT' },
    { title: 'Approve access — Ana Petrović → ProdDB',              source: 'IAM',  due: 'Tomorrow',      dueTone: '',       priority: 'HIGH' },
    { title: 'Upload Q1 internal audit evidence',                   source: 'DOCS', due: 'May 24',        dueTone: '',       priority: 'MED' },
    { title: 'Close gap GA-014 — asset inventory completeness',     source: 'ISMS', due: 'No due date',   dueTone: '' },
  ];

  readonly notifications = {
    today: [
      { title: 'Approval request', meta: 'Ana Petrović requested approval on Remote work policy v2.1', time: '2h ago', unread: true, actions: true },
      { title: 'Mentioned by Lana D.', meta: '"@Marko can you confirm the encryption scope for DB-prod-01?"', time: '3h ago', unread: true, actions: false },
      { title: 'Deadline tomorrow', meta: 'Q1 internal audit evidence upload due at 17:00.', time: '5h ago', unread: false, actions: false },
    ],
    yesterday: [
      { title: 'Status changed · Mitigated', meta: 'Risk R-2024-038 moved Open → Mitigated.', time: '1d', unread: false, actions: false },
    ],
  };

  notifTotal(): number {
    return this.notifications.today.length + this.notifications.yesterday.length;
  }
  notifUnread(): number {
    return (
      this.notifications.today.filter((n) => n.unread).length +
      this.notifications.yesterday.filter((n) => n.unread).length
    );
  }

  constructor() {
    // Track page title (used in topbar)
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        const route = this.findDeepest(this.route);
        this.currentTitle.set((route.snapshot.data['title'] as string) ?? 'Risk Workflow');
        this.currentUrl.set(this.router.url);
      });

    // Snap the rail to the matching menu state on the first resolved navigation.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        take(1),
      )
      .subscribe(() => {
        if (isRiskUrl(this.router.url)) this.activeMenu.set('risk');
        else if (isInventoryUrl(this.router.url)) this.activeMenu.set('inventory');
      });
  }

  isGlobalActive(item: GlobalItem): boolean {
    const url = this.router.url;
    if (item.key === 'risk') return isRiskUrl(url);
    if (item.key === 'inventory') return isInventoryUrl(url);
    return item.route ? url.startsWith('/' + item.route) : false;
  }

  onGlobalClick(item: GlobalItem) {
    if (item.hasChildren) {
      this.swapMenu(item.key);
      if (item.key === 'risk' && !isRiskUrl(this.router.url)) {
        this.router.navigate(['/register']);
      } else if (item.key === 'inventory' && !isInventoryUrl(this.router.url)) {
        this.router.navigate(['/inventory']);
      }
      return;
    }
    if (item.route) this.router.navigate(['/', item.route]);
  }

  back() {
    this.swapMenu('global');
  }

  goHome() {
    this.swapMenu('global');
    this.closeAllPopovers();
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
