import { Pipe, PipeTransform } from '@angular/core';
import {
  EnrollmentStatus,
  PaymentStatus,
  SchoolStatus,
} from '../models/common.model';

type StatusType = PaymentStatus | EnrollmentStatus | SchoolStatus | string;

@Pipe({ name: 'statusColor', standalone: true })
export class StatusColorPipe implements PipeTransform {
  private readonly colorMap: Record<string, string> = {
    declared: 'status-declared',
    validated: 'status-validated',
    rejected: 'status-rejected',
    refund_pending: 'status-refund_pending',
    refunded: 'status-refunded',
    pending: 'status-pending',
    pending_documents: 'status-pending_documents',
    active: 'status-active',
    cancelled: 'status-cancelled',
    inactive: 'status-inactive',
    issued: 'status-issued',
    void: 'status-void',
  };

  transform(status: StatusType): string {
    return `status-chip ${this.colorMap[status] ?? 'status-default'}`;
  }
}
