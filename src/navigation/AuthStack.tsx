import React, { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Splash Screen with auto-navigation to Login
const SplashScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View className="flex-1 justify-center items-center bg-white dark:bg-background-dark">
            <Text className="text-primary text-2xl font-bold">MediBook</Text>
        </View>
    );
};

const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
        </Stack.Navigator>
    );
};

export default AuthStack;
