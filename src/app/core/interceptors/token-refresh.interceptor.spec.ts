import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Store } from '@ngrx/store';
import { of, throwError } from 'rxjs';
import { tokenRefreshInterceptor } from './token-refresh.interceptor';
import { AuthService } from '../auth/application/auth.service';
import { TokenRefreshCoordinator } from '../auth/application/token-refresh-coordinator.service';
import { AuthActions } from '../auth/store/auth.actions';
import { SKIP_AUTH_REFRESH } from '../http/http-context-tokens';

describe('tokenRefreshInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let store: jasmine.SpyObj<Store>;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['refreshToken']);
    store = jasmine.createSpyObj('Store', ['dispatch']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tokenRefreshInterceptor])),
        provideHttpClientTesting(),
        // Real coordinator on top of a spied AuthService: exercises the actual
        // de-duplication logic (`shareReplay`) rather than asserting a mock's
        // call count, which is what actually protects against a thundering herd.
        TokenRefreshCoordinator,
        { provide: AuthService, useValue: authService },
        { provide: Store, useValue: store },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should refresh once and retry the original request with the new access token on a 401', () => {
    authService.refreshToken.and.returnValue(of({ accessToken: 'new-token' }));

    let result: unknown;
    http.get('/api/v1/schools').subscribe((res) => (result = res));

    const failing = httpMock.expectOne('/api/v1/schools');
    failing.flush(null, { status: 401, statusText: 'Unauthorized' });

    const retried = httpMock.expectOne('/api/v1/schools');
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-token');
    retried.flush({ ok: true });

    expect(result).toEqual({ ok: true });
    expect(authService.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('should trigger only ONE refresh call when several requests 401 concurrently (thundering herd)', () => {
    authService.refreshToken.and.returnValue(of({ accessToken: 'new-token' }));

    http.get('/api/v1/schools').subscribe();
    http.get('/api/v1/payments').subscribe();
    http.get('/api/v1/invoices').subscribe();

    httpMock.expectOne('/api/v1/schools').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/v1/payments').flush(null, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/v1/invoices').flush(null, { status: 401, statusText: 'Unauthorized' });

    // All three retries go out, but the refresh endpoint itself was hit exactly once.
    httpMock.expectOne('/api/v1/schools').flush({});
    httpMock.expectOne('/api/v1/payments').flush({});
    httpMock.expectOne('/api/v1/invoices').flush({});

    expect(authService.refreshToken).toHaveBeenCalledTimes(1);
  });

  it('should dispatch sessionExpired and propagate the error when the refresh itself fails', () => {
    authService.refreshToken.and.returnValue(throwError(() => new Error('refresh failed')));

    let caught: unknown;
    http.get('/api/v1/schools').subscribe({ error: (err) => (caught = err) });

    httpMock.expectOne('/api/v1/schools').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(store.dispatch).toHaveBeenCalledWith(AuthActions.sessionExpired());
    expect(caught).toBeTruthy();
  });

  it('should not attempt a refresh for requests explicitly marked SKIP_AUTH_REFRESH', () => {
    http
      .get('/api/v1/auth/login', { context: new HttpContext().set(SKIP_AUTH_REFRESH, true) })
      .subscribe({ error: () => undefined });

    httpMock.expectOne('/api/v1/auth/login').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authService.refreshToken).not.toHaveBeenCalled();
  });
});
