import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { Home, Search, Calendar, User } from 'lucide-react-native';
import { PatientTabParamList } from './types';
import HomeScreen from '../screens/patient/HomeScreen';
import PatientScheduleScreen from '../screens/patient/PatientScheduleScreen';

const Tab = createBottomTabNavigator<PatientTabParamList>();

// Placeholders for other screens
const SearchScreen = () => <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark"><Text className="text-text-primary-light dark:text-text-primary-dark">Search</Text></View>;
const ProfileScreen = () => <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark"><Text className="text-text-primary-light dark:text-text-primary-dark">Profile</Text></View>;

const PatientTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff', // surface-light
          borderTopColor: '#f0f2f4', // text-primary-dark equivalent or similar
          // Need to handle dark mode context here properly in real app, keeping simple for now
        },
        tabBarActiveTintColor: '#186be7', // primary
        tabBarInactiveTintColor: '#94a3b8', // text-secondary-dark
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen
        name="Appointments"
        component={PatientScheduleScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
          tabBarLabel: 'Schedule',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default PatientTabNavigator;
