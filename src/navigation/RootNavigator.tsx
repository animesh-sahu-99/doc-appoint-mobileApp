import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from './types';
import AuthStack from './AuthStack';
import PatientTabNavigator from './PatientTabNavigator';
import DoctorTabNavigator from './DoctorTabNavigator';
import AppointmentBookingScreen from '../screens/patient/AppointmentBookingScreen';
import PatientDoctorProfileScreen from '../screens/patient/PatientDoctorProfileScreen';
import EditPatientProfileScreen from '../screens/patient/EditPatientProfileScreen';
import DoctorAppointmentDetailsScreen from '../screens/doctor/DoctorAppointmentDetailsScreen';
import EditDoctorProfileScreen from '../screens/doctor/EditDoctorProfileScreen';
import PatientAppointmentDetailsScreen from '../screens/patient/PatientAppointmentDetailsScreen';
import NotificationsScreen from '../screens/common/NotificationsScreen';
import { RootState } from '../store/store';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
            <Stack.Screen name="DoctorProfile" component={PatientDoctorProfileScreen} />
            <Stack.Screen name="EditPatientProfile" component={EditPatientProfileScreen} />
            <Stack.Screen name="DoctorAppointmentDetails" component={DoctorAppointmentDetailsScreen} />
            <Stack.Screen name="EditDoctorProfile" component={EditDoctorProfileScreen} />
            <Stack.Screen name="PatientAppointmentDetails" component={PatientAppointmentDetailsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </Stack.Group>
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
