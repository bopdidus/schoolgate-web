import { EducationType, PaymentStatus, PaymentType } from '../shared/models/common.model';

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
  method: PaymentMethod;
  /** Paid by hand to the school (USSD); its staff confirm or reject it. */
  manual: boolean;
  /** Operator transaction reference (typed by the parent for a manual payment). */
  mobileMoneyReference: string;
}

export type PaymentMethod = 'orange' | 'mtn' | 'paypal';

export interface PaymentFilters {
  schoolId?: string;
  enrollmentId?: string;
  status?: PaymentStatus | '';
  /** true: manual payments only (paid by hand, confirmed by the school). */
  manual?: boolean;
  educationType?: EducationType | '';
  specialtyId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
