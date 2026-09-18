import { Routes } from '@angular/router';
import { guestGuard } from '../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./login.component').then(
        (m) => m.LoginComponent,
      ),
    canActivate: [guestGuard],
  },
];
