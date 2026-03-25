import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { useSelector } from 'react-redux';
import { useRegisterDeviceTokenMutation } from '../services/api';
import Toast from 'react-native-toast-message';

/**
 * Custom hook to abstract the Firebase Cloud Messaging logic.
 * Call this hook inside a protected root component (e.g. App.tsx or a layout after auth).
 */
export const usePushNotifications = () => {
  const user = useSelector((state: any) => state.auth.user);
  const [registerDeviceToken] = useRegisterDeviceTokenMutation();

  useEffect(() => {
    if (!user) return; // Only request / sink tokens if user is logged in

    const requestUserPermission = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.warn('POST_NOTIFICATIONS permission denied by user.');
          return;
        }
      }

      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Firebase Push Notification permission granted.');
        getFcmToken();
      }
    };

    const getFcmToken = async () => {
      try {
        const token = await messaging().getToken();
        if (token) {
          const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
          console.log(`FCM Token retrieved for ${deviceType}:`, token);
          
          await registerDeviceToken({ fcmToken: token, deviceType }).unwrap();
          console.log('Successfully registered FCM token with backend.');
        }
      } catch (error) {
        console.error('Failed to get or register FCM token:', error);
      }
    };

    // Listen to token refreshes automatically
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
      try {
        await registerDeviceToken({ fcmToken: token, deviceType }).unwrap();
      } catch (err) {
        console.error('Failed to refresh FCM token with backend', err);
      }
    });

    // Handle Foreground Messages (when the app is actively OPEN)
    // Android OS does NOT show system drawer notifications when the app is open!
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('FCM Message received in the foreground!', remoteMessage);
      if (remoteMessage.notification) {
        Toast.show({
          type: 'info',
          text1: remoteMessage.notification.title,
          text2: remoteMessage.notification.body,
          visibilityTime: 4000,
          position: 'top',
        });
      }
    });

    requestUserPermission();

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
    };
  }, [user, registerDeviceToken]);
};
