import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

/**
 * Resolves machine-readable API codes (`code` on every envelope, success and
 * error) into localized messages via the `API_CODES.<CODE>` catalog.
 *
 * Fallback chain (backward compatible with older API responses):
 * 1. `API_CODES.<CODE>` translation when the code is known,
 * 2. the server-provided message,
 * 3. a generic translated text.
 */
@Injectable({ providedIn: 'root' })
export class ApiCodeService {
  private readonly translate = inject(TranslateService);

  /** Localized message for a code, or `null` when no translation exists. */
  translateCode(code: string | null | undefined, params?: Record<string, unknown>): string | null {
    if (!code) {
      return null;
    }
    const key = `API_CODES.${code}`;
    const translated = this.translate.instant(key, params);
    return translated === key ? null : translated;
  }

  /** Localized message for a code with fallback on the server message. */
  resolve(
    code: string | null | undefined,
    serverMessage?: string | null,
    params?: Record<string, unknown>,
  ): string {
    return (
      this.translateCode(code, params) ??
      (serverMessage || this.translate.instant('COMMON.SERVER_ERROR'))
    );
  }

  /** Extracts and localizes the outcome carried by a failed HTTP response. */
  resolveHttpError(error: HttpErrorResponse): string | null {
    const body = error.error as
      | { code?: string; error?: { code?: string; message?: string } }
      | null
      | undefined;
    const code = body?.error?.code ?? body?.code;
    const serverMessage = body?.error?.message;
    if (!code && !serverMessage) {
      return null;
    }
    return this.resolve(code, serverMessage);
  }
}
