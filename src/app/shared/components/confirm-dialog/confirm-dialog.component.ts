import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showReason?: boolean;
  reasonLabel?: string;
}

export interface ConfirmDialogResult {
  confirmed: boolean;
  reason?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.title | translate }}</h2>
    <mat-dialog-content>
      <p>{{ data.message | translate }}</p>
      @if (data.showReason) {
        <mat-form-field appearance="outline" style="width: 100%">
          <mat-label>{{ (data.reasonLabel ?? 'PAYMENTS.REJECTION_REASON') | translate }}</mat-label>
          <textarea matInput [(ngModel)]="reason" rows="3"></textarea>
        </mat-form-field>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="cancel()">
        {{ (data.cancelLabel ?? 'COMMON.CANCEL') | translate }}
      </button>
      <button mat-flat-button color="primary" (click)="confirm()">
        {{ (data.confirmLabel ?? 'COMMON.CONFIRM') | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialogComponent {
  reason = '';

  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent, ConfirmDialogResult>,
    @Inject(MAT_DIALOG_DATA) readonly data: ConfirmDialogData,
  ) {}

  confirm(): void {
    this.dialogRef.close({ confirmed: true, reason: this.reason || undefined });
  }

  cancel(): void {
    this.dialogRef.close({ confirmed: false });
  }
}
