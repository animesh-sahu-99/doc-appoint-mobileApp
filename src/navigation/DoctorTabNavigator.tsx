import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { LayoutDashboard, Calendar, Users, User } from 'lucide-react-native';
import { DoctorTabParamList } from './types';

const Tab = createBottomTabNavigator<DoctorTabParamList>();

// Placeholders
const DashboardScreen = () => <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark"><Text className="text-text-primary-light dark:text-text-primary-dark">Doctor Dashboard</Text></View>;
const ScheduleScreen = () => <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark"><Text className="text-text-primary-light dark:text-text-primary-dark">Schedule</Text></View>;
const PatientsScreen = () => <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark"><Text className="text-text-primary-light dark:text-text-primary-dark">Patients</Text></View>;
const DoctorProfileScreen = () => <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark"><Text className="text-text-primary-light dark:text-text-primary-dark">Profile</Text></View>;

const DoctorTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f0f2f4',
        },
        tabBarActiveTintColor: '#186be7',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen
        name="Patients"
        component={PatientsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
          tabBarLabel: 'Patients',
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
