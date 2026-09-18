import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/auth.guard';
import { abilityGuard } from '../core/guards/ability.guard';
import { unsavedChangesGuard } from '../core/guards/unsaved-changes.guard';

export const SCHOOL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./school-list/school-list.component').then(
        (m) => m.SchoolListComponent,
      ),
    canActivate: [roleGuard(['admin'])],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./school-form/school-form.component').then(
        (m) => m.SchoolFormComponent,
      ),
    canActivate: [abilityGuard('create', 'School')],
    canDeactivate: [unsavedChangesGuard],
  },
  // The `:id` routes below check the ability *against that school*, so staff
  // cannot open a school they do not administer — the role alone is not enough.
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./school-form/school-form.component').then(
        (m) => m.SchoolFormComponent,
      ),
    canActivate: [abilityGuard('update', 'School')],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/classes/new',
    loadComponent: () =>
      import('./class-form/class-form.component').then(
        (m) => m.ClassFormComponent,
      ),
    canActivate: [abilityGuard('create', 'SchoolClass')],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/classes/:classId/edit',
    loadComponent: () =>
      import('./class-form/class-form.component').then(
        (m) => m.ClassFormComponent,
      ),
    canActivate: [abilityGuard('update', 'SchoolClass')],
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./school-detail/school-detail.component').then(
        (m) => m.SchoolDetailComponent,
      ),
    canActivate: [abilityGuard('read', 'School')],
  },
];
