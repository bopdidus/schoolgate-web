import { UserRole } from '../shared/models/common.model';

export interface DashboardStats {
  pendingValidations: number;
  validatedPayments: number;
  seatsFilledPercent: number;
}

export interface ClassPaymentStats {
  className: string;
  validated: number;
  pending: number;
}

export interface EnrollmentTrend {
  date: string;
  count: number;
}

/** Lightweight row for the dashboard's own "recent payments" widget — not
 * the full Payment entity (no enrollment/school/deadline context, which the
 * widget doesn't render). */
export interface DashboardRecentPayment {
  id: string;
  studentName: string;
  amount: number;
  status: string;
  declaredAt: string;
}

/**
 * Role-scoped payload from `GET /dashboard/overview` — same shape for admin
 * (platform-wide) and school staff (own school only); the backend picks the
 * scope from the actor's role, so the frontend never branches on it here.
 */
export interface DashboardOverview {
  role: UserRole;
  stats: DashboardStats;
  classPaymentStats?: ClassPaymentStats[];
  recentPayments?: DashboardRecentPayment[];
  enrollmentTrend?: EnrollmentTrend[];
}
