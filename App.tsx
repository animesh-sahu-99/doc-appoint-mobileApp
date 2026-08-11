import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';
import { useWebSocket } from './src/hooks/useWebSocket';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { useSessionRefresh } from './src/hooks/useSessionRefresh';
import { clearSessionExpired } from './src/store/slices/authSlice';

const GlobalServices = ({ navRef }: { navRef: React.RefObject<NavigationContainerRef<any>> }) => {
  // Runs first: rotates a token that expired while the app was closed or backgrounded, so the
  // WebSocket below connects with a live one.
  useSessionRefresh();
  useWebSocket();
  usePushNotifications(navRef);
  return null;
};

// Prompts the user after a refresh attempt has genuinely failed. With silent refresh in place
// this should be rare — a dead refresh token, not merely an expired access token.
const SessionGuard = () => {
  const sessionExpired = useSelector((s: any) => s.auth.sessionExpired);
  const dispatch = useDispatch();
  const hasShownAlert = useRef(false);

  useEffect(() => {
    if (sessionExpired && !hasShownAlert.current) {
      hasShownAlert.current = true;
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [{
          text: 'OK',
          onPress: () => {
            hasShownAlert.current = false;
            // markSessionExpired() already cleared the credentials, and RootNavigator has
            // already swapped to the Auth stack reactively — only the flag is left to lower.
            // (The old reset() here targeted 'Login', which is not a root-stack route.)
            dispatch(clearSessionExpired());
          },
        }],
        { cancelable: false }
      );
    }
  }, [sessionExpired, dispatch]);

  return null;
};

export default function App() {
  const navRef = useRef<NavigationContainerRef<any>>(null);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <GlobalServices navRef={navRef} />
          <NavigationContainer ref={navRef}>
            <SessionGuard />
            <RootNavigator />
          </NavigationContainer>
          <Toast />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
