import { Routes } from '@angular/router';

/**
 * Parent space: every feature of the mobile app (find a school, request a
 * place, follow requests and students, pay, notifications, profile, support).
 * Guarded by `roleGuard(['parent'])` in `app.routes.ts`. Route and query
 * params bind to component inputs (`withComponentInputBinding`).
 */
export const PARENT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'schools' },
  {
    path: 'schools',
    loadComponent: () => import('./schools/school-search.component').then((m) => m.SchoolSearchComponent),
  },
  {
    path: 'schools/:id',
    loadComponent: () => import('./schools/school-detail.component').then((m) => m.SchoolDetailComponent),
  },
  {
    path: 'requests',
    loadComponent: () => import('./requests/requests.component').then((m) => m.RequestsComponent),
  },
  {
    path: 'students',
    loadComponent: () => import('./students/students.component').then((m) => m.StudentsComponent),
  },
  {
    path: 'enrollments/:id',
    loadComponent: () =>
      import('./enrollment-detail/enrollment-detail.component').then((m) => m.EnrollmentDetailComponent),
  },
  {
    path: 'enrollments/:id/pay',
    loadComponent: () => import('./pay/pay.component').then((m) => m.PayComponent),
  },
  {
    path: 'confirmation/:id',
    loadComponent: () => import('./confirmation/confirmation.component').then((m) => m.ConfirmationComponent),
  },
  {
    path: 'tuition',
    loadComponent: () => import('./tuition/tuition-lookup.component').then((m) => m.TuitionLookupComponent),
  },
  {
    path: 'enroll/:schoolId',
    loadComponent: () => import('./enroll/enroll.component').then((m) => m.EnrollComponent),
  },
  {
    path: 'notifications',
    loadComponent: () => import('./notifications/notifications.component').then((m) => m.NotificationsComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'support',
    loadComponent: () => import('./support/support.component').then((m) => m.SupportComponent),
  },
];
