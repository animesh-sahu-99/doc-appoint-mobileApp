import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from './types';
import AuthStack from './AuthStack';
import PatientTabNavigator from './PatientTabNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import AppointmentBookingScreen from '../screens/patient/AppointmentBookingScreen';
import { RootState } from '../store/store';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

const DoctorProfileModal = () => (
  <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark">
    <Text className="text-text-primary-light dark:text-text-primary-dark">Doctor Profile Modal</Text>
  </View>
);

const RootNavigator = () => {
  const { isAuthenticated, role } = useSelector((state: RootState) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          {role === 'DOCTOR' ? (
            <Stack.Screen name="DoctorTabs" component={DoctorTabNavigator} />
          ) : (
            <Stack.Screen name="PatientTabs" component={PatientTabNavigator} />
          )}
          <Stack.Group screenOptions={{ presentation: 'modal' }}>
            <Stack.Screen name="BookingModal" component={AppointmentBookingScreen} />
            <Stack.Screen name="DoctorProfile" component={DoctorProfileModal} />
          </Stack.Group>
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
