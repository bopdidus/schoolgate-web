import {
  EducationSystem,
  EducationType,
  SchoolStatus,
  SchoolSystem,
} from '../../../../shared/models/common.model';

/** A single fee item: either the enrollment fee or one tuition installment. */
export interface ClassFee {
  id?: string;
  amount: number;
  dueDate: string;
  /**
   * Enrollment-fee advance % — stored on the class (`advance_percentage`).
   * Required when the parent class has `advanceAllowed = true`.
   */
  advancePercentage?: number;
}

/** Tuition installment — advance is per tranche, not global. */
export interface ClassInstallment extends ClassFee {
  order: number;
  /** When true, parents may pay a partial advance for this installment. */
  advanceAllowed?: boolean;
}

export interface SchoolClass {
  id?: string;
  /** Required only when schoolSystem is bilingual. */
  system?: EducationSystem;
  educationType: EducationType;
  specialtyId?: string;
  specialtyOther?: string;
  levelId: string;
  levelLabel?: string;
  name: string;
  totalSeats: number;
  /**
   * Enrollment-fee advance only (class-level). Tuition advances live on each
   * installment via `ClassInstallment.advanceAllowed`.
   */
  advanceAllowed: boolean;
  /** Days after mobile declaration for school to validate before auto-refund (admin-configured, 1–7). */
  paymentValidationDays: number;
  enrollmentFee: ClassFee;
  installments: ClassInstallment[];
  enrolledCount?: number;
  fillRate?: number;
}

export interface School {
  id: string;
  name: string;
  /** Display name from the API (or resolved city). */
  city: string;
  cityId: number;
  address: string;
  phone: string;
  email: string;
  status: SchoolStatus;
  schoolSystem: SchoolSystem;
  /**
   * Current academic year from the Cameroon calendar (Sept → Aug), e.g. `2025-2026`.
   * Read-only — derived by the backend, never edited in the form.
   */
  academicYear?: string;
  classes: SchoolClass[];
  totalClasses?: number;
  fillRate?: number;
  createdAt: string;
  updatedAt: string;
}

/** Payload for `POST /schools` — matches backend create contract. */
export interface CreateSchoolRequest {
  name: string;
  cityId: number;
  address: string;
  phone: string;
  email: string;
  status: SchoolStatus;
  system: SchoolSystem;
}

/** School field update; include `classes` when replacing the class list. */
export interface UpdateSchoolRequest extends CreateSchoolRequest {
  classes?: Omit<SchoolClass, 'enrolledCount' | 'fillRate'>[];
}
export interface SchoolFilters {
  search?: string;
  status?: SchoolStatus | '';
  schoolSystem?: SchoolSystem | '';
  educationType?: EducationType | '';
  specialtyId?: string;
  page?: number;
  pageSize?: number;
}
