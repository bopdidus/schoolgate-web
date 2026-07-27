import { User } from '../models/auth.model';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export const initialAuthState: AuthState = {
  user: null,
  loading: false,
  error: null,
  initialized: false,
};
