import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { authTokenInterceptor } from './auth-token.interceptor';
import { httpErrorNotificationInterceptor } from './http-error-notification.interceptor';
import { TokenStorage } from '../services/token-storage';
import { NotificationService } from '../services/notification.service';
import { ApiCodeService } from '../services/api-code.service';

describe('HTTP interceptors', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let token: string | null;
  let notification: jasmine.SpyObj<NotificationService>;
  let localized: string | null;

  beforeEach(() => {
    token = 'abc';
    localized = null;
    notification = jasmine.createSpyObj<NotificationService>('NotificationService', ['error']);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authTokenInterceptor, httpErrorNotificationInterceptor])),
        provideHttpClientTesting(),
        { provide: TokenStorage, useValue: { getAccessToken: () => token } },
        { provide: NotificationService, useValue: notification },
        { provide: ApiCodeService, useValue: { resolveHttpError: () => localized } },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('stamps the access token, and nothing without one', () => {
    http.get('/api/v1/x').subscribe();
    expect(backend.expectOne('/api/v1/x').request.headers.get('Authorization')).toBe('Bearer abc');
    token = null;
    http.get('/api/v1/y').subscribe();
    expect(backend.expectOne('/api/v1/y').request.headers.has('Authorization')).toBeFalse();
  });

  const fail = (status: number) => {
    http.get('/api/v1/z').subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/z').flush({}, { status, statusText: 'x' });
  };

  it('toasts forbidden, not found and server errors', () => {
    fail(403);
    fail(404);
    fail(503);
    expect(notification.error.calls.allArgs()).toEqual([['COMMON.FORBIDDEN'], ['COMMON.NOT_FOUND'], ['COMMON.SERVER_ERROR']]);
  });

  it('prefers the localized API code', () => {
    localized = 'Classe pleine';
    fail(409);
    expect(notification.error).toHaveBeenCalledWith('Classe pleine');
  });

  it('stays silent on 400, 422 and 401 (forms and refresh handle them)', () => {
    fail(400);
    fail(422);
    fail(401);
    expect(notification.error).not.toHaveBeenCalled();
  });
});
