import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/auth.guard';

export const PASSWORD_RESET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./password-reset-list/password-reset-list.component').then(
        (m) => m.PasswordResetListComponent,
      ),
    // Reset requests are only ever addressed to platform admins.
    canActivate: [roleGuard(['admin'])],
  },
];
