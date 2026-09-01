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
  /** Days the school has to answer a pending request before auto-rejection (1–30). */
  reviewDeadlineDays?: number;
  /** Days the parent has to pay after acceptance (1–90). */
  paymentDeadlineDays?: number;
  /** ISO date after which new enrollment requests are refused; null/undefined = always open. */
  enrollmentDeadline?: string | null;
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
  reviewDeadlineDays?: number;
  paymentDeadlineDays?: number;
  enrollmentDeadline?: string | null;
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
