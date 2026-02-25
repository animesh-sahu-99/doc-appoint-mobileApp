import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { User, Stethoscope, Mail, Lock, Eye, EyeOff, ArrowRight, Activity } from 'lucide-react-native';
import { loginSchema, LoginFormData } from '../../utils/validation';
import { setCredentials, UserRole } from '../../store/slices/authSlice';
import { storage } from '../../utils/storage';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useDoctorLoginMutation, usePatientLoginMutation } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';

const LoginScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [role, setUserRole] = useState<UserRole>('PATIENT');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [patientLogin] = usePatientLoginMutation();
  const [doctorLogin] = useDoctorLoginMutation();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      let response;
      if (role === 'DOCTOR') {
        response = await doctorLogin(data).unwrap();
      } else {
        response = await patientLogin(data).unwrap();
      }

      console.log('Login Response:', response);

      if (response && response.success && response.data) {
        const { token, userId, email, name } = response.data;

        await storage.setToken(token);

        // Build a normalized user object from the flat AuthResponse fields.
        // doctorId / patientId both map to userId coming from the backend.
        const userObj = {
          id: userId,
          doctorId: role === 'DOCTOR' ? userId : undefined,
          patientId: role === 'PATIENT' ? userId : undefined,
          email,
          name,
        };

        dispatch(setCredentials({
          user: userObj,
          token: token,
          role: role,
        }));
      } else {
        Alert.alert('Login Failed', response?.message || 'Unexpected error occurred.');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      Alert.alert('Login Failed', error?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background-light dark:bg-background-dark"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center p-6">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Activity size={40} color="#186be7" />
            </View>
            <Text className="text-gray-900 dark:text-white text-[28px] font-bold text-center">
              Welcome to MediBook
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 text-base mt-2 text-center">
              Your health journey starts here.
            </Text>
          </View>

          {/* Role Toggle */}
          <View className="flex-row bg-gray-100 dark:bg-gray-800 p-1 rounded-full mb-8 h-14 relative">
            <TouchableOpacity
              onPress={() => setUserRole('PATIENT')}
              className={twMerge(
                'flex-1 flex-row items-center justify-center rounded-full transition-all',
                role === 'PATIENT' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              )}
            >
              <User size={20} color={role === 'PATIENT' ? '#186be7' : '#94a3b8'} />
              <Text className={twMerge(
                'ml-2 font-semibold text-sm',
                role === 'PATIENT' ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'
              )}>
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setUserRole('DOCTOR')}
              className={twMerge(
                'flex-1 flex-row items-center justify-center rounded-full transition-all',
                role === 'DOCTOR' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''
              )}
            >
              <Stethoscope size={20} color={role === 'DOCTOR' ? '#186be7' : '#94a3b8'} />
              <Text className={twMerge(
                'ml-2 font-semibold text-sm',
                role === 'DOCTOR' ? 'text-primary dark:text-white' : 'text-gray-500 dark:text-gray-400'
              )}>
                Doctor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View className="gap-5">
            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-1 mb-2">
                Email Address
              </Text>
              <View className="relative">
                <View className="absolute top-0 bottom-0 left-0 pl-4 justify-center pointer-events-none z-10 h-14">
                  <Mail size={20} color="#9ca3af" />
                </View>
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={twMerge(
                        "w-full h-14 pl-12 pr-4 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full border focus:bg-white dark:focus:bg-gray-900 transition-all",
                        errors.email ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-primary"
                      )}
                      placeholder="Enter your email"
                      placeholderTextColor="#9ca3af"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  )}
                />
              </View>
              {errors.email && (
                <Text className="text-red-500 text-xs ml-4 mt-1">{errors.email.message}</Text>
              )}
            </View>

            {/* Password */}
            <View>
              <Text className="text-sm font-medium text-gray-900 dark:text-gray-100 ml-1 mb-2">
                Password
              </Text>
              <View className="relative">
                <View className="absolute top-0 bottom-0 left-0 pl-4 justify-center pointer-events-none z-10 h-14">
                  <Lock size={20} color="#9ca3af" />
                </View>
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={twMerge(
                        "w-full h-14 pl-12 pr-12 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full border focus:bg-white dark:focus:bg-gray-900 transition-all",
                        errors.password ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-primary"
                      )}
                      placeholder="Enter your password"
                      placeholderTextColor="#9ca3af"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showPassword}
                    />
                  )}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute top-0 bottom-0 right-0 pr-4 justify-center h-14"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#9ca3af" />
                  ) : (
                    <Eye size={20} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text className="text-red-500 text-xs ml-4 mt-1">{errors.password.message}</Text>
              )}
            </View>

            {/* Forgot Password */}
            <View className="flex-row justify-end">
              <TouchableOpacity>
                <Text className="text-sm font-medium text-primary">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <PrimaryButton
              title="Log In"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              icon={<ArrowRight size={20} color="white" />}
              iconPosition="right"
            />
          </View>

          {/* Divider */}
          <View className="flex-row items-center gap-4 py-8">
            <View className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
            <Text className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Or continue with
            </Text>
            <View className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
          </View>

          {/* Social Login - Placeholder */}
          <View className="pb-6">
            <TouchableOpacity className="w-full h-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex-row items-center justify-center gap-3 active:bg-gray-50">
              <Text className="text-gray-700 dark:text-gray-200 font-semibold text-base">
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          <View className="items-center mb-8">
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              New to MediBook?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text className="font-bold text-primary mt-1">Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;
