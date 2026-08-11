import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'PATIENT' | 'DOCTOR' | null;

interface AuthState {
  user: any | null;
  token: string | null;
  refreshToken: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  sessionExpired: boolean;
  /** Epoch ms when the access token stops being valid. Null when the server didn't say. */
  tokenExpiresAt: number | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  role: null,
  isAuthenticated: false,
  sessionExpired: false,
  tokenExpiresAt: null,
};

/** Turns the server's `expiresIn` (seconds) into an absolute deadline we can compare against. */
const expiryFrom = (expiresIn?: number | null): number | null =>
  typeof expiresIn === 'number' && expiresIn > 0 ? Date.now() + expiresIn * 1000 : null;

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: any;
        token: string;
        // Optional so an app build can ship ahead of the backend, and so existing
        // tests constructing this payload keep compiling.
        refreshToken?: string | null;
        expiresIn?: number | null;
        role: UserRole;
      }>
    ) => {
      const { user, token, refreshToken, expiresIn, role } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken ?? null;
      state.role = role;
      state.isAuthenticated = true;
      state.sessionExpired = false;
      state.tokenExpiresAt = expiryFrom(expiresIn);
    },

    /**
     * Token rotation only.
     *
     * Deliberately does NOT touch `user` or `role`. The refresh response carries
     * `role: 'ROLE_DOCTOR' | 'ROLE_PATIENT'`, but this app's UserRole is 'DOCTOR' | 'PATIENT'
     * and comes from the login-screen toggle. Writing the server's value here would make
     * RootNavigator's `role === 'DOCTOR'` check fall through, silently dropping a doctor into
     * the patient UI one token lifetime after they logged in.
     */
    tokenRefreshed: (
      state,
      action: PayloadAction<{
        token: string;
        refreshToken?: string | null;
        expiresIn?: number | null;
      }>
    ) => {
      // A logout may have raced an in-flight refresh — never resurrect a dead session.
      if (!state.isAuthenticated) {
        return;
      }
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken ?? state.refreshToken;
      state.tokenExpiresAt = expiryFrom(action.payload.expiresIn);
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.isAuthenticated = false;
      state.sessionExpired = false;
      state.tokenExpiresAt = null;
    },

    markSessionExpired: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.role = null;
      state.isAuthenticated = false;
      state.sessionExpired = true;
      state.tokenExpiresAt = null;
    },

    /** Dismisses the "Session Expired" prompt. Credentials were already cleared. */
    clearSessionExpired: (state) => {
      state.sessionExpired = false;
    },

    setRole: (state, action: PayloadAction<UserRole>) => {
      state.role = action.payload;
    }
  },
});

export const {
  setCredentials,
  logout,
  setRole,
  markSessionExpired,
  tokenRefreshed,
  clearSessionExpired,
} = authSlice.actions;
export default authSlice.reducer;
