import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/auth.guard';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['admin', 'school_admin', 'school_editor'])],
    loadComponent: () =>
      import('./payment-list/payment-list.component').then(
        (m) => m.PaymentListComponent,
      ),
  },
];
