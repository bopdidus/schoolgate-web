import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { InvoicesService, InvoiceDto } from '../../../api';
import { PaginatedResponse } from '../../../shared/models/common.model';
import {
  fromCents,
  pageToOffset,
  toPaginated,
  unwrapData,
} from '../../../core/api/openapi-helpers';
import { Invoice, InvoiceFilters, InvoiceVerification } from '../domain/models/invoice.model';

@Injectable({ providedIn: 'root' })
export class InvoiceRepository {
  private readonly invoicesApi = inject(InvoicesService);

  getAll(filters: InvoiceFilters): Observable<PaginatedResponse<Invoice>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 10;
    const { limit, offset } = pageToOffset(page, pageSize);
    return this.invoicesApi.invoicesGet(limit, offset).pipe(
      map((envelope) => {
        const rows = unwrapData(envelope) ?? [];
        return toPaginated(
          rows.map((dto) => this.mapInvoice(dto)),
          envelope.meta,
          page,
          pageSize,
        );
      }),
    );
  }

  getById(id: string): Observable<Invoice> {
    return this.invoicesApi.invoicesIdGet(id).pipe(
      map((envelope) => this.mapInvoice(unwrapData(envelope))),
    );
  }

  verify(uuid: string): Observable<InvoiceVerification> {
    return this.invoicesApi.invoicesIdVerifyGet(uuid).pipe(
      map((envelope) => {
        const data = unwrapData(envelope);
        return {
          valid: Boolean(data?.valid ?? data?.invoice),
          message: String(data?.message ?? (data?.valid ? 'Valid' : 'Invalid')),
        };
      }),
    );
  }

  private mapInvoice(dto: InvoiceDto): Invoice {
    return {
      id: String(dto.id ?? ''),
      uuid: String(dto.id ?? ''),
      enrollmentId: '',
      studentName: String(dto.parent_name ?? ''),
      schoolId: '',
      schoolName: String(dto.school_name ?? ''),
      className: String(dto.school_class_name ?? ''),
      amount: fromCents(dto.amount_cents),
      installmentNumber: dto.installment_number ?? undefined,
      status: 'issued',
      signatureHash: String(dto.signature_hash ?? ''),
      issuedAt: String(dto.issued_at ?? ''),
    };
  }
}
