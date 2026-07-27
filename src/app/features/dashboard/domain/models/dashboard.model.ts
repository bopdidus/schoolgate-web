import { Payment } from '../../../payments/domain/models/payment.model';
import { UserRole } from '../../../../shared/models/common.model';

export interface DashboardStats {
  pendingValidations: number;
  validatedPayments: number;
  seatsFilledPercent: number;
  totalSchools?: number;
  totalEnrollments?: number;
  totalRevenue?: number;
  refundsTriggered?: number;
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

export interface PaymentStatusDistribution {
  status: string;
  count: number;
}

export interface SchoolRanking {
  schoolName: string;
  fillRate: number;
  enrollments: number;
}

export interface LastRegisteredSchool {
  id: string;
  name: string;
  city: string;
  createdAt: string;
}

export interface ApproachingDeadlinePayment {
  id: string;
  studentName: string;
  amount: number;
  deadline: string;
  hoursRemaining: number;
}

/** Role-scoped payload from GET /dashboard/overview (backend may omit unused sections). */
export interface DashboardOverview {
  role: UserRole;
  stats: DashboardStats;
  lastRegisteredSchool?: LastRegisteredSchool;
  classPaymentStats?: ClassPaymentStats[];
  recentPayments?: Payment[];
  enrollmentTrend?: EnrollmentTrend[];
  paymentStatusDistribution?: PaymentStatusDistribution[];
  schoolRanking?: SchoolRanking[];
  approachingDeadlinePayments?: ApproachingDeadlinePayment[];
}
