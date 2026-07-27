import { inject } from '@angular/core';
import { CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, filter, map, of, switchMap, take } from 'rxjs';
import { selectInitialized, selectUser } from '../store/auth.reducer';
import { AuthActions } from '../store/auth.actions';
import { User } from '../models/auth.model';
import { UserRole } from '../../../shared/models/common.model';

const LOGIN_ROUTE = '/login';
const HOME_ROUTE = '/dashboard';

/** Builds a redirect-to-login `UrlTree` that remembers where the user was headed. */
function redirectToLogin(router: Router, state: RouterStateSnapshot): UrlTree {
  return router.createUrlTree([LOGIN_ROUTE], { queryParams: { returnUrl: state.url } });
}

/**
 * Ensures the auth store is bootstrapped, then emits the current user. Shared by
 * `authGuard` / `guestGuard` so both decide from the same source of truth.
 *
 * Deliberately does NOT short-circuit on "no access token in memory" — with the
 * access token living only in memory (`InMemoryTokenStorage`), that's the normal
 * state right after a page reload and says nothing about whether the session is
 * actually valid. Only `AuthActions.init` (via a cookie-backed refresh in
 * `AuthEffects.bootstrapSession`) can tell real logged-out apart from
 * reload-with-a-valid-refresh-cookie.
 */
function ensureAuthInitialized(store: Store): Observable<User | null> {
  return store.select(selectInitialized).pipe(
    take(1),
    switchMap((initialized) => {
      if (!initialized) {
        store.dispatch(AuthActions.init());
        return store.select(selectInitialized).pipe(filter(Boolean), take(1));
      }
      return of(true);
    }),
    switchMap(() => store.select(selectUser).pipe(take(1))),
  );
}

/**
 * Blocks navigation for anyone without a valid session.
 *
 * Returning a `UrlTree` (instead of imperatively calling `router.navigate` and
 * returning `false`) lets the router itself perform the redirect — the guard stays a
 * pure function of its inputs, which makes it trivial to unit test.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return ensureAuthInitialized(store).pipe(
    map((user) => user !== null || redirectToLogin(router, state)),
  );
};

/**
 * Keeps already-authenticated users off the login page.
 * Must wait for auth init (same as `authGuard`) — deciding from the token alone
 * caused a login↔app redirect loop when profile bootstrap failed but tokens remained.
 */
export const guestGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);

  return ensureAuthInitialized(store).pipe(
    map((user) => (user ? router.createUrlTree([HOME_ROUTE]) : true)),
  );
};

/**
 * Restricts a route to a set of roles. Returns a guard factory so route config stays
 * declarative (`canActivate: [roleGuard(['admin'])]`) and new roles never require
 * touching this file — an application of the open/closed principle.
 *
 * Any denied access — whether the user isn't authenticated at all or is authenticated
 * with the wrong role — sends them back to `/login`, so there is a single, predictable
 * destination for "you can't be here".
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return (_route, state) => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectUser).pipe(
      take(1),
      map((user) =>
        user && allowedRoles.includes(user.role) ? true : redirectToLogin(router, state),
      ),
    );
  };
};
