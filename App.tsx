import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store/store';
import RootNavigator from './src/navigation/RootNavigator';
import Toast from 'react-native-toast-message';
import { useWebSocket } from './src/hooks/useWebSocket';
import { usePushNotifications } from './src/hooks/usePushNotifications';

const GlobalServices = () => {
  useWebSocket();
  usePushNotifications();
  return null;
};

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <GlobalServices />
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <Toast />
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}
