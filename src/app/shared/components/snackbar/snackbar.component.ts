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
  templateUrl: './snackbar.component.html',
  styleUrl: './snackbar.component.scss',
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
