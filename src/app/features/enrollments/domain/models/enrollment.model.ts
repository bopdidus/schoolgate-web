import { EnrollmentStatus, EducationSystem, EducationType } from '../../../../shared/models/common.model';

export interface Enrollment {
  id: string;
  studentName: string;
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
  /** Academic year this enrollment belongs to (e.g. `2025-2026`). */
  academicYear?: string;
  status: EnrollmentStatus;
  isExistingStudent: boolean;
  documentsReceived: boolean;
  /** True when the enrollment fee payment has been validated by school staff. */
  paymentValidated: boolean;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentFilters {
  schoolId?: string;
  classId?: string;
  status?: EnrollmentStatus | '';
  educationType?: EducationType | '';
  specialtyId?: string;
  paymentValidated?: boolean;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface RejectEnrollmentRequest {
  reason: string;
}
