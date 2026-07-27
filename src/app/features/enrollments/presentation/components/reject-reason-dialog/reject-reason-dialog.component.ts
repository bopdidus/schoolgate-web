import {
  Component,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

export interface RejectReasonDialogData {
  studentName: string;
}

@Component({
  selector: 'app-reject-reason-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ 'ENROLLMENTS.REJECT_TITLE' | translate }}</h2>
    <p class="text-muted" style="padding: 0 24px">
      {{ 'ENROLLMENTS.REJECT_SUBTITLE' | translate: { name: data.studentName } }}
    </p>

    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="outline" style="width: 100%">
          <mat-label>{{ 'ENROLLMENTS.REJECT_REASON' | translate }}</mat-label>
          <textarea matInput formControlName="reason" rows="4"
            [placeholder]="'ENROLLMENTS.REJECT_REASON_PLACEHOLDER' | translate">
          </textarea>
          @if (form.controls.reason.invalid && form.controls.reason.touched) {
            <mat-error>{{ 'COMMON.REQUIRED' | translate }}</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button [mat-dialog-close]="undefined">
        {{ 'COMMON.CANCEL' | translate }}
      </button>
      <button mat-flat-button color="warn" (click)="confirm()" [disabled]="form.invalid">
        {{ 'ENROLLMENTS.REJECT' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class RejectReasonDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RejectReasonDialogComponent>);
  readonly data = inject<RejectReasonDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(5)]],
  });

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.controls.reason.value);
  }
}
