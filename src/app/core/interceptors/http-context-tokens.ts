import { HttpContextToken } from '@angular/common/http';

/**
 * Marks a request as exempt from the automatic access-token refresh flow.
 *
 * Applied to the auth endpoints themselves (login, refresh, logout) so a failing
 * credentials check or an already-invalid refresh token doesn't trigger another
 * refresh attempt (which would otherwise loop or refresh mid-login/logout).
 */
export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);
