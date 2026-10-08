import { TuitionInstallment } from './tuition-summary';
import { EnrollmentStatus, EducationSystem, EducationType } from '../shared/models/common.model';

export interface EnrollmentDocument {
  id: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  createdAt?: string;
}

export interface Enrollment {
  id: string;
  studentName: string;
  /** Student's sex; absent for children saved before it was collected. */
  studentGender?: 'male' | 'female';
  studentEmail?: string;
  studentPhone?: string;
  schoolId: string;
  schoolName: string;
  classId: string;
  className: string;
  /** Francophone or Anglophone sub-system of the enrolled class. */
  classSystem: EducationSystem;
  classEducationType: EducationType;
  classSpecialtyId?: string;
  classSpecialtyLabel?: string;
  classLevelId?: string;
  classLevelLabel?: string;
  /** Tuition and enrollment-fee standing (amounts in XAF); set on listings. */
  balance?: EnrollmentBalance;
  /** Tuition installments of the enrolled class (enrollment fee excluded). */
  tuitionInstallments?: TuitionInstallment[];
  /** Academic year this enrollment belongs to (e.g. `2025-2026`). */
  academicYear?: string;
  status: EnrollmentStatus;
  isExistingStudent: boolean;
  documentsReceived: boolean;
  /** True when the enrollment fee payment has been validated by school staff. */
  paymentValidated: boolean;
  rejectionReason?: string;
  /** Uploaded supporting documents (populated on GET /enrollments/{id}). */
  documents?: EnrollmentDocument[];
  /** Staff user id who accepted/rejected the enrollment. */
  reviewedByUserId?: number;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Paid = validated payments; pending ones await the operator and are kept apart. */
export interface EnrollmentBalance {
  tuitionTotal: number;
  tuitionPaid: number;
  tuitionPending: number;
  tuitionRemaining: number;
  tuitionSettled: boolean;
  enrollmentFee: number;
  enrollmentFeePaid: number;
  enrollmentFeeStatus: 'paid' | 'partial' | 'pending' | 'unpaid';
}

export interface EnrollmentFilters {
  schoolId?: string;
  classId?: string;
  status?: EnrollmentStatus | '';
  educationType?: EducationType | '';
  specialtyId?: string;
  paymentValidated?: boolean;
  /** Student lookup: exact matricule or partial name. */
  matricule?: string;
  /** true = returning (ancien) student, false = new (nouveau), undefined = all. */
  isReturningStudent?: boolean;
  /** YYYY-YYYY; undefined = every academic year. */
  academicYear?: string;
  /** true = tuition fully paid, false = still owing, undefined = all. */
  tuitionSettled?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface RejectEnrollmentRequest {
  reason: string;
}
