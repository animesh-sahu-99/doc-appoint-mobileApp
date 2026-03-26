import { useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { useSelector } from 'react-redux';
import { NavigationContainerRef } from '@react-navigation/native';
import { useRegisterDeviceTokenMutation } from '../services/api';
import Toast from 'react-native-toast-message';

type NavRef = React.RefObject<NavigationContainerRef<any>>;

/**
 * Navigates to the appropriate appointment detail screen based on the
 * FCM notification data payload (type + relatedEntityId) and the user's role.
 */
const handleNotificationNavigation = (
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  navRef: NavRef,
  role: string | null
) => {
  const appointmentId = remoteMessage?.data?.relatedEntityId as string | undefined;
  if (!appointmentId || !navRef.current) return;

  console.log('[FCM] 🔔 Notification tapped — appointmentId:', appointmentId, '| role:', role);

  if (role === 'DOCTOR') {
    navRef.current.navigate('DoctorAppointmentDetails' as never, { appointment: { id: appointmentId } } as never);
  } else {
    navRef.current.navigate('PatientAppointmentDetails' as never, { appointment: { id: appointmentId } } as never);
  }
};

/**
 * Custom hook to abstract the Firebase Cloud Messaging logic.
 * Accepts a navRef so it can deep-link to the relevant appointment on tap.
 */
export const usePushNotifications = (navRef?: NavRef) => {
  const user = useSelector((state: any) => state.auth.user);
  const role = useSelector((state: any) => state.auth.role);
  const [registerDeviceToken] = useRegisterDeviceTokenMutation();

  useEffect(() => {
    if (!user) return;

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

    // ── Token refresh ─────────────────────────────────────────────────────────
    const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
      try {
        await registerDeviceToken({ fcmToken: token, deviceType }).unwrap();
      } catch (err) {
        console.error('Failed to refresh FCM token with backend', err);
      }
    });

    // ── Foreground: app is OPEN — show Toast (Android won't show system notif) ─
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('[FCM] Foreground message received:', remoteMessage);
      if (remoteMessage.notification) {
        Toast.show({
          type: 'info',
          text1: remoteMessage.notification.title,
          text2: remoteMessage.notification.body,
          visibilityTime: 4000,
          position: 'top',
          onPress: () => {
            // Tapping the in-app Toast also navigates
            if (navRef) handleNotificationNavigation(remoteMessage, navRef, role);
          },
        });
      }
    });

    // ── Background: app is OPEN in background, user taps the OS notification ──
    const unsubscribeBackground = messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('[FCM] Background notification tapped:', remoteMessage);
      if (navRef) handleNotificationNavigation(remoteMessage, navRef, role);
    });

    // ── Quit state: app was KILLED, user taps notification to open it ─────────
    messaging().getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('[FCM] App opened from quit state via notification:', remoteMessage);
        // Small delay to let the navigator fully mount before trying to navigate
        setTimeout(() => {
          if (navRef) handleNotificationNavigation(remoteMessage, navRef, role);
        }, 1000);
      }
    });

    requestUserPermission();

    return () => {
      unsubscribeTokenRefresh();
      unsubscribeForeground();
      unsubscribeBackground();
    };
  }, [user, role, navRef, registerDeviceToken]);
};

