import { Routes } from '@angular/router';
import { roleGuard } from '../core/guards/auth.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./settings.component').then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [roleGuard(['admin', 'school_admin', 'school_editor'])],
  },
];
