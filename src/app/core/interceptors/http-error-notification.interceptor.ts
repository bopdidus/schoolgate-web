import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notifications/notification.service';

/** 401 is intentionally absent: it is owned by `tokenRefreshInterceptor`. */
const MESSAGE_KEY_BY_STATUS: Record<number, string> = {
  403: 'COMMON.FORBIDDEN',
  404: 'COMMON.NOT_FOUND',
};

function notificationKeyFor(status: number): string | null {
  if (status in MESSAGE_KEY_BY_STATUS) {
    return MESSAGE_KEY_BY_STATUS[status];
  }
  return status >= 500 ? 'COMMON.SERVER_ERROR' : null;
}

/**
 * Surfaces a toast for HTTP failures that would otherwise go unnoticed by the user
 * (forbidden, not found, server errors). Kept separate from token handling so this
 * purely presentational concern can evolve independently.
 */
export const httpErrorNotificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const key = notificationKeyFor(error.status);
        if (key) {
          notification.error(key);
        }
      }
      return throwError(() => error);
    }),
  );
};
