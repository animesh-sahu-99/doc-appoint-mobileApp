import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { forceTokenRefresh, isAccessTokenStale } from '../services/api';
import { markSessionExpired } from '../store/slices/authSlice';

/**
 * Rotates a stale access token proactively, on cold start and on returning to the foreground.
 *
 * Reacting to 401s alone is not enough, and the reason isn't RTK Query: useWebSocket sends the
 * JWT in the STOMP CONNECT frame, so a rejected socket produces no HTTP 401 the base query can
 * ever see. With a 5s reconnect delay, an expired token means the socket retries forever against
 * a server that keeps refusing it and notifications silently stop arriving — nothing in a purely
 * reactive design heals that. A cold start or a long background hits it every time.
 *
 * Shares the single-flight promise in api.ts, so this can never race a 401-triggered refresh.
 */
export const useSessionRefresh = () => {
  const dispatch = useDispatch();
  const store = useStore();
  const isAuthenticated = useSelector((s: any) => s.auth.isAuthenticated);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const maybeRefresh = useCallback(
    async (reason: string) => {
      const auth = (store.getState() as any).auth;
      if (!auth.isAuthenticated || !auth.refreshToken) {
        return;
      }
      // Cheap restarts cost nothing; only rotate when the token is actually near its deadline.
      if (!isAccessTokenStale(auth)) {
        return;
      }

      console.log(`[AUTH] ⏰ Proactive refresh (${reason}).`);
      const token = await forceTokenRefresh(dispatch, store.getState as () => any);

      if (!token && (store.getState() as any).auth.isAuthenticated) {
        console.warn('[AUTH] 🔒 Proactive refresh failed — session expired.');
        dispatch(markSessionExpired());
      }
    },
    [dispatch, store]
  );

  // Cold start: redux-persist may have rehydrated a token that already died while the app was closed.
  useEffect(() => {
    if (isAuthenticated) {
      maybeRefresh('cold-start');
    }
  }, [isAuthenticated, maybeRefresh]);

  // Foreground: the app may have been backgrounded well past the access-token lifetime.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      const previous = appStateRef.current;
      appStateRef.current = next;
      if ((previous === 'background' || previous === 'inactive') && next === 'active') {
        maybeRefresh('foreground');
      }
    });
    return () => subscription.remove();
  }, [maybeRefresh]);
};
