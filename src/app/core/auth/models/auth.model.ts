import { UserRole } from '../../../shared/models/common.model';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  schoolId?: string;
  schoolName?: string;
  isActive: boolean;
  createdAt: string;
}

/**
 * No `refreshToken` field here by design: the refresh token now travels only
 * inside the backend-issued HttpOnly cookie and must never surface in
 * application code (see `TokenStorage`).
 */
export interface AuthTokens {
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/** JWT pair as returned inside login/refresh payloads. */
export interface TokenPairDto {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

/**
 * Login payload after `{ data, error }` unwrap.
 * Real API: `{ message, tokens, user }`. Mock/legacy: flat `access_token` + `user`.
 */
export interface LoginResponse {
  message?: string;
  user?: User | Record<string, unknown>;
  tokens?: TokenPairDto;
  access_token?: string;
  refresh_token?: string;
}

export interface RefreshTokenResponse {
  tokens?: TokenPairDto;
  access_token?: string;
  refresh_token?: string;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
