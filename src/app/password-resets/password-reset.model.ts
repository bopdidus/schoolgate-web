import { UserRole } from '../shared/models/common.model';

export type PasswordResetStatus = 'pending' | 'resolved';

/**
 * A school staff member who could not sign in and asked for a new password.
 * It stays pending until an admin sets one (from the user's detail page).
 */
export interface PasswordResetRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: UserRole | null;
  status: PasswordResetStatus;
  requestedAt: string;
  resolvedAt: string | null;
}

export interface PasswordResetFilters {
  status?: PasswordResetStatus;
  userId?: string;
  page?: number;
  pageSize?: number;
}

/** A user's reset history, shown on their detail page. */
export interface PasswordResetStats {
  total: number;
  pending: number;
  lastRequestedAt: string | null;
}
