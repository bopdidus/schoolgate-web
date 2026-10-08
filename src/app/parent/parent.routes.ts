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
    path: 'enroll/:schoolId',
    loadComponent: () => import('./enroll/enroll.component').then((m) => m.EnrollComponent),
  },
];
