import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Client } from '@stomp/stompjs';
import * as TextEncoding from 'text-encoding';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { api } from '../services/api';
import Toast from 'react-native-toast-message';

// Make TextEncoder available globally for stompjs in React Native
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoding.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextEncoding.TextDecoder;
}

const WS_URL = 'ws://192.168.5.92:9091/ws-endpoint';

export const useWebSocket = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const clientRef = useRef<Client | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  // Debounce: ignore foreground events within 3s of each other
  const lastForegroundRef = useRef<number>(0);
  // Flag to suppress expected 1006 errors when WE intentionally tear down the old connection
  const isIntentionalDisconnectRef = useRef<boolean>(false);

  // ── Build and activate a fresh STOMP client ─────────────────────────────────
  const connect = useCallback(() => {
    if (!token || !user) return;

    // Tear down any existing connection cleanly before creating a new one
    if (clientRef.current) {
      isIntentionalDisconnectRef.current = true;
      clientRef.current.deactivate();
      clientRef.current = null;
      // Reset the flag after a short delay (longer than STOMP teardown cycle)
      setTimeout(() => { isIntentionalDisconnectRef.current = false; }, 1000);
    }

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => { /* suppress verbose STOMP logs */ },
      // STOMP-level auto-reconnect: retries every 5s if the broker drops mid-session
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('[WS] ✅ Connected — user:', user.id);

      client.subscribe('/user/queue/notifications', (message) => {
        if (!message.body) return;
        try {
          const notification = JSON.parse(message.body);

          Toast.show({
            type: 'success',
            text1: notification.title,
            text2: notification.message,
            position: 'top',
            visibilityTime: 4000,
          });

          dispatch(api.util.invalidateTags(['Notification']));
          dispatch(api.util.invalidateTags(['Appointment']));
        } catch (e) {
          console.error('[WS] Failed to parse message:', e);
        }
      });
    };

    client.onDisconnect = () => {
      console.warn('[WS] ⚠️ Disconnected — STOMP will auto-retry in 5s if token is still valid.');
    };

    client.onStompError = (frame) => {
      console.error('[WS] ❌ STOMP error:', frame.headers['message'], frame.body);
    };

    client.onWebSocketClose = (event) => {
      // Code 1000 = intentional close by us; 1006 = OS killed socket (expected on background)
      if (isIntentionalDisconnectRef.current || event.code === 1000 || event.code === 1006) {
        console.log('[WS] WebSocket closed (expected) — code:', event.code);
      } else {
        console.warn('[WS] 🔌 WebSocket closed unexpectedly — code:', event.code, 'reason:', event.reason || 'unknown');
      }
    };

    client.onWebSocketError = (event) => {
      if (isIntentionalDisconnectRef.current) {
        console.log('[WS] WebSocket error during intentional reconnect (suppressed)');
      } else {
        console.error('[WS] 🚨 WebSocket error:', event);
      }
    };

    client.activate();
    clientRef.current = client;
  }, [token, user, dispatch]);

  // ── AppState listener: re-connect when app comes back to foreground ─────────
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (
        (prev === 'background' || prev === 'inactive') &&
        nextState === 'active'
      ) {
        const now = Date.now();
        if (now - lastForegroundRef.current < 3000) {
          return; // Debounce: ignore duplicate foreground events within 3s
        }
        lastForegroundRef.current = now;
        console.log('[WS] 📱 App foregrounded — forcing WebSocket reconnect.');
        connect();
      }
    });

    return () => subscription.remove();
  }, [connect]);

  // ── Initial connect / disconnect on login/logout ────────────────────────────
  useEffect(() => {
    if (token && user) {
      connect();
    } else {
      // User logged out: tear down the connection
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
        console.log('[WS] 🔒 Disconnected — user logged out.');
      }
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [token, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

