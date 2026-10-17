import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/auth.guard';

export const PAYMENT_REVIEW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./payment-review-list/payment-review-list.component').then((m) => m.PaymentReviewListComponent),
    // Only a platform admin decides where parents' money may go.
    canActivate: [roleGuard(['admin'])],
  },
];
