import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./finance-dashboard/finance-dashboard.component').then((m) => m.FinanceDashboardComponent),
  },
  {
    path: 'arrears',
    loadComponent: () => import('./arrears-report/arrears-report.component').then((m) => m.ArrearsReportComponent),
  },
];
