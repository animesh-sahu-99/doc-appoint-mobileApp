import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import * as TextEncoding from 'text-encoding';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { api } from '../services/api'; // Adjust path if needed
import Toast from 'react-native-toast-message';

// Make TextEncoder available globally for stompjs in React Native
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoding.TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextEncoding.TextDecoder;
}

const WS_URL = 'ws://192.168.5.91:9091/ws-endpoint';

export const useWebSocket = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    // Only connect if user is logged in
    if (!token || !user) {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: function (str) {
        // console.log('[STOMP] ' + str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = function (frame) {
      console.log('[STOMP] Connected gracefully for user: ' + user.id);
      
      // Subscribe to exactly the user's notification queue
      client.subscribe('/user/queue/notifications', (message) => {
        if (message.body) {
          try {
            const notification = JSON.parse(message.body);
            
            // 1. Show Toast
            Toast.show({
              type: 'success', // Could change based on notification.type
              text1: notification.title,
              text2: notification.message,
              position: 'top',
              visibilityTime: 4000,
            });

            // 2. Refresh RTK Query notification cache (updates Bell icon badge)
            dispatch(api.util.invalidateTags(['Notification']));
            
            // 3. Optional: Invalidate appointment cache so schedule screens refresh automatically
            dispatch(api.util.invalidateTags(['Appointment']));

          } catch (e) {
            console.error('Failed to parse STOMP message:', e);
          }
        }
      });
    };

    client.onStompError = function (frame) {
      console.error('[STOMP] Broker reported error: ' + frame.headers['message']);
      console.error('[STOMP] Additional details: ' + frame.body);
    };

    client.activate();
    clientRef.current = client;

    // Cleanup on unmount or logout
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
    };
  }, [token, user?.id, dispatch]);

  return null; // This is a logic-only hook
};
