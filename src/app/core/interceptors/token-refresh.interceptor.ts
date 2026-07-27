import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenRefreshCoordinator } from '../auth/application/token-refresh-coordinator.service';
import { AuthActions } from '../auth/store/auth.actions';
import { SKIP_AUTH_REFRESH } from '../http/http-context-tokens';

function withBearerToken<T>(req: HttpRequest<T>, accessToken: string): HttpRequest<T> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
}

/**
 * Transparently recovers from an expired access token: on a 401 it refreshes the
 * session (via `TokenRefreshCoordinator`, which de-duplicates concurrent refreshes)
 * and retries the original request exactly once with the new token.
 *
 * If the refresh itself fails, the session is unrecoverable — a `sessionExpired`
 * action is dispatched so the reducer/effects (single source of truth for auth state)
 * clear the session and redirect to `/login`, rather than this interceptor reaching
 * into storage and the router directly.
 */
export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH_REFRESH)) {
    return next(req);
  }

  const tokenRefresh = inject(TokenRefreshCoordinator);
  const store = inject(Store);

  return next(req).pipe(
    catchError((error: unknown) => {
      // The refresh token now lives in an HttpOnly cookie, invisible to JS, so we
      // can no longer pre-check "is there a refresh token?" before trying — we just
      // attempt the refresh on any 401 and let the backend be the judge (it will
      // 401 again on `/auth/refresh` itself if the cookie is missing/expired).
      const isRecoverable = error instanceof HttpErrorResponse && error.status === 401;

      if (!isRecoverable) {
        return throwError(() => error);
      }

      return tokenRefresh.refresh().pipe(
        switchMap((tokens) => next(withBearerToken(req, tokens.accessToken))),
        catchError((refreshError: unknown) => {
          store.dispatch(AuthActions.sessionExpired());
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
