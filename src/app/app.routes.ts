import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./views/home.component').then((m) => m.HomeView),
    data: { title: 'Home', group: 'home' },
  },

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

  // Inventory inner workflow
  { path: 'inventory', pathMatch: 'full', redirectTo: 'inventory/information' },
  {
    path: 'inventory/information',
    loadComponent: () =>
      import('./views/inventory-information.component').then((m) => m.InventoryInformationView),
    data: { title: 'Information assets', group: 'inventory' },
  },
  {
    path: 'inventory/information/:id',
    loadComponent: () =>
      import('./views/asset-detail.component').then((m) => m.AssetDetailView),
    data: { title: 'Asset detail', group: 'inventory' },
  },
  {
    path: 'inventory/processes',
    loadComponent: () =>
      import('./views/placeholder.component').then((m) => m.PlaceholderView),
    data: { title: 'Processes', group: 'inventory' },
  },
  {
    path: 'inventory/it-assets',
    loadComponent: () =>
      import('./views/placeholder.component').then((m) => m.PlaceholderView),
    data: { title: 'IT assets', group: 'inventory' },
  },
  {
    path: 'inventory/physical',
    loadComponent: () =>
      import('./views/placeholder.component').then((m) => m.PlaceholderView),
    data: { title: 'Physical assets', group: 'inventory' },
  },
  {
    path: 'inventory/organization',
    loadComponent: () =>
      import('./views/placeholder.component').then((m) => m.PlaceholderView),
    data: { title: 'Organization', group: 'inventory' },
  },

  // Documents (DMS) — self-contained app shell
  {
    path: 'documents',
    loadComponent: () =>
      import('./dms/dms.component').then((m) => m.DmsView),
    data: { title: 'Documents', group: 'documents' },
  },

  // Other top-level workspaces (placeholders)
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

  { path: '**', redirectTo: '' },
];
