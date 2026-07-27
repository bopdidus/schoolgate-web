import { Routes } from '@angular/router';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/payment-list-page/payment-list-page.component').then(
        (m) => m.PaymentListPageComponent,
      ),
  },
];
