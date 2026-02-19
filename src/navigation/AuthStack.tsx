import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import LoginScreen from '../screens/auth/LoginScreen';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Placeholder for Splash Screen
const SplashScreen = () => (
  <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark">
    <Text className="text-primary text-2xl font-bold">MediBook</Text>
  </View>
);

// Placeholder for Register Screen
const RegisterScreen = () => (
  <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark">
    <Text className="text-text-primary-light dark:text-text-primary-dark">Register Screen</Text>
  </View>
);

const AuthStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthStack;
