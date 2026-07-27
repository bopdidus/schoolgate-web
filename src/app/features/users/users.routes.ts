import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/guards/auth.guard';

export const USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presentation/pages/user-list-page/user-list-page.component').then(
        (m) => m.UserListPageComponent,
      ),
    canActivate: [roleGuard(['admin'])],
  },
];
