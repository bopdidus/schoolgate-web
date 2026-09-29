import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/auth.guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./user-list/user-list.component').then(
        (m) => m.UserListComponent,
      ),
    canActivate: [roleGuard(['admin'])],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./user-detail/user-detail.component').then((m) => m.UserDetailComponent),
    canActivate: [roleGuard(['admin'])],
  },
];
