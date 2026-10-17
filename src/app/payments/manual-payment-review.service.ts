import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { catchError, EMPTY, filter, map, Observable, switchMap, tap } from 'rxjs';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  ConfirmDialogResult,
} from '../shared/components/confirm-dialog/confirm-dialog.component';
import { NotificationService } from '../core/services/notification.service';
import { PaymentService } from './payment.service';

/**
 * Staff review of a manual payment: ask, call the API, tell the outcome.
 * Each method emits once the review is saved and completes silently when the
 * dialog is cancelled or the call fails (the error interceptor reports it).
 * `onStart` runs when the API call begins, for a busy indicator.
 */
@Injectable({ providedIn: 'root' })
export class ManualPaymentReview {
  private readonly dialog = inject(MatDialog);
  private readonly payments = inject(PaymentService);
  private readonly notification = inject(NotificationService);

  /** The school found the transfer on its account. */
  confirm(paymentId: string, onStart: () => void = () => {}): Observable<void> {
    return this.ask({
      title: 'PAYMENTS.CONFIRM_MANUAL_TITLE',
      message: 'PAYMENTS.CONFIRM_MANUAL_MESSAGE',
      confirmLabel: 'PAYMENTS.CONFIRM_MANUAL',
    }).pipe(
      filter((r) => !!r?.confirmed),
      switchMap(() => {
        onStart();
        return this.payments.confirm(paymentId);
      }),
      tap(() => this.notification.success('PAYMENTS.VALIDATED_OK')),
      map(() => undefined),
      catchError(() => EMPTY),
    );
  }

  /** No such transfer reached the school; the parent sees the reason. */
  reject(paymentId: string, onStart: () => void = () => {}): Observable<void> {
    return this.ask({
      title: 'PAYMENTS.REJECT_MANUAL_TITLE',
      message: 'PAYMENTS.REJECT_MANUAL_MESSAGE',
      confirmLabel: 'COMMON.REJECT',
      showReason: true,
      reasonLabel: 'PAYMENTS.REJECT_MANUAL_REASON',
    }).pipe(
      filter((r) => !!r?.confirmed),
      map((r) => (r?.reason ?? '').trim()),
      filter((reason) => {
        if (!reason) this.notification.error('PAYMENTS.REJECT_MANUAL_REASON_REQUIRED');
        return !!reason;
      }),
      switchMap((reason) => {
        onStart();
        return this.payments.reject(paymentId, reason);
      }),
      tap(() => this.notification.success('PAYMENTS.REJECTED_OK')),
      map(() => undefined),
      catchError(() => EMPTY),
    );
  }

  private ask(data: ConfirmDialogData): Observable<ConfirmDialogResult | undefined> {
    return this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult>(ConfirmDialogComponent, { data })
      .afterClosed();
  }
}
