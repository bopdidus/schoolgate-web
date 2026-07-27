import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { LoginCredentials, User } from '../models/auth.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Init: emptyProps(),
    'Init Success': props<{ user: User }>(),
    'Init Failure': props<{ error: string }>(),
    Login: props<{ credentials: LoginCredentials; returnUrl?: string }>(),
    'Login Success': props<{ user: User; returnUrl?: string }>(),
    'Login Failure': props<{ error: string }>(),
    Logout: emptyProps(),
    'Logout Success': emptyProps(),
    /** Backend rejected the refresh token — the session cannot be recovered client-side. */
    'Session Expired': emptyProps(),
    'Update Profile Success': props<{ user: User }>(),
  },
});
