import { useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import { api, useLogoutSessionMutation } from '../services/api';
import { logout } from '../store/slices/authSlice';
import { persistor } from '../store/store';

/**
 * Ends the session properly: revokes the refresh token server-side, then clears every trace of
 * it locally.
 *
 * Lives in a hook rather than inside api.ts on purpose — api.ts importing `persistor` from
 * store.ts would close the cycle store → api → store, which Metro resolves to `undefined` at
 * module-eval time.
 */
export const useLogout = () => {
  const dispatch = useDispatch();
  const store = useStore();
  const [logoutSession] = useLogoutSessionMutation();

  return useCallback(
    async (allDevices = false) => {
      const refreshToken = (store.getState() as any).auth.refreshToken;

      if (refreshToken) {
        try {
          await logoutSession({ refreshToken, allDevices }).unwrap();
          console.log('[AUTH] 🚪 Refresh token revoked server-side.');
        } catch (e) {
          // Offline, or the server is down. Never block logout on the network — the user asked
          // to leave, so clear locally regardless; the token expires server-side anyway.
          console.warn('[AUTH] ⚠️ Server-side logout failed — clearing locally anyway.', e);
        }
      }

      // Clear state BEFORE purging, so if the app is killed in between, what redux-persist has
      // already written is the emptied slice rather than a live token.
      dispatch(logout());
      dispatch(api.util.resetApiState());
      try {
        await persistor.purge();
      } catch (e) {
        console.warn('[AUTH] ⚠️ persistor.purge() failed', e);
      }
    },
    [dispatch, store, logoutSession]
  );
};
