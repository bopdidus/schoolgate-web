import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/auth.guard';

export const ENROLLMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['admin', 'school_admin', 'school_editor'])],
    loadComponent: () =>
      import('./enrollment-list/enrollment-list.component').then(
        (m) => m.EnrollmentListComponent,
      ),
  },
];
