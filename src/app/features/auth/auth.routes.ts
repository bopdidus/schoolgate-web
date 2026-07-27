import { Routes } from '@angular/router';
import { guestGuard } from '../../core/auth/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
    canActivate: [guestGuard],
  },
];
