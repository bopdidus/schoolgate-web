import { inject, Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Action } from '@ngrx/store';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../application/auth.service';
import { NotificationService } from '../../notifications/notification.service';
import { AuthActions } from './auth.actions';

const DEFAULT_AUTHENTICATED_ROUTE = '/dashboard';
const LOGIN_ROUTE = '/login';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.init),
      switchMap(() => this.bootstrapSession()),
    ),
  );

  /**
   * The access token lives only in memory (`InMemoryTokenStorage`), so it is
   * always gone after a full page reload — that is expected, not a sign the
   * user logged out. The only way to know whether the session is still valid
   * is to ask the backend, which reads the HttpOnly refresh cookie that this
   * app never sees directly (`authService.refreshToken()` sends no body token,
   * relying on `withCredentials: true`).
   */
  private bootstrapSession(): Observable<Action> {
    const ensureAccessToken$ = this.authService.isAuthenticated()
      ? of(undefined)
      : this.authService.refreshToken().pipe(map(() => undefined));

    return ensureAccessToken$.pipe(
      switchMap(() =>
        this.authService.getProfile().pipe(
          map((user) => AuthActions.initSuccess({ user })),
          catchError((error: unknown) => {
            // Access token rejected after refresh was already attempted above.
            if (error instanceof HttpErrorResponse && error.status === 401) {
              return of(AuthActions.initFailure({ error: 'Session expired' }));
            }
            // Keep the session on reload when `/auth/me` fails for other reasons
            // (network, 5xx, missing endpoint) if we still have a cached profile.
            const cached = this.authService.getCachedUser();
            if (cached) {
              return of(AuthActions.initSuccess({ user: cached }));
            }
            return of(AuthActions.initFailure({ error: 'Profile load failed' }));
          }),
        ),
      ),
      // The cookie-based refresh itself failed (missing/expired/revoked) — there is
      // no session to restore, full stop.
      catchError(() => of(AuthActions.initFailure({ error: 'Not authenticated' }))),
    );
  }

  /**
   * Only purge tokens when the session is known-invalid. Clearing on every init
   * failure was wiping a valid login on each page reload whenever `/auth/me`
   * failed for a non-auth reason.
   */
  initFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.initFailure),
        tap(({ error }) => {
          if (error === 'Session expired' || error === 'Not authenticated') {
            this.authService.clearSession();
          }
        }),
      ),
    { dispatch: false },
  );

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ credentials, returnUrl }) =>
        this.authService.login(credentials).pipe(
          map(({ user }) => AuthActions.loginSuccess({ user, returnUrl })),
          catchError(() =>
            of(AuthActions.loginFailure({ error: 'AUTH.LOGIN_ERROR' })),
          ),
        ),
      ),
    ),
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ returnUrl }) => {
          void this.router.navigateByUrl(returnUrl || DEFAULT_AUTHENTICATED_ROUTE);
        }),
      ),
    { dispatch: false },
  );

  logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      switchMap(() =>
        this.authService.logout().pipe(
          map(() => AuthActions.logoutSuccess()),
          catchError(() => {
            this.authService.clearSession();
            return of(AuthActions.logoutSuccess());
          }),
        ),
      ),
    ),
  );

  logoutSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logoutSuccess),
        tap(() => void this.router.navigate([LOGIN_ROUTE])),
      ),
    { dispatch: false },
  );

  /**
   * Centralises every side effect of an unrecoverable session (clearing storage,
   * notifying the user, redirecting) so interceptors/guards only need to dispatch
   * this one action instead of duplicating that logic themselves.
   */
  sessionExpired$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.sessionExpired),
        tap(() => {
          this.authService.clearSession();
          this.notification.error('AUTH.SESSION_EXPIRED');
          const returnUrl = this.router.routerState.snapshot.url;
          void this.router.navigate([LOGIN_ROUTE], {
            queryParams: returnUrl && returnUrl !== LOGIN_ROUTE ? { returnUrl } : undefined,
          });
        }),
      ),
    { dispatch: false },
  );
}
