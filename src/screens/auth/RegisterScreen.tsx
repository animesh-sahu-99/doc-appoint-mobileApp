/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';
import { User, Stethoscope, Mail, Lock, Eye, EyeOff, Activity, ArrowLeft, ChevronDown, Phone } from 'lucide-react-native';
import { patientRegisterSchema, doctorRegisterSchema, PatientRegisterFormData, DoctorRegisterFormData } from '../../utils/validation';
import { setCredentials, UserRole } from '../../store/slices/authSlice';
import { storage } from '../../utils/storage';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { twMerge } from 'tailwind-merge';
import { useDoctorRegisterMutation, usePatientRegisterMutation } from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';

const countryCodes = ['+1', '+44', '+91', '+61'];

const RegisterScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
    const [role, setUserRole] = useState<UserRole>('PATIENT');

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background-light dark:bg-background-dark"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                {/* Top Navigation */}
                <View className="flex-row items-center px-6 py-4 mt-8">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full items-center justify-center shadow-sm"
                    >
                        <ArrowLeft size={20} color="#186be7" />
                    </TouchableOpacity>
                </View>

                <View className="flex-1 px-6 pb-6">
                    {/* Header */}
                    <View className="items-center mb-6">
                        <View className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                            <Activity size={32} color="#186be7" />
                        </View>
                        <Text className="text-gray-900 dark:text-white text-[28px] font-bold text-center tracking-tight">
                            {role === 'PATIENT' ? 'Join MediBook' : 'Join as a Provider'}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center px-4">
                            {role === 'PATIENT' ? 'Start your journey to better health' : 'Provide your credentials to start managing your practice.'}
                        </Text>
                    </View>

                    {/* Role Toggle */}
                    <View className="flex-row bg-gray-100 dark:bg-slate-800 p-1 rounded-full mb-8 h-12 relative shadow-sm">
                        <TouchableOpacity
                            onPress={() => setUserRole('PATIENT')}
                            className={twMerge(
                                'flex-1 flex-row items-center justify-center rounded-full transition-all',
                                role === 'PATIENT' ? 'bg-primary shadow-md' : ''
                            )}
                        >
                            <Text className={twMerge(
                                'font-semibold text-sm',
                                role === 'PATIENT' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                            )}>
                                Patient
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setUserRole('DOCTOR')}
                            className={twMerge(
                                'flex-1 flex-row items-center justify-center rounded-full transition-all',
                                role === 'DOCTOR' ? 'bg-primary shadow-md' : ''
                            )}
                        >
                            <Text className={twMerge(
                                'font-semibold text-sm',
                                role === 'DOCTOR' ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                            )}>
                                Doctor
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Forms */}
                    <View className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                        {role === 'PATIENT' ? <PatientForm /> : <DoctorForm />}

                        {/* Login Link */}
                        <View className="pt-6 items-center flex-row justify-center">
                            <Text className="text-sm text-slate-500 dark:text-slate-400">
                                Already have an account?{' '}
                            </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text className="text-primary font-bold text-sm">Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const PatientForm = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [patientRegister] = usePatientRegisterMutation();

    const { control, handleSubmit, formState: { errors } } = useForm<PatientRegisterFormData>({
        resolver: zodResolver(patientRegisterSchema),
        defaultValues: { name: '', countryCode: '+1', phoneNumber: '', email: '', password: '', confirmPassword: '' },
    });

    const onSubmit = async (data: PatientRegisterFormData) => {
        setLoading(true);
        try {
            console.log('data: ');
            console.log(data);
            const response = await patientRegister(data).unwrap();
            if (response && response.success && response.data) {
                Alert.alert('Success', 'Patient account created successfully!');
                navigation.navigate('Login');
            } else {
                Alert.alert('Registration Failed', response?.message || 'Unexpected error occurred.');
            }
        } catch (error: any) {
            console.error('Register Error:', error);
            Alert.alert('Registration Failed', error?.data?.message || 'Could not create account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="gap-4">
            <InputField control={control} name="name" label="Full Name" icon={<User size={20} color="#9ca3af" />} placeholder="John Doe" error={errors.name?.message} />
            <PhoneInputField control={control} countryCodeName="countryCode" phoneNumberName="phoneNumber" label="Phone Number" placeholder="(555) 000-0000" error={errors.phoneNumber?.message} />
            <InputField control={control} name="email" label="Email Address" icon={<Mail size={20} color="#9ca3af" />} placeholder="example@email.com" error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
            <PasswordField control={control} name="password" label="Password" icon={<Lock size={20} color="#9ca3af" />} placeholder="Create a password" error={errors.password?.message} showPassword={showPassword} setShowPassword={setShowPassword} />
            <PasswordField control={control} name="confirmPassword" label="Confirm Password" icon={<Lock size={20} color="#9ca3af" />} placeholder="Repeat your password" error={errors.confirmPassword?.message} showPassword={showPassword} setShowPassword={setShowPassword} />
            <View className="pt-2">
                <PrimaryButton title="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} />
            </View>
        </View>
    );
};

const DoctorForm = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [doctorRegister] = useDoctorRegisterMutation();

    const { control, handleSubmit, formState: { errors } } = useForm<DoctorRegisterFormData>({
        resolver: zodResolver(doctorRegisterSchema),
        defaultValues: { name: '', countryCode: '+1', phoneNumber: '', licenseNumber: '', specialization: 'General Practice', email: '', password: '' },
    });

    const onSubmit = async (data: DoctorRegisterFormData) => {
        setLoading(true);
        try {
            const response = await doctorRegister(data).unwrap();
            if (response && response.success && response.data) {
                Alert.alert('Success', 'Doctor account created successfully!');
                navigation.navigate('Login');
            } else {
                Alert.alert('Registration Failed', response?.message || 'Unexpected error occurred.');
            }
        } catch (error: any) {
            console.error('Register Error:', error);
            Alert.alert('Registration Failed', error?.data?.message || 'Could not create account.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="gap-4">
            <InputField control={control} name="name" label="Full Name" icon={<User size={20} color="#9ca3af" />} placeholder="Dr. Jane Smith" error={errors.name?.message} />
            <PhoneInputField control={control} countryCodeName="countryCode" phoneNumberName="phoneNumber" label="Phone Number" placeholder="(555) 000-0000" error={errors.phoneNumber?.message} />
            <InputField control={control} name="licenseNumber" label="Medical License Number" icon={<Stethoscope size={20} color="#9ca3af" />} placeholder="MD-12345678" error={errors.licenseNumber?.message} autoCapitalize="characters" />

            {/* Basic Specialization Input (In a real app this would be a bottom sheet or standard Picker) */}
            <InputField control={control} name="specialization" label="Specialization" icon={<Stethoscope size={20} color="#9ca3af" />} placeholder="e.g. Cardiology" error={errors.specialization?.message} />

            <InputField control={control} name="email" label="Email Address" icon={<Mail size={20} color="#9ca3af" />} placeholder="doctor@medibook.com" error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
            <PasswordField control={control} name="password" label="Password" icon={<Lock size={20} color="#9ca3af" />} placeholder="Create a password" error={errors.password?.message} showPassword={showPassword} setShowPassword={setShowPassword} />
            <View className="pt-2">
                <PrimaryButton title="Create Account" onPress={handleSubmit(onSubmit)} loading={loading} />
            </View>
        </View>
    );
};

// Reusable Input Components
const InputField = ({ control, name, label, icon, placeholder, error, ...props }: any) => (
    <View>
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">{label}</Text>
        <View className="relative">
            <View className="absolute top-0 bottom-0 left-0 pl-4 justify-center pointer-events-none z-10 h-14">
                {icon}
            </View>
            <Controller
                control={control}
                name={name}
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        className={twMerge(
                            "w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full border focus:bg-white dark:focus:bg-slate-900 transition-all",
                            error ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-primary"
                        )}
                        placeholder={placeholder}
                        placeholderTextColor="#9ca3af"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        {...props}
                    />
                )}
            />
        </View>
        {error && <Text className="text-red-500 text-xs ml-4 mt-1">{error}</Text>}
    </View>
);

const PasswordField = ({ control, name, label, icon, placeholder, error, showPassword, setShowPassword }: any) => (
    <View>
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">{label}</Text>
        <View className="relative">
            <View className="absolute top-0 bottom-0 left-0 pl-4 justify-center pointer-events-none z-10 h-14">
                {icon}
            </View>
            <Controller
                control={control}
                name={name}
                render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                        className={twMerge(
                            "w-full h-14 pl-12 pr-12 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full border focus:bg-white dark:focus:bg-slate-900 transition-all",
                            error ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-primary"
                        )}
                        placeholder={placeholder}
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
                {showPassword ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
            </TouchableOpacity>
        </View>
        {error && <Text className="text-red-500 text-xs ml-4 mt-1">{error}</Text>}
    </View>
);

const PhoneInputField = ({ control, countryCodeName, phoneNumberName, label, placeholder, error, ...props }: any) => {
    const [showPicker, setShowPicker] = useState(false);

    return (
        <View>
            <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 ml-1">{label}</Text>
            <View className="relative flex-row items-center">
                {/* Country Code Selector */}
                <Controller
                    control={control}
                    name={countryCodeName}
                    render={({ field: { onChange: onCountryCodeChange, value: countryCodeValue } }) => (
                        <>
                            <TouchableOpacity
                                onPress={() => setShowPicker(true)}
                                className="absolute left-4 z-20 flex-row items-center gap-1 border-r border-slate-200 dark:border-slate-700 pr-2 h-8"
                            >
                                <Phone size={18} color="#9ca3af" />
                                <Text className="text-slate-700 dark:text-slate-200 text-sm font-medium ml-1">
                                    {countryCodeValue}
                                </Text>
                            </TouchableOpacity>

                            <Modal visible={showPicker} transparent={true} animationType="slide">
                                <TouchableOpacity
                                    className="flex-1 justify-end bg-black/50"
                                    activeOpacity={1}
                                    onPress={() => setShowPicker(false)}
                                >
                                    <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 pb-12">
                                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Select Country Code</Text>
                                        {countryCodes.map(code => (
                                            <TouchableOpacity
                                                key={code}
                                                className="py-4 border-b border-slate-100 dark:border-slate-800"
                                                onPress={() => {
                                                    onCountryCodeChange(code);
                                                    setShowPicker(false);
                                                }}
                                            >
                                                <Text className="text-base text-slate-700 dark:text-slate-300 font-medium">{code}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </TouchableOpacity>
                            </Modal>
                        </>
                    )}
                />

                <Controller
                    control={control}
                    name={phoneNumberName}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <TextInput
                            className={twMerge(
                                "w-full h-14 pl-[90px] pr-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-full border focus:bg-white dark:focus:bg-slate-900 transition-all",
                                error ? "border-red-500 focus:border-red-500" : "border-transparent focus:border-primary"
                            )}
                            placeholder={placeholder}
                            placeholderTextColor="#9ca3af"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            keyboardType="phone-pad"
                            {...props}
                        />
                    )}
                />
            </View>
            {error && <Text className="text-red-500 text-xs ml-4 mt-1">{error}</Text>}

        </View>
    );
};

export default RegisterScreen;
