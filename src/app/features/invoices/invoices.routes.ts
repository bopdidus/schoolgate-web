import { Routes } from '@angular/router';

export const INVOICE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/invoice-pages.component').then(
        (m) => m.InvoiceListPageComponent,
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./presentation/pages/invoice-pages.component').then(
        (m) => m.InvoiceDetailPageComponent,
      ),
  },
];
