import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { Subscription, fromEvent, merge, timer, switchMap, startWith, throttleTime } from 'rxjs';
import { TokenRefreshCoordinator } from './token-refresh-coordinator.service';
import { AuthActions } from '../store/auth.actions';
import { IDLE_TIMEOUT_MS, IDLE_WARNING_COUNTDOWN_MS } from '../auth.config';
import {
  SessionTimeoutDialogComponent,
  SessionTimeoutDialogResult,
} from '../../../shared/components/session-timeout-dialog/session-timeout-dialog.component';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'scroll', 'click'] as const;

/**
 * Detects prolonged user inactivity so an unattended, still-authenticated tab
 * doesn't stay silently usable forever — a real risk on shared/public machines
 * even though the access token itself is short-lived and memory-only.
 *
 * `start()`/`stop()` are meant to be called from the authenticated shell only
 * (see `MainLayoutComponent`), so public routes like `/login` never run this
 * (there is no session to protect there, and it would only add noise).
 */
@Injectable({ providedIn: 'root' })
export class SessionTimeoutService {
  private readonly dialog = inject(MatDialog);
  private readonly store = inject(Store);
  private readonly tokenRefresh = inject(TokenRefreshCoordinator);

  private idleSubscription: Subscription | null = null;
  private dialogRef: MatDialogRef<SessionTimeoutDialogComponent, SessionTimeoutDialogResult> | null = null;

  start(): void {
    if (this.idleSubscription) return; // idempotent — avoids stacking listeners if called twice

    const activity$ = merge(
      ...ACTIVITY_EVENTS.map((eventName) => fromEvent(window, eventName)),
    ).pipe(throttleTime(1000));

    // `switchMap` restarts the idle timer from zero on every activity tick —
    // the idiomatic RxJS way to express "debounce to inactivity" without
    // manual clearTimeout bookkeeping.
    this.idleSubscription = activity$
      .pipe(
        startWith(null),
        switchMap(() => timer(IDLE_TIMEOUT_MS)),
      )
      .subscribe(() => this.showWarning());
  }

  stop(): void {
    this.idleSubscription?.unsubscribe();
    this.idleSubscription = null;
    this.dialogRef?.close();
    this.dialogRef = null;
  }

  private showWarning(): void {
    if (this.dialogRef) return; // already warning — nothing to do until the user/countdown decides

    this.dialogRef = this.dialog.open(SessionTimeoutDialogComponent, {
      disableClose: true,
      data: { countdownMs: IDLE_WARNING_COUNTDOWN_MS },
    });

    this.dialogRef.afterClosed().subscribe((result) => {
      this.dialogRef = null;
      if (result === 'extend') {
        // A fresh access token, not just resetting the idle clock, is what
        // actually keeps the session alive server-side.
        this.tokenRefresh.refresh().subscribe({
          error: () => this.store.dispatch(AuthActions.sessionExpired()),
        });
      } else if (result === 'logout') {
        this.store.dispatch(AuthActions.logout());
      }
      // `undefined` means the dialog was closed programmatically by `stop()`
      // (e.g. the user already navigated away/logged out) — nothing to do.
    });
  }
}
