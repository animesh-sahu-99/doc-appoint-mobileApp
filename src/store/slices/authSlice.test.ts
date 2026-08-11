import reducer, {
  setCredentials,
  tokenRefreshed,
  logout,
  markSessionExpired,
  clearSessionExpired,
} from './authSlice';

const loggedIn = () =>
  reducer(
    undefined,
    setCredentials({
      user: { id: 'DOC-1', name: 'Asha' },
      token: 'access-1',
      refreshToken: 'refresh-1',
      expiresIn: 3600,
      role: 'DOCTOR',
    })
  );

describe('authSlice', () => {
  it('stores both tokens and an absolute expiry on login', () => {
    const state = loggedIn();

    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('access-1');
    expect(state.refreshToken).toBe('refresh-1');
    expect(state.role).toBe('DOCTOR');
    expect(state.sessionExpired).toBe(false);
    expect(state.tokenExpiresAt).toBeGreaterThan(Date.now());
  });

  it('tolerates a backend that does not send refresh fields yet', () => {
    const state = reducer(
      undefined,
      setCredentials({ user: { id: '1' }, token: 'access-1', role: 'PATIENT' })
    );

    expect(state.isAuthenticated).toBe(true);
    expect(state.refreshToken).toBeNull();
    expect(state.tokenExpiresAt).toBeNull();
  });

  it('rotates the tokens without touching user or role', () => {
    const state = reducer(
      loggedIn(),
      tokenRefreshed({ token: 'access-2', refreshToken: 'refresh-2', expiresIn: 3600 })
    );

    expect(state.token).toBe('access-2');
    expect(state.refreshToken).toBe('refresh-2');
    // Regression guard: the refresh response carries ROLE_DOCTOR, but navigation keys off
    // 'DOCTOR'. Writing the server value here would drop a doctor into the patient UI.
    expect(state.role).toBe('DOCTOR');
    expect(state.user.name).toBe('Asha');
  });

  it('keeps the existing refresh token when rotation omits one', () => {
    const state = reducer(loggedIn(), tokenRefreshed({ token: 'access-2' }));

    expect(state.token).toBe('access-2');
    expect(state.refreshToken).toBe('refresh-1');
  });

  it('ignores a refresh that lands after logout', () => {
    const loggedOut = reducer(loggedIn(), logout());
    const state = reducer(loggedOut, tokenRefreshed({ token: 'access-2', refreshToken: 'refresh-2' }));

    // A logout racing an in-flight refresh must not resurrect the session.
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
  });

  it('clears the refresh token on logout', () => {
    const state = reducer(loggedIn(), logout());

    expect(state.refreshToken).toBeNull();
    expect(state.tokenExpiresAt).toBeNull();
    expect(state.sessionExpired).toBe(false);
  });

  it('clears credentials and raises the flag when the session dies', () => {
    const state = reducer(loggedIn(), markSessionExpired());

    expect(state.isAuthenticated).toBe(false);
    expect(state.refreshToken).toBeNull();
    expect(state.sessionExpired).toBe(true);
  });

  it('lowers the flag without disturbing anything else', () => {
    const expired = reducer(loggedIn(), markSessionExpired());
    const state = reducer(expired, clearSessionExpired());

    expect(state.sessionExpired).toBe(false);
    expect(state.isAuthenticated).toBe(false);
  });

  it('clears a stale expiry flag on the next successful login', () => {
    const expired = reducer(loggedIn(), markSessionExpired());
    const state = reducer(
      expired,
      setCredentials({ user: { id: '2' }, token: 't', refreshToken: 'r', expiresIn: 60, role: 'PATIENT' })
    );

    expect(state.sessionExpired).toBe(false);
  });
});
