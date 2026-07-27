import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { EMPTY, Subscription, catchError, timer } from 'rxjs';
import { TokenStorage } from '../token-storage/token-storage.interface';
import { TokenRefreshCoordinator } from './token-refresh-coordinator.service';
import { AuthActions } from '../store/auth.actions';
import { getJwtExpiryMs } from '../utils/jwt.util';
import { PROACTIVE_REFRESH_LEAD_MS } from '../auth.config';

/**
 * Watches the in-memory access token and schedules a refresh shortly before it
 * expires, purely to smooth the UX (avoid firing requests we already know will
 * 401). This is NOT a security control — the server still enforces real
 * expiry/validity on every request regardless of what this timer does.
 *
 * Subscribing to `TokenStorage.accessToken$` (instead of taking the token as a
 * constructor dependency from `AuthService`) keeps this service decoupled from
 * `AuthService`, which is what lets `TokenRefreshCoordinator` depend on
 * `AuthService` without creating a DI cycle back through this service.
 */
@Injectable({ providedIn: 'root' })
export class TokenExpiryService {
  private readonly tokenStorage = inject(TokenStorage);
  private readonly tokenRefresh = inject(TokenRefreshCoordinator);
  private readonly store = inject(Store);

  private scheduledRefresh: Subscription | null = null;

  constructor() {
    this.tokenStorage.accessToken$.subscribe((token) => this.reschedule(token));
  }

  private reschedule(accessToken: string | null): void {
    this.scheduledRefresh?.unsubscribe();
    this.scheduledRefresh = null;

    if (!accessToken) return;

    const expiryMs = getJwtExpiryMs(accessToken);
    // Not a JWT we can introspect, or no `exp` claim — skip client-side
    // scheduling silently; the 401 interceptor remains the safety net.
    if (expiryMs === null) return;

    const delayMs = Math.max(0, expiryMs - Date.now() - PROACTIVE_REFRESH_LEAD_MS);

    this.scheduledRefresh = timer(delayMs).subscribe(() => {
      this.tokenRefresh
        .refresh()
        .pipe(
          catchError(() => {
            // Refresh failed proactively (cookie expired/revoked) — same
            // unrecoverable-session handling as a reactive 401 refresh failure.
            this.store.dispatch(AuthActions.sessionExpired());
            return EMPTY;
          }),
        )
        .subscribe();
      // No explicit re-schedule call needed: a successful refresh flows through
      // `AuthService.persistTokens` -> `TokenStorage.setAccessToken`, which emits
      // on `accessToken$` and re-enters this method with the new token.
    });
  }
}
