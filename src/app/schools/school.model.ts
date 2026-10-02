import {
  EducationSystem,
  EducationType,
  SchoolStatus,
  SchoolSystem,
} from '../shared/models/common.model';

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
  /** Direct-payment bypass config for returning students. */
  matriculeVerification: MatriculeVerificationInfo;
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

export type DocumentPurpose = 'enrollment' | 'tuition_payment';

export interface DocumentType {
  id: string;
  code: string;
  label: string;
}

export interface DocumentRequirement {
  id?: string;
  documentTypeId: string;
  documentTypeLabel?: string;
  purpose: DocumentPurpose;
  required: boolean;
  otherLabel?: string;
}

/**
 * How a returning student's claimed matricule is checked before the
 * direct-payment bypass is granted. `none` trusts the parent's claim as-is.
 */
export type MatriculeVerificationMode = 'none' | 'file' | 'api';

/** Read model — mirrors `School`'s verification fields (see school.model.ts `School`). */
export interface MatriculeVerificationInfo {
  allowDirectPaymentForReturningStudents: boolean;
  mode: MatriculeVerificationMode;
  apiUrl?: string;
  /** Whether an API key is configured; the key itself is never sent back. */
  apiKeySet: boolean;
  rosterUploaded: boolean;
}

/**
 * Write payload for `PUT /schools/{id}/matricule-verification`. Always
 * replaces all fields together — see the API key note on `apiKey`.
 */
export interface MatriculeVerificationConfig {
  allowDirectPaymentForReturningStudents: boolean;
  mode: MatriculeVerificationMode;
  apiUrl?: string;
  /**
   * Write-only. The backend never echoes the key back, so leaving this blank
   * on an update that keeps mode "api" will wipe a previously saved key —
   * callers must resend it if only toggling other fields.
   */
  apiKey?: string;
}

/**
 * Where a school receives its money (`GET/PUT /schools/{id}/payment-settings`).
 * A disabled channel keeps its details so it can be switched back on later.
 */
export interface PaymentSettings {
  orangeMoneyEnabled: boolean;
  orangeMoneyNumber: string;
  orangeMoneyAccountName: string;
  /** Orange merchant API OAuth client id (not secret). */
  orangeClientId: string;
  /** Client secret, X-AUTH-TOKEN and PIN are saved; the API never returns them. */
  orangeSecretsSet: boolean;
  mtnMomoEnabled: boolean;
  mtnMomoNumber: string;
  mtnMomoAccountName: string;
  /** MTN MoMo Collection API user (not secret). */
  mtnApiUser: string;
  /** API key and subscription key are saved; the API never returns them. */
  mtnSecretsSet: boolean;
  paypalEnabled: boolean;
  paypalEmail: string;
  bankTransferEnabled: boolean;
  bankName: string;
  bankAccountHolder: string;
  bankAccountNumber: string;
  bankSwiftCode: string;
  /** Absent until the school saves its settings once. */
  updatedAt?: string;
}

/**
 * Write payload for `PUT /schools/{id}/payment-settings`. Secrets are
 * write-only: leave one empty to keep the value already saved.
 */
export type PaymentSettingsUpdate = Omit<PaymentSettings, 'updatedAt' | 'orangeSecretsSet' | 'mtnSecretsSet'> & {
  orangeClientSecret: string;
  orangeAuthToken: string;
  orangePin: string;
  mtnApiKey: string;
  mtnSubscriptionKey: string;
};
