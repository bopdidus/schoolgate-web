import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { InvoicesService } from '../../api';
import { unwrapData } from '../../core/utils/openapi-helpers';

/** An invoice issued for one validated payment (amount in cents). */
export interface ParentInvoice {
  id: string;
  paymentId: string;
  amountCents: number;
  issuedAt: string;
  paymentType: string;
  installmentNumber?: number;
}

/** Invoices of one of the parent's enrollments (the API checks it is theirs). */
@Injectable({ providedIn: 'root' })
export class ParentInvoicesService {
  private readonly invoicesApi = inject(InvoicesService);

  forEnrollment(enrollmentId: string): Observable<ParentInvoice[]> {
    return this.invoicesApi.invoicesGet(+enrollmentId, 100, 0).pipe(
      map((envelope) =>
        (unwrapData(envelope) ?? []).map((dto) => ({
          id: String(dto.id ?? ''),
          paymentId: String(dto.payment_id ?? ''),
          amountCents: dto.amount_cents ?? 0,
          issuedAt: String(dto.issued_at ?? ''),
          paymentType: String(dto.payment_type ?? ''),
          installmentNumber: dto.installment_number ?? undefined,
        })),
      ),
    );
  }
}
