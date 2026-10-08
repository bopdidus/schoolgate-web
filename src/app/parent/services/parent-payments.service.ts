import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DeclarePaymentRequestDto, PaymentsService } from '../../api';
import { unwrapData } from '../../core/utils/openapi-helpers';
import { MobileMoneyMethod, ParentPayment, PaymentLineItem } from '../domain/models';
import { mapPayment, unwrapPayment } from './parent-mappers';

/** Paying fees by Mobile Money and following the payments. */
@Injectable({ providedIn: 'root' })
export class ParentPaymentsService {
  private readonly paymentsApi = inject(PaymentsService);

  forEnrollment(enrollmentId: string): Observable<ParentPayment[]> {
    return this.paymentsApi
      .enrollmentsIdPaymentsGet(+enrollmentId)
      .pipe(map((envelope) => (unwrapData(envelope) ?? []).map(mapPayment)));
  }

  /** Platform service fee, in percent of what the school is owed. */
  feePercent(): Observable<number> {
    return this.paymentsApi.paymentsFeePolicyGet().pipe(map((envelope) => unwrapData(envelope)?.percent ?? 0));
  }

  /** Starts one Mobile Money payment: the operator pushes a prompt to `payerMsisdn`. */
  declare(enrollmentId: string, item: PaymentLineItem, method: MobileMoneyMethod, payerMsisdn: string): Observable<ParentPayment> {
    const body: DeclarePaymentRequestDto = {
      enrollment_id: +enrollmentId,
      type: item.type,
      installment_number: item.installmentNumber,
      amount_cents: item.amountCents,
      payment_method: method,
      payer_msisdn: payerMsisdn,
    };
    return this.paymentsApi.paymentsPost(body).pipe(map(unwrapPayment));
  }

  /** Asks the API to check the payment with the operator, and returns it. */
  sync(paymentId: string): Observable<ParentPayment> {
    return this.paymentsApi.paymentsIdSyncStatusPost(+paymentId).pipe(map(unwrapPayment));
  }
}
