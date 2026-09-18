import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/auth.guard';

export const INVOICE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./invoice-list/invoice-list.component').then(
        (m) => m.InvoiceListComponent,
      ),
    canActivate: [roleGuard(['admin', 'school_admin', 'school_editor'])],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./invoice-detail/invoice-detail.component').then(
        (m) => m.InvoiceDetailComponent,
      ),
    canActivate: [roleGuard(['admin', 'school_admin', 'school_editor'])],
  },
];
