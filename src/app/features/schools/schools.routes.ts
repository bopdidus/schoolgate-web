import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/auth.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const SCHOOL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/school-list-page/school-list-page.component').then(
        (m) => m.SchoolListPageComponent,
      ),
    canActivate: [roleGuard(['admin'])],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./presentation/pages/school-form-page/school-form-page.component').then(
        (m) => m.SchoolFormPageComponent,
      ),
    canActivate: [roleGuard(['admin'])],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./presentation/pages/school-form-page/school-form-page.component').then(
        (m) => m.SchoolFormPageComponent,
      ),
    canActivate: [roleGuard(['admin', 'school_admin'])],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/classes/new',
    loadComponent: () =>
      import('./presentation/pages/class-form-page/class-form-page.component').then(
        (m) => m.ClassFormPageComponent,
      ),
    canActivate: [roleGuard(['admin', 'school_admin'])],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/classes/:classId/edit',
    loadComponent: () =>
      import('./presentation/pages/class-form-page/class-form-page.component').then(
        (m) => m.ClassFormPageComponent,
      ),
    canActivate: [roleGuard(['admin', 'school_admin'])],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./presentation/pages/school-detail-page/school-detail-page.component').then(
        (m) => m.SchoolDetailPageComponent,
      ),
    canActivate: [roleGuard(['admin', 'school_admin', 'school_editor'])],
  },
];
