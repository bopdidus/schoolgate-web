import { createFeature, createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.state';

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialAuthState,
    on(AuthActions.init, (state) => ({ ...state, loading: true, error: null })),
    on(AuthActions.initSuccess, (state, { user }) => ({
      ...state,
      user,
      loading: false,
      initialized: true,
      error: null,
    })),
    on(AuthActions.initFailure, (state, { error }) => ({
      ...state,
      user: null,
      loading: false,
      initialized: true,
      error,
    })),
    on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
    on(AuthActions.loginSuccess, (state, { user }) => ({
      ...state,
      user,
      loading: false,
      initialized: true,
      error: null,
    })),
    on(AuthActions.loginFailure, (state, { error }) => ({
      ...state,
      loading: false,
      error,
    })),
    on(AuthActions.logout, (state) => ({ ...state, loading: true })),
    on(AuthActions.logoutSuccess, () => initialAuthState),
    on(AuthActions.sessionExpired, () => initialAuthState),
    on(AuthActions.updateProfileSuccess, (state, { user }) => ({
      ...state,
      user,
    })),
  ),
});

export const {
  name: authFeatureKey,
  reducer: authReducer,
  selectAuthState,
  selectUser,
  selectLoading,
  selectError,
  selectInitialized,
} = authFeature;
