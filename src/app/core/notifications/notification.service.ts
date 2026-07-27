import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SnackbarComponent, SnackbarData, SnackbarType } from '../../shared/components/snackbar/snackbar.component';

const SNACKBAR_DURATION_MS = 2000;

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

  private show(message: string, type: SnackbarType): void {
    const config: MatSnackBarConfig<SnackbarData> = {
      duration: SNACKBAR_DURATION_MS,
      panelClass: ['app-snackbar-panel', `app-snackbar-panel--${type}`],
      horizontalPosition: 'end',
      verticalPosition: 'top',
      data: { message, type },
    };
    this.snackBar.openFromComponent(SnackbarComponent, config);
  }
}
