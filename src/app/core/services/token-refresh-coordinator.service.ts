import { Injectable, inject } from '@angular/core';
import { Observable, finalize, shareReplay } from 'rxjs';
import { AuthService } from './auth.service';
import { AuthTokens } from '../models/auth.model';

/**
 * Ensures at most one access-token refresh request is ever in flight.
 *
 * Without this, several requests failing with 401 at the same time would each kick off
 * their own `/auth/refresh` call, racing against each other and potentially invalidating
 * one another's tokens. Every caller that arrives while a refresh is already running is
 * handed the same in-flight `Observable` and resolves once that single call completes.
 */
@Injectable({ providedIn: 'root' })
export class TokenRefreshCoordinator {
  private readonly authService = inject(AuthService);
  private inFlightRefresh$: Observable<AuthTokens> | null = null;

  refresh(): Observable<AuthTokens> {
    if (!this.inFlightRefresh$) {
      this.inFlightRefresh$ = this.authService.refreshToken().pipe(
        finalize(() => {
          this.inFlightRefresh$ = null;
        }),
        shareReplay(1),
      );
    }
    return this.inFlightRefresh$;
  }
}
