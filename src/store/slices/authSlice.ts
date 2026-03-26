import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'PATIENT' | 'DOCTOR' | null;

interface AuthState {
  user: any | null;
  token: string | null;
  role: UserRole;
  isAuthenticated: boolean;
  sessionExpired: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  sessionExpired: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: any; token: string; role: UserRole }>
    ) => {
      const { user, token, role } = action.payload;
      state.user = user;
      state.token = token;
      state.role = role;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.sessionExpired = false;
    },
    markSessionExpired: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.isAuthenticated = false;
      state.sessionExpired = true;
    },
    setRole: (state, action: PayloadAction<UserRole>) => {
      state.role = action.payload;
    }
  },
});

export const { setCredentials, logout, setRole, markSessionExpired } = authSlice.actions;
export default authSlice.reducer;
