import { Component, Inject, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription, interval } from 'rxjs';

export interface SessionTimeoutDialogData {
  countdownMs: number;
}

/** `'extend'` triggers a refresh from `SessionTimeoutService`; `'logout'` ends the session. */
export type SessionTimeoutDialogResult = 'extend' | 'logout';

/**
 * Idle-timeout warning. `disableClose` (set by the caller) is deliberate: a stray
 * Escape/backdrop click must not silently dismiss a security-relevant prompt —
 * the user has to make an explicit choice, or the countdown decides for them.
 */
@Component({
  selector: 'app-session-timeout-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './session-timeout-dialog.component.html',
  styleUrl: './session-timeout-dialog.component.scss',
})
export class SessionTimeoutDialogComponent implements OnDestroy {
  readonly remainingSeconds = signal(Math.ceil(this.data.countdownMs / 1000));
  private readonly countdownSub: Subscription;

  constructor(
    private readonly dialogRef: MatDialogRef<SessionTimeoutDialogComponent, SessionTimeoutDialogResult>,
    @Inject(MAT_DIALOG_DATA) readonly data: SessionTimeoutDialogData,
  ) {
    // Ticks client-side only for display — the actual logout decision below is
    // driven by this same countdown reaching zero, not by any server check.
    this.countdownSub = interval(1000).subscribe(() => {
      const next = this.remainingSeconds() - 1;
      if (next <= 0) {
        this.logout();
        return;
      }
      this.remainingSeconds.set(next);
    });
  }

  extend(): void {
    this.dialogRef.close('extend');
  }

  logout(): void {
    this.dialogRef.close('logout');
  }

  ngOnDestroy(): void {
    this.countdownSub.unsubscribe();
  }
}
