import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { Observable, of, throwError } from 'rxjs';

import { AuthEffects } from './auth.effects';
import { AuthActions } from './auth.actions';
import { authReducer } from './auth.reducer';
import { initialAuthState } from './auth.state';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { SessionSyncService } from '../services/session-sync.service';
import { User } from '../models/auth.model';

const USER: User = { id: '5', email: 'a@x.cm', name: 'A', role: 'school_admin', isActive: true, createdAt: '' };

describe('auth reducer', () => {
  it('tracks loading, the user and errors', () => {
    let s = authReducer(initialAuthState, AuthActions.login({ credentials: { email: 'a', password: 'b' } }));
    expect(s.loading).toBeTrue();
    s = authReducer(s, AuthActions.loginSuccess({ user: USER }));
    expect(s).toEqual(jasmine.objectContaining({ user: USER, loading: false, initialized: true }));
    s = authReducer(s, AuthActions.updateProfileSuccess({ user: { ...USER, name: 'B' } }));
    expect(s.user?.name).toBe('B');
    s = authReducer(s, AuthActions.sessionExpired());
    expect(s).toEqual(initialAuthState);
    s = authReducer(s, AuthActions.loginFailure({ error: 'AUTH.LOGIN_ERROR' }));
    expect(s.error).toBe('AUTH.LOGIN_ERROR');
    s = authReducer(s, AuthActions.initFailure({ error: null }));
    expect(s.initialized).toBeTrue();
  });
});

describe('AuthEffects', () => {
  let actions$: Observable<Action>;
  let auth: jasmine.SpyObj<AuthService>;
  let sync: jasmine.SpyObj<SessionSyncService>;
  let notification: jasmine.SpyObj<NotificationService>;
  let effects: AuthEffects;
  let router: Router;

  beforeEach(() => {
    auth = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'refreshToken',
      'getProfile',
      'getCachedUser',
      'clearSession',
      'login',
      'logout',
    ]);
    sync = jasmine.createSpyObj<SessionSyncService>('SessionSyncService', ['notifyLogin', 'notifyLogout']);
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['error']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        AuthEffects,
        provideMockActions(() => actions$),
        { provide: AuthService, useValue: auth },
        { provide: SessionSyncService, useValue: sync },
        { provide: NotificationService, useValue: notification },
      ],
    });
    effects = TestBed.inject(AuthEffects);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
  });

  it('restores the session after a reload through the refresh cookie', (done) => {
    auth.isAuthenticated.and.returnValue(false);
    auth.refreshToken.and.returnValue(of({}) as never);
    auth.getProfile.and.returnValue(of(USER));
    actions$ = of(AuthActions.init());
    effects.init$.subscribe((a) => {
      expect(a).toEqual(AuthActions.initSuccess({ user: USER }));
      done();
    });
  });

  it('is a guest when the refresh cookie is gone', (done) => {
    auth.isAuthenticated.and.returnValue(false);
    auth.refreshToken.and.returnValue(throwError(() => new Error('no cookie')));
    actions$ = of(AuthActions.init());
    effects.init$.subscribe((a) => {
      expect(a).toEqual(AuthActions.initFailure({ error: null }));
      done();
    });
  });

  it('keeps a cached profile when /auth/me fails for another reason than 401', (done) => {
    auth.isAuthenticated.and.returnValue(true);
    auth.getProfile.and.returnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    auth.getCachedUser.and.returnValue(USER);
    actions$ = of(AuthActions.init());
    effects.init$.subscribe((a) => {
      expect(a).toEqual(AuthActions.initSuccess({ user: USER }));
      done();
    });
  });

  it('logs in and goes to the role home or the return url', (done) => {
    auth.login.and.returnValue(of({ user: USER }) as never);
    actions$ = of(AuthActions.login({ credentials: { email: 'a', password: 'b' }, returnUrl: '/finance' }));
    effects.login$.subscribe((a) => {
      expect(a).toEqual(AuthActions.loginSuccess({ user: USER, returnUrl: '/finance' }));
      actions$ = of(a);
      effects.loginSuccess$.subscribe(() => {
        expect(sync.notifyLogin).toHaveBeenCalledWith('5');
        expect(router.navigateByUrl).toHaveBeenCalledWith('/finance');
        done();
      });
    });
  });

  it('reports a failed login', (done) => {
    auth.login.and.returnValue(throwError(() => new Error('bad')));
    actions$ = of(AuthActions.login({ credentials: { email: 'a', password: 'b' } }));
    effects.login$.subscribe((a) => {
      expect(a).toEqual(AuthActions.loginFailure({ error: 'AUTH.LOGIN_ERROR' }));
      done();
    });
  });

  it('logs out even when the server cannot be reached', (done) => {
    auth.logout.and.returnValue(throwError(() => new Error('offline')));
    actions$ = of(AuthActions.logout());
    effects.logout$.subscribe((a) => {
      expect(auth.clearSession).toHaveBeenCalled();
      expect(sync.notifyLogout).not.toHaveBeenCalled();
      expect(a).toEqual(AuthActions.logoutSuccess());
      done();
    });
  });

  it('on an expired session clears it, says so and asks to sign in again', () => {
    actions$ = of(AuthActions.sessionExpired());
    effects.sessionExpired$.subscribe();
    expect(auth.clearSession).toHaveBeenCalled();
    expect(notification.error).toHaveBeenCalledWith('AUTH.SESSION_EXPIRED');
    expect(router.navigate).toHaveBeenCalledWith(['/login'], jasmine.anything());
  });
});
