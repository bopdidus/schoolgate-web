import { TestBed } from '@angular/core/testing';
import { HttpContext } from '@angular/common/http';
import { of } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthService as OpenApiAuthService } from '../../api';
import { SKIP_AUTH_REFRESH } from '../interceptors/http-context-tokens';

describe('AuthApiService', () => {
  let service: AuthApiService;
  // Untyped jasmine spies: the generated OpenAPI service methods are heavily
  // overloaded (`observe: 'body' | 'response' | 'events'`), which confuses
  // strict overload resolution when spied on directly via a typed `SpyObj`.
  let authRefreshPostSpy: jasmine.Spy;
  let authLogoutPostSpy: jasmine.Spy;
  let authLoginPostSpy: jasmine.Spy;
  let authPasswordResetRequestsPostSpy: jasmine.Spy;
  let authMeGetSpy: jasmine.Spy;

  beforeEach(() => {
    authRefreshPostSpy = jasmine.createSpy('authRefreshPost');
    authLogoutPostSpy = jasmine.createSpy('authLogoutPost');
    authLoginPostSpy = jasmine.createSpy('authLoginPost');
    authPasswordResetRequestsPostSpy = jasmine.createSpy('authPasswordResetRequestsPost');
    authMeGetSpy = jasmine.createSpy('authMeGet');
    const openApiAuthStub = {
      authLoginPost: authLoginPostSpy,
      authRefreshPost: authRefreshPostSpy,
      authLogoutPost: authLogoutPostSpy,
      authPasswordResetRequestsPost: authPasswordResetRequestsPostSpy,
      authMeGet: authMeGetSpy,
    } as unknown as OpenApiAuthService;

    TestBed.configureTestingModule({
      providers: [
        AuthApiService,
        { provide: OpenApiAuthService, useValue: openApiAuthStub },
      ],
    });

    service = TestBed.inject(AuthApiService);
  });

  it('should request a refresh without sending a JS-readable refresh token (cookie carries it)', () => {
    authRefreshPostSpy.and.returnValue(of({ data: { access_token: 'new-access' }, error: null }));

    service.refreshToken().subscribe();

    // New client signature: (refreshToken, xClientType?, body?, observe, reportProgress, options).
    // xClientType stays undefined on web: the HttpOnly cookie carries the token.
    expect(authRefreshPostSpy).toHaveBeenCalledWith(
      jasmine.any(String),
      undefined,
      undefined,
      'body',
      false,
      jasmine.objectContaining({
        context: jasmine.any(HttpContext),
      }),
    );
    const options = authRefreshPostSpy.calls.mostRecent().args[5] as { context: HttpContext };
    expect(options.context.get(SKIP_AUTH_REFRESH)).toBe(true);
  });

  it('should map only the access token, tolerating a response with no refresh_token field', () => {
    authRefreshPostSpy.and.returnValue(of({ data: { access_token: 'new-access' }, error: null }));

    let result: { accessToken: string } | undefined;
    service.refreshToken().subscribe((tokens) => (result = tokens));

    expect(result).toEqual({ accessToken: 'new-access' });
  });

  it('should call authLogoutPost so the refresh-token cookie is revoked server-side', () => {
    authLogoutPostSpy.and.returnValue(of(undefined));

    service.logout().subscribe();

    expect(authLogoutPostSpy).toHaveBeenCalledWith(
      jasmine.any(String),
      undefined,
      undefined,
      'body',
      false,
      jasmine.objectContaining({
        context: jasmine.any(HttpContext),
      }),
    );
    const options = authLogoutPostSpy.calls.mostRecent().args[5] as { context: HttpContext };
    // Logout must never itself trigger the 401 refresh-retry flow.
    expect(options.context.get(SKIP_AUTH_REFRESH)).toBe(true);
  });

  it('should default remember_me to false when the caller omits it', () => {
    authLoginPostSpy.and.returnValue(
      of({ data: { user: { id: 1, role: 'admin' }, tokens: { access_token: 'a' } }, error: null }),
    );

    service.login({ email: 'a@b.com', password: 'secret' }).subscribe();

    expect(authLoginPostSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ email: 'a@b.com', password: 'secret', remember_me: false }),
      undefined,
      'body',
      false,
      jasmine.any(Object),
    );
  });

  it('should forward remember_me: true through to the login request body', () => {
    authLoginPostSpy.and.returnValue(
      of({ data: { user: { id: 1, role: 'admin' }, tokens: { access_token: 'a' } }, error: null }),
    );

    service.login({ email: 'a@b.com', password: 'secret', rememberMe: true }).subscribe();

    expect(authLoginPostSpy).toHaveBeenCalledWith(
      jasmine.objectContaining({ remember_me: true }),
      undefined,
      'body',
      false,
      jasmine.any(Object),
    );
  });

  it('should request a password reset and resolve without exposing whether the email exists', () => {
    authPasswordResetRequestsPostSpy.and.returnValue(
      of({ code: 'PASSWORD_RESET_REQUEST_ACCEPTED', data: { message: 'ok' }, error: null }),
    );

    let completed = false;
    service.requestPasswordReset('forgot@test.com').subscribe(() => (completed = true));

    expect(authPasswordResetRequestsPostSpy).toHaveBeenCalledWith(
      { email: 'forgot@test.com' },
      undefined,
      false,
      jasmine.objectContaining({ context: jasmine.any(HttpContext) }),
    );
    expect(completed).toBe(true);
  });

  // Session restore after a reload: refresh, then this. It must not trigger a
  // second refresh on 401 — the session is simply gone at that point.
  it('should load the signed-in profile from /auth/me without the refresh-on-401 flow', () => {
    authMeGetSpy.and.returnValue(
      of({ data: { id: 8, email: 'admin@verif.com', first_name: 'My', last_name: 'Verifadmin', role: 'school_admin', school_id: 1 }, error: null }),
    );

    let name = '';
    service.getProfile().subscribe((u) => (name = u.name));

    const options = authMeGetSpy.calls.mostRecent().args[2] as { context: HttpContext };
    expect(options.context.get(SKIP_AUTH_REFRESH)).toBeTrue();
    expect(name).toBe('My Verifadmin');
  });
});
