import { TestBed } from '@angular/core/testing';
import { HttpContext } from '@angular/common/http';
import { of } from 'rxjs';
import { HttpAuthRepository } from './http-auth.repository';
import { AuthService as OpenApiAuthService } from '../../../api';
import { SKIP_AUTH_REFRESH } from '../../http/http-context-tokens';

describe('HttpAuthRepository', () => {
  let repository: HttpAuthRepository;
  // Untyped jasmine spies: the generated OpenAPI service methods are heavily
  // overloaded (`observe: 'body' | 'response' | 'events'`), which confuses
  // strict overload resolution when spied on directly via a typed `SpyObj`.
  let authRefreshPostSpy: jasmine.Spy;
  let authLogoutPostSpy: jasmine.Spy;
  let authLoginPostSpy: jasmine.Spy;

  beforeEach(() => {
    authRefreshPostSpy = jasmine.createSpy('authRefreshPost');
    authLogoutPostSpy = jasmine.createSpy('authLogoutPost');
    authLoginPostSpy = jasmine.createSpy('authLoginPost');
    const openApiAuthStub = {
      authLoginPost: authLoginPostSpy,
      authRefreshPost: authRefreshPostSpy,
      authLogoutPost: authLogoutPostSpy,
    } as unknown as OpenApiAuthService;

    TestBed.configureTestingModule({
      providers: [
        HttpAuthRepository,
        { provide: OpenApiAuthService, useValue: openApiAuthStub },
      ],
    });

    repository = TestBed.inject(HttpAuthRepository);
  });

  it('should request a refresh without sending a JS-readable refresh token (cookie carries it)', () => {
    authRefreshPostSpy.and.returnValue(of({ data: { access_token: 'new-access' }, error: null }));

    repository.refreshToken().subscribe();

    expect(authRefreshPostSpy).toHaveBeenCalledWith(
      jasmine.any(String),
      'body',
      false,
      jasmine.objectContaining({
        context: jasmine.any(HttpContext),
      }),
    );
    const options = authRefreshPostSpy.calls.mostRecent().args[3] as { context: HttpContext };
    expect(options.context.get(SKIP_AUTH_REFRESH)).toBe(true);
  });

  it('should map only the access token, tolerating a response with no refresh_token field', () => {
    authRefreshPostSpy.and.returnValue(of({ data: { access_token: 'new-access' }, error: null }));

    let result: { accessToken: string } | undefined;
    repository.refreshToken().subscribe((tokens) => (result = tokens));

    expect(result).toEqual({ accessToken: 'new-access' });
  });

  it('should call authLogoutPost so the refresh-token cookie is revoked server-side', () => {
    authLogoutPostSpy.and.returnValue(of(undefined));

    repository.logout().subscribe();

    expect(authLogoutPostSpy).toHaveBeenCalledWith(
      jasmine.any(String),
      'body',
      false,
      jasmine.objectContaining({
        context: jasmine.any(HttpContext),
      }),
    );
    const options = authLogoutPostSpy.calls.mostRecent().args[3] as { context: HttpContext };
    // Logout must never itself trigger the 401 refresh-retry flow.
    expect(options.context.get(SKIP_AUTH_REFRESH)).toBe(true);
  });
});
