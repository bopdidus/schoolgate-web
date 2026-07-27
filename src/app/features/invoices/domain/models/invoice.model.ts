import { InvoiceStatus } from '../../../../shared/models/common.model';

export interface Invoice {
  id: string;
  uuid: string;
  enrollmentId: string;
  studentName: string;
  schoolId: string;
  schoolName: string;
  className: string;
  amount: number;
  installmentNumber?: number;
  status: InvoiceStatus;
  signatureHash: string;
  issuedAt: string;
}

export interface InvoiceVerification {
  valid: boolean;
  message: string;
}

export interface InvoiceFilters {
  schoolId?: string;
  enrollmentId?: string;
  status?: InvoiceStatus | '';
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}
