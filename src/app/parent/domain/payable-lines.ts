import { ClassOffering, ParentPayment, ParentPaymentStatus, ParentPaymentType, PaymentLineItem } from './models';
import { minAdvanceCents } from './money';

/**
 * Payments that count toward a fee line's coverage, like the API's
 * `HoldsAmount`: awaiting the operator or validated.
 */
export function holdsAmount(status: ParentPaymentStatus): boolean {
  return status === 'declared' || status === 'validated';
}

/**
 * One fee line the parent can pay now (the enrollment fee, or one tuition
 * installment), with what is already held on it.
 *
 * Built with the API's own rules (services/payment/amount_validator.go), so
 * every amount sent is accepted: a line is paid for exactly its remaining
 * balance, or, when it allows an advance and nothing is held on it yet, for
 * its advance minimum. Port of the mobile app's `PayableLine`.
 */
export class PayableLine {
  constructor(
    readonly type: ParentPaymentType,
    readonly totalCents: number,
    readonly heldCents: number,
    readonly installmentNumber?: number,
    /** Smallest accepted advance; undefined when the line allows none. */
    readonly advanceMinCents?: number,
  ) {}

  get remainingCents(): number {
    return this.totalCents - this.heldCents;
  }

  /** An advance equal to the balance is just a full payment. */
  get canPayAdvance(): boolean {
    return this.advanceMinCents !== undefined && this.heldCents === 0 && this.advanceMinCents < this.remainingCents;
  }

  amountCents(advance: boolean): number {
    return advance && this.canPayAdvance ? this.advanceMinCents! : this.remainingCents;
  }

  toItem(advance: boolean): PaymentLineItem {
    return { type: this.type, amountCents: this.amountCents(advance), installmentNumber: this.installmentNumber };
  }

  /** The enrollment fee, or null once fully held. Uses the class-level advance. */
  static enrollmentFee(offering: ClassOffering, payments: ParentPayment[]): PayableLine | null {
    const line = new PayableLine(
      'enrollment_fee',
      offering.enrollmentFeeCents,
      held(payments, 'enrollment_fee'),
      undefined,
      offering.advanceAllowed ? minAdvanceCents(offering.enrollmentFeeCents, offering.advancePercentage) : undefined,
    );
    return line.totalCents > 0 && line.remainingCents > 0 ? line : null;
  }

  /** The lowest-numbered installment still owed, with its own advance settings. */
  static nextInstallment(offering: ClassOffering, payments: ParentPayment[]): PayableLine | null {
    const sorted = [...offering.installments].sort((a, b) => a.number - b.number);
    for (const inst of sorted) {
      const line = new PayableLine(
        'tuition_installment',
        inst.amountCents,
        held(payments, 'tuition_installment', inst.number),
        inst.number,
        inst.advanceAllowed ? minAdvanceCents(inst.amountCents, inst.advancePercentage) : undefined,
      );
      if (line.totalCents > 0 && line.remainingCents > 0) return line;
    }
    return null;
  }
}

function held(payments: ParentPayment[], type: ParentPaymentType, installmentNumber?: number): number {
  return payments
    .filter(
      (p) =>
        holdsAmount(p.status) &&
        p.type === type &&
        (type === 'enrollment_fee' || p.installmentNumber === installmentNumber),
    )
    .reduce((sum, p) => sum + p.amountCents, 0);
}

/** What the parent chooses to pay in one session. */
export type PaymentOption = 'combined' | 'enrollment_only' | 'installment_only';

/**
 * The lines payable now: the enrollment fee (never in the tuition-only flow)
 * and the next installment still owed.
 */
export class PayableLines {
  constructor(
    readonly enrollmentFee: PayableLine | null,
    readonly installment: PayableLine | null,
  ) {}

  static from(offering: ClassOffering, payments: ParentPayment[], tuitionOnly = false): PayableLines {
    return new PayableLines(
      tuitionOnly ? null : PayableLine.enrollmentFee(offering, payments),
      PayableLine.nextInstallment(offering, payments),
    );
  }

  get available(): PaymentOption[] {
    const options: PaymentOption[] = [];
    if (this.enrollmentFee && this.installment) options.push('combined');
    if (this.enrollmentFee) options.push('enrollment_only');
    if (this.installment) options.push('installment_only');
    return options;
  }

  /** The parent's pick while still payable, else the first payable option. */
  resolve(picked: PaymentOption): PaymentOption | null {
    const options = this.available;
    if (options.length === 0) return null;
    return options.includes(picked) ? picked : options[0];
  }

  selected(option: PaymentOption): PayableLine[] {
    switch (option) {
      case 'enrollment_only':
        return [this.enrollmentFee!];
      case 'installment_only':
        return [this.installment!];
      case 'combined':
        return [this.enrollmentFee!, this.installment!];
    }
  }

  items(option: PaymentOption, advance: boolean): PaymentLineItem[] {
    return this.selected(option).map((line) => line.toItem(advance));
  }
}
