import { Payment } from '../payments/payment.model';

/** One tuition installment of the student's class (amounts in XAF). */
export interface TuitionInstallment {
  number: number;
  amount: number;
  dueDate: string;
}

export interface InstallmentProgress extends TuitionInstallment {
  /** Validated payments only: money the school actually received. */
  paid: number;
  /** Payments still awaiting the operator's confirmation, shown apart. */
  pending: number;
  /** Left once validated payments are deducted; pending does not reduce it. */
  remaining: number;
}

export interface TuitionSummary {
  installments: InstallmentProgress[];
  total: number;
  paid: number;
  pending: number;
  remaining: number;
}

/**
 * A student's tuition: every installment of the class, what is paid
 * (validated), what awaits confirmation, and what remains. The enrollment fee
 * is not tuition and is left out. Same rules as the mobile app
 * (SchoolGate lib/features/payment/domain/tuition_summary.dart).
 */
export function buildTuitionSummary(
  installments: TuitionInstallment[],
  payments: Payment[],
): TuitionSummary {
  const sum = (number: number, status: Payment['status']) =>
    payments
      .filter(
        (p) =>
          p.type === 'tuition_installment' && p.installmentNumber === number && p.status === status,
      )
      .reduce((total, p) => total + p.amount, 0);

  const rows: InstallmentProgress[] = [...installments]
    .sort((a, b) => a.number - b.number)
    .map((inst) => {
      const paid = sum(inst.number, 'validated');
      return {
        ...inst,
        paid,
        pending: sum(inst.number, 'declared'),
        remaining: Math.max(inst.amount - paid, 0),
      };
    });

  const total = (pick: (row: InstallmentProgress) => number) =>
    rows.reduce((acc, row) => acc + pick(row), 0);
  return {
    installments: rows,
    total: total((r) => r.amount),
    paid: total((r) => r.paid),
    pending: total((r) => r.pending),
    remaining: total((r) => r.remaining),
  };
}
