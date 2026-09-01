import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../notifications/notification.service';
import { ApiCodeService } from '../api/api-code.service';

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

/** 400/422 stay silent here: forms surface validation errors inline. */
function shouldToast(status: number): boolean {
  return status in MESSAGE_KEY_BY_STATUS || status === 409 || status === 429 || status >= 500;
}

/**
 * Surfaces a toast for HTTP failures that would otherwise go unnoticed by the user
 * (forbidden, not found, server errors). The API code carried by the envelope is
 * localized first; status-based texts remain as fallback for legacy responses.
 */
export const httpErrorNotificationInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const apiCodes = inject(ApiCodeService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status !== 401 && shouldToast(error.status)) {
        const localized = apiCodes.resolveHttpError(error);
        if (localized) {
          notification.error(localized);
        } else {
          const key = notificationKeyFor(error.status);
          if (key) {
            notification.error(key);
          }
        }
      }
      return throwError(() => error);
    }),
  );
};
