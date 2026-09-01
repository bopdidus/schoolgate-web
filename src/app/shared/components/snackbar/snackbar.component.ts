import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';

export type SnackbarType = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarData {
  message: string;
  type: SnackbarType;
  /** Optional action button (e.g. "View" navigating to the resource). */
  actionLabel?: string;
  onAction?: () => void;
}

const SNACKBAR_ICONS: Record<SnackbarType, string> = {
  success: 'check_circle',
  error: 'cancel',
  info: 'info',
  warning: 'warning',
};

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-snackbar">
      <mat-icon class="app-snackbar__icon">{{ icon }}</mat-icon>
      <span class="app-snackbar__message">{{ data.message | translate }}</span>
      @if (data.actionLabel) {
        <button mat-button class="app-snackbar__action" (click)="runAction()">
          {{ data.actionLabel | translate }}
        </button>
      }
      <button
        mat-icon-button
        class="app-snackbar__close"
        aria-label="Close"
        (click)="snackBarRef.dismiss()"
      >
        <mat-icon>close</mat-icon>
      </button>
    </div>
  `,
})
export class SnackbarComponent {
  readonly icon = SNACKBAR_ICONS[this.data.type];

  constructor(
    @Inject(MAT_SNACK_BAR_DATA) readonly data: SnackbarData,
    readonly snackBarRef: MatSnackBarRef<SnackbarComponent>,
  ) {}

  runAction(): void {
    this.data.onAction?.();
    this.snackBarRef.dismiss();
  }
}
