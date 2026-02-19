import { store } from './store';
import { setCredentials } from './slices/authSlice';

describe('Redux Store', () => {
  it('should handle auth state', () => {
    const initialState = store.getState().auth;
    expect(initialState.isAuthenticated).toBe(false);

    store.dispatch(setCredentials({ user: { id: '1', name: 'Test' }, token: 'token', role: 'PATIENT' }));

    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(true);
    expect(state.user.name).toBe('Test');
    expect(state.role).toBe('PATIENT');
  });
});
