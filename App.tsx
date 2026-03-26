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
import { logout } from './src/store/slices/authSlice';

const GlobalServices = ({ navRef }: { navRef: React.RefObject<NavigationContainerRef<any>> }) => {
  useWebSocket();
  usePushNotifications(navRef);
  return null;
};

// Watches for 401 session expiry and shows an alert, then resets to Login
const SessionGuard = ({ navRef }: { navRef: React.RefObject<NavigationContainerRef<any>> }) => {
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
            dispatch(logout());
            // Navigate to Login — resets the entire navigation stack
            navRef.current?.reset({ index: 0, routes: [{ name: 'Login' as never }] });
          },
        }],
        { cancelable: false }
      );
    }
  }, [sessionExpired, dispatch, navRef]);

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
            <SessionGuard navRef={navRef} />
            <RootNavigator />
          </NavigationContainer>
          <Toast />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
