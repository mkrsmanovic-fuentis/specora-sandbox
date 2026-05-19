import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'register' },

  // Risk inner workflow
  {
    path: 'criteria',
    loadComponent: () =>
      import('./views/criteria.component').then((m) => m.CriteriaView),
    data: { title: 'Risk Criteria', group: 'risk' },
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./views/register.component').then((m) => m.RegisterView),
    data: { title: 'Risk Register', group: 'risk' },
  },
  {
    path: 'treatment',
    loadComponent: () =>
      import('./views/treatment.component').then((m) => m.TreatmentView),
    data: { title: 'Risk Treatment Plan', group: 'risk' },
  },
  {
    path: 'soa',
    loadComponent: () =>
      import('./views/soa.component').then((m) => m.SoaView),
    data: { title: 'Statement of Applicability', group: 'risk' },
  },

  // Other top-level workspaces (placeholders)
  {
    path: 'inventory',
    loadComponent: () =>
      import('./views/placeholder.component').then((m) => m.PlaceholderView),
    data: { title: 'Inventory', group: 'inventory' },
  },
  {
    path: 'gap',
    loadComponent: () =>
      import('./views/placeholder.component').then((m) => m.PlaceholderView),
    data: { title: 'Gap Analysis', group: 'gap' },
  },
  {
    path: 'monitoring',
    loadComponent: () =>
      import('./views/placeholder.component').then((m) => m.PlaceholderView),
    data: { title: 'Monitoring', group: 'monitoring' },
  },

  { path: '**', redirectTo: 'register' },
];
