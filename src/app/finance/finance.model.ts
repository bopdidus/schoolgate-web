export type FinancePeriod = 'day' | 'week' | 'month';

/** What one fee line collected in a bucket; installment null = enrollment fee. */
export interface FinanceLineAmount {
  installment: number | null;
  amount: number;
}

export interface FinanceBucket {
  start: string;
  total: number;
  lines: FinanceLineAmount[];
}

export interface FinanceSummary {
  period: FinancePeriod;
  installmentNumbers: number[];
  series: FinanceBucket[];
  total: number;
  today: number;
  week: number;
  month: number;
  /** Awaiting the operator: shown apart, never counted as collected. */
  pending: number;
}

export interface ArrearsRow {
  enrollmentId: string;
  studentName: string;
  matricule: string;
  schoolClassName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  due: number;
  paid: number;
  outstanding: number;
  currentInstallment: number | null;
  daysLate: number;
}

export interface ArrearsReport {
  academicYear: string;
  asOf: string;
  count: number;
  totalOutstanding: number;
  rows: ArrearsRow[];
}

export interface ArrearsFilters {
  schoolClassId?: string;
  academicYear?: string;
  /** YYYY-MM-DD; default today on the API. */
  asOf?: string;
  page?: number;
  pageSize?: number;
}

export interface EnrolledExportFilters {
  schoolClassId?: string;
  academicYear?: string;
  tuitionSettled?: boolean;
}
