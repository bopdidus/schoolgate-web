import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { TokenStorage } from '../auth/token-storage/token-storage.interface';

/**
 * Attaches the current access token, if any, as a Bearer `Authorization` header.
 *
 * Single responsibility: this interceptor only reads the stored token and stamps the
 * request. Refresh-on-401 handling and error notifications live in their own
 * interceptors so each concern can change independently.
 */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const accessToken = inject(TokenStorage).getAccessToken();

  if (!accessToken) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } }));
};
