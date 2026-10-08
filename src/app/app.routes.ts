import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';
import { STAFF_ROLES } from './core/auth/home-route';

export const routes: Routes = [
  // Public home page: what SchoolGate is, with the way in (login / sign-up).
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./layout/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    canActivate: [guestGuard],
    children: [
      {
        // Parent account (as on the mobile app) or school.
        path: '',
        loadComponent: () =>
          import('./register/register-choice/register-choice.component').then(
            (m) => m.RegisterChoiceComponent,
          ),
      },
      {
        path: 'parent',
        loadComponent: () =>
          import('./register/parent-register/parent-register.component').then(
            (m) => m.ParentRegisterComponent,
          ),
      },
      {
        path: 'school',
        loadComponent: () =>
          import('./register/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
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
      {
        path: 'dashboard',
        canActivate: [roleGuard(STAFF_ROLES)],
        loadChildren: () =>
          import('./dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'schools',
        canActivate: [roleGuard(STAFF_ROLES)],
        loadChildren: () =>
          import('./schools/schools.routes').then((m) => m.SCHOOL_ROUTES),
      },
      {
        path: 'enrollments',
        canActivate: [roleGuard(STAFF_ROLES)],
        loadChildren: () =>
          import('./enrollments/enrollments.routes').then((m) => m.ENROLLMENT_ROUTES),
      },
      {
        path: 'payments',
        canActivate: [roleGuard(STAFF_ROLES)],
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
        canActivate: [roleGuard(STAFF_ROLES)],
        loadChildren: () => import('./users/users.routes').then((m) => m.USER_ROUTES),
      },
      {
        path: 'password-resets',
        canActivate: [roleGuard(STAFF_ROLES)],
        loadChildren: () =>
          import('./password-resets/password-resets.routes').then((m) => m.PASSWORD_RESET_ROUTES),
      },
      {
        path: 'settings',
        canActivate: [roleGuard(STAFF_ROLES)],
        loadChildren: () =>
          import('./settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        // Parent space: the mobile app's features on the web.
        path: 'parent',
        canActivate: [roleGuard(['parent'])],
        loadChildren: () => import('./parent/parent.routes').then((m) => m.PARENT_ROUTES),
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
