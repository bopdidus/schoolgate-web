export type UserRole = 'admin' | 'school_admin' | 'school_editor';

/** Francophone (6ème, 5ème…) vs Anglo-Saxon / Anglophone (Form 1, Form 2…). */
export type EducationSystem = 'francophone' | 'anglophone';
export type SchoolSystem = EducationSystem | 'bilingual';
export type EducationType = 'general' | 'technical' | 'vocational';

/** All roles that belong to a school (not the platform admin). */
export const SCHOOL_ROLES: UserRole[] = ['school_admin', 'school_editor'];

export type SchoolStatus = 'active' | 'inactive';

export type EnrollmentStatus =
  | 'pending_documents'
  | 'pending'
  | 'active'
  | 'rejected'
  | 'cancelled';

/** Statuses that can still receive an accept/reject action from school staff. */
export const ACTIONABLE_ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  'pending_documents',
  'pending',
];

export type PaymentStatus =
  | 'declared'
  | 'validated'
  | 'rejected'
  | 'refund_pending'
  | 'refunded';

export type PaymentType = 'enrollment_fee' | 'tuition_installment';

export type InvoiceStatus = 'issued' | 'void';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ApiError {
  message: string;
  code?: string;
}
