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
  /** The parent attached a receipt the school can open. */
  hasProof: boolean;
}

/** `link`: paid on the school's own external page, confirmed by its staff. */
export type PaymentMethod = 'orange' | 'mtn' | 'paypal' | 'link';

export type PaymentEventKind =
  | 'declared'
  | 'proof_uploaded'
  | 'confirmed'
  | 'rejected'
  | 'webhook_received'
  | 'webhook_refused';

/** One line of a payment's history. */
export interface PaymentEvent {
  id: string;
  kind: PaymentEventKind;
  /** A user role, `operator` or `system`. */
  actorRole: string;
  provider?: string;
  detail?: string;
  createdAt: string;
}

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
