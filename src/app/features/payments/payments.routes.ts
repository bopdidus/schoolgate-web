import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/auth.guard';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['admin', 'school_admin', 'school_editor'])],
    loadComponent: () =>
      import('./presentation/pages/payment-list-page/payment-list-page.component').then(
        (m) => m.PaymentListPageComponent,
      ),
  },
];
