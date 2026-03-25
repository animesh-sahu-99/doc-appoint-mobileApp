import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Calendar, ClipboardList, User } from 'lucide-react-native';
import { DoctorTabParamList } from './types';

import DoctorDashboardScreen from '../screens/doctor/DoctorDashboardScreen';
import DoctorScheduleScreen from '../screens/doctor/DoctorScheduleScreen';
import DoctorAppointmentsScreen from '../screens/doctor/DoctorAppointmentsScreen';
import DoctorProfileScreen from '../screens/doctor/DoctorProfileScreen';

const Tab = createBottomTabNavigator<DoctorTabParamList>();

const DoctorTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f0f2f4',
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#186be7',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DoctorDashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={DoctorScheduleScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen
        name="Patients"
        component={DoctorAppointmentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
          tabBarLabel: 'Appointments',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DoctorProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default DoctorTabNavigator;
