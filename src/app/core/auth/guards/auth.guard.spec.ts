import { TestBed } from '@angular/core/testing';
import { Router, RouterStateSnapshot, ActivatedRouteSnapshot, UrlTree } from '@angular/router';
import { Store, Action } from '@ngrx/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { authGuard, guestGuard } from './auth.guard';
import { AuthActions } from '../store/auth.actions';
import { selectInitialized, selectUser } from '../store/auth.reducer';
import { User } from '../models/auth.model';

const MOCK_USER: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin',
  role: 'admin',
  isActive: true,
  createdAt: '',
};

/**
 * Minimal store double that lets tests drive `selectInitialized`/`selectUser`
 * directly, and simulates `AuthActions.init` resolving synchronously — the real
 * resolution goes through `AuthEffects.bootstrapSession` (an HTTP round trip via
 * the refresh cookie), which is out of scope for a guard-level test: what the
 * guard must get right is "wait for `initialized`, then decide from `user`".
 */
class FakeAuthStore {
  private readonly initialized$ = new BehaviorSubject(false);
  private readonly user$ = new BehaviorSubject<User | null>(null);
  readonly dispatched: Action[] = [];

  /** Call before dispatch to control what `init` resolves to once triggered. */
  resolveInitWith: { initialized: boolean; user: User | null } = {
    initialized: true,
    user: null,
  };

  select(selector: unknown): Observable<unknown> {
    if (selector === selectInitialized) return this.initialized$.asObservable();
    if (selector === selectUser) return this.user$.asObservable();
    throw new Error('Unexpected selector in FakeAuthStore');
  }

  dispatch(action: Action): void {
    this.dispatched.push(action);
    if (action.type === AuthActions.init.type) {
      this.user$.next(this.resolveInitWith.user);
      this.initialized$.next(this.resolveInitWith.initialized);
    }
  }

  setState(initialized: boolean, user: User | null): void {
    this.initialized$.next(initialized);
    this.user$.next(user);
  }
}

describe('authGuard / guestGuard', () => {
  let store: FakeAuthStore;
  let router: jasmine.SpyObj<Router>;
  const state = { url: '/schools' } as RouterStateSnapshot;
  const route = {} as ActivatedRouteSnapshot;

  beforeEach(() => {
    store = new FakeAuthStore();
    router = jasmine.createSpyObj('Router', ['createUrlTree']);
    // Cast to bypass `UrlTree`'s structural shape — tests only need to assert
    // *what* the guard asked the router to build, not a real `UrlTree` instance.
    router.createUrlTree.and.callFake(
      (commands: unknown, extras?: unknown) => ({ commands, extras }) as unknown as UrlTree,
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: Store, useValue: store },
        { provide: Router, useValue: router },
      ],
    });
  });

  describe('authGuard', () => {
    it('should allow access when already initialized with a valid user in memory', () => {
      store.setState(true, MOCK_USER);

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      let resolved: unknown;
      (result as Observable<unknown>).subscribe((v) => (resolved = v));
      expect(resolved).toBe(true);
      expect(store.dispatched).toEqual([]); // fast path — no bootstrap needed
    });

    it('should redirect to /login when initialized but there is no user (no valid session)', () => {
      store.setState(true, null);

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      let resolved: unknown;
      (result as Observable<unknown>).subscribe((v) => (resolved = v));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/schools' },
      });
      expect(resolved).toEqual({ commands: ['/login'], extras: { queryParams: { returnUrl: '/schools' } } });
    });

    it('should bootstrap (dispatch init) when not initialized, then allow access once it resolves with a user', () => {
      store.resolveInitWith = { initialized: true, user: MOCK_USER };
      store.setState(false, null);

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      let resolved: unknown;
      (result as Observable<unknown>).subscribe((v) => (resolved = v));
      expect(store.dispatched.some((a) => a.type === AuthActions.init.type)).toBeTrue();
      expect(resolved).toBe(true);
    });

    it('should redirect to /login when bootstrap resolves without a user (cookie refresh failed)', () => {
      store.resolveInitWith = { initialized: true, user: null };
      store.setState(false, null);

      const result = TestBed.runInInjectionContext(() => authGuard(route, state));

      let resolved: unknown;
      (result as Observable<unknown>).subscribe((v) => (resolved = v));
      expect(resolved).toEqual({ commands: ['/login'], extras: { queryParams: { returnUrl: '/schools' } } });
    });
  });

  describe('guestGuard', () => {
    it('should redirect an already-authenticated user away from /login', () => {
      store.setState(true, MOCK_USER);

      const result = TestBed.runInInjectionContext(() => guestGuard(route, state));

      let resolved: unknown;
      (result as Observable<unknown>).subscribe((v) => (resolved = v));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
      expect(resolved).toEqual({ commands: ['/dashboard'], extras: undefined });
    });

    it('should allow a genuinely unauthenticated visitor to reach /login', () => {
      store.resolveInitWith = { initialized: true, user: null };
      store.setState(false, null);

      const result = TestBed.runInInjectionContext(() => guestGuard(route, state));

      let resolved: unknown;
      (result as Observable<unknown>).subscribe((v) => (resolved = v));
      expect(resolved).toBe(true);
    });
  });
});
