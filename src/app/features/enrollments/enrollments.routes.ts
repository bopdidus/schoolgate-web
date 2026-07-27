import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/auth.guard';

export const ENROLLMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['school_admin', 'school_editor'])],
    loadComponent: () =>
      import('./presentation/pages/enrollment-list-page/enrollment-list-page.component').then(
        (m) => m.EnrollmentListPageComponent,
      ),
  },
];
