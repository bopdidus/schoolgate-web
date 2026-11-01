import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { LocaleDatePipe } from '../../shared/pipes/locale-date.pipe';
import { PaymentEvent } from '../payment.model';
import { PaymentService } from '../payment.service';

export interface PaymentHistoryDialogData {
  paymentId: string;
}

/** Who did what on a payment, oldest first, with the operator notifications received. */
@Component({
  selector: 'app-payment-history-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatProgressSpinnerModule, TranslateModule, LocaleDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-history-dialog.component.html',
  styleUrl: './payment-history-dialog.component.scss',
})
export class PaymentHistoryDialogComponent implements OnInit {
  private readonly payments = inject(PaymentService);
  private readonly data = inject<PaymentHistoryDialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(true);
  readonly failed = signal(false);
  readonly events = signal<PaymentEvent[]>([]);

  ngOnInit(): void {
    this.payments.events(this.data.paymentId).subscribe({
      next: (events) => {
        this.events.set(events);
        this.loading.set(false);
      },
      error: () => {
        this.failed.set(true);
        this.loading.set(false);
      },
    });
  }
}
