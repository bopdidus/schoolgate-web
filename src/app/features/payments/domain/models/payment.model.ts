import { EducationType, PaymentStatus, PaymentType } from '../../../../shared/models/common.model';

export interface Payment {
  id: string;
  enrollmentId: string;
  type: PaymentType;
  installmentNumber?: number;
  amount: number;
  declaredAt: string;
  deadline: string;
  status: PaymentStatus;
  schoolId: string;
  schoolName: string;
  studentName: string;
  classEducationType: EducationType;
  classSpecialtyId?: string;
  classSpecialtyLabel?: string;
  rejectionReason?: string;
  validatedAt?: string;
  validatedBy?: string;
  payerMsisdn?: string;
  externalReference?: string;
}

export interface PaymentFilters {
  schoolId?: string;
  status?: PaymentStatus | '';
  educationType?: EducationType | '';
  specialtyId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ValidatePaymentRequest {
  payment_ids: string[];
}

export interface RejectPaymentRequest {
  payment_ids: string[];
  reason?: string;
}

/** Admin view: commission fees aggregated per school (from validated payments). */
export interface SchoolCommissionSummary {
  schoolId: string;
  schoolName: string;
  city: string;
  commissionCount: number;
  totalCommissionAmount: number;
}
