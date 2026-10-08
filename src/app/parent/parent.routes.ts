import { Routes } from '@angular/router';

/**
 * Parent space: every feature of the mobile app (find a school, request a
 * place, follow requests and students, pay, notifications, profile, support).
 * Guarded by `roleGuard(['parent'])` in `app.routes.ts`.
 */
export const PARENT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'schools' },
];
