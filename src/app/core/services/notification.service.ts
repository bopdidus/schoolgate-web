import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SnackbarComponent, SnackbarData, SnackbarType } from '../../shared/components/snackbar/snackbar.component';

const SNACKBAR_DURATION_MS = 2000;
const SNACKBAR_WITH_ACTION_DURATION_MS = 6000;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  info(message: string): void {
    this.show(message, 'info');
  }

  warning(message: string): void {
    this.show(message, 'warning');
  }

  /** Longer-lived toast with an action button (e.g. "View" → navigate). */
  infoWithAction(message: string, actionLabel: string, onAction: () => void): void {
    this.show(message, 'info', { actionLabel, onAction });
  }

  private show(
    message: string,
    type: SnackbarType,
    action?: { actionLabel: string; onAction: () => void },
  ): void {
    const config: MatSnackBarConfig<SnackbarData> = {
      duration: action ? SNACKBAR_WITH_ACTION_DURATION_MS : SNACKBAR_DURATION_MS,
      panelClass: ['app-snackbar-panel', `app-snackbar-panel--${type}`],
      horizontalPosition: 'end',
      verticalPosition: 'top',
      data: { message, type, ...action },
    };
    this.snackBar.openFromComponent(SnackbarComponent, config);
  }
}
