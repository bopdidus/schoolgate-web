import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    loadChildren: () => import('./login/login.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent,
      ),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'schools',
        loadChildren: () =>
          import('./schools/schools.routes').then((m) => m.SCHOOL_ROUTES),
      },
      {
        path: 'enrollments',
        loadChildren: () =>
          import('./enrollments/enrollments.routes').then((m) => m.ENROLLMENT_ROUTES),
      },
      {
        path: 'payments',
        loadChildren: () =>
          import('./payments/payments.routes').then((m) => m.PAYMENT_ROUTES),
      },
      {
        path: 'invoices',
        loadChildren: () =>
          import('./invoices/invoices.routes').then((m) => m.INVOICE_ROUTES),
      },
      {
        path: 'users',
        loadChildren: () => import('./users/users.routes').then((m) => m.USER_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () =>
          import('./settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      // Rendered inside the shell so a mistyped URL keeps its navigation instead
      // of being silently redirected to the dashboard.
      {
        path: '**',
        loadComponent: () =>
          import('./not-found/not-found.component').then(
            (m) => m.NotFoundComponent,
          ),
      },
    ],
  },
];
