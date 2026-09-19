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
  templateUrl: './reject-reason-dialog.component.html',
  styleUrl: './reject-reason-dialog.component.scss',
})
export class RejectReasonDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RejectReasonDialogComponent>);
  readonly data = inject<RejectReasonDialogData>(MAT_DIALOG_DATA);

  // Mirrors the API contract: rejection_reason requires at least 10 characters.
  readonly form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(10)]],
  });

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.controls.reason.value);
  }
}
