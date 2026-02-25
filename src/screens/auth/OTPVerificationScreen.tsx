import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { AuthStackParamList } from '../../navigation/types';
import PrimaryButton from '../../components/ui/PrimaryButton';

type OTPRouteProp = RouteProp<AuthStackParamList, 'OTPVerification'>;

const OTPVerificationScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
    const route = useRoute<OTPRouteProp>();
    const phone = route.params?.phone || '+1 (555) 000-0000';

    const [otp, setOtp] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(55);
    const inputRefs = useRef<Array<TextInput | null>>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleOtpChange = (value: string, index: number) => {
        if (value.length > 1) {
            // Handle paste
            const pastedData = value.substring(0, 4).split('');
            const newOtp = [...otp];
            pastedData.forEach((char, i) => {
                if (index + i < 4) newOtp[index + i] = char;
            });
            setOtp(newOtp);
            // Focus last filled or next empty
            const focusIndex = Math.min(index + pastedData.length, 3);
            inputRefs.current[focusIndex]?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto focus next
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerify = () => {
        const code = otp.join('');
        if (code.length < 4) {
            Alert.alert('Incomplete Code', 'Please enter all 4 digits.');
            return;
        }
        setLoading(true);
        // Simulate API call for verify
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', 'Phone verified successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('Login') }
            ]);
        }, 1500);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-background-light dark:bg-background-dark"
        >
            <View className="flex-1 relative overflow-hidden">
                {/* Decorative Background Elements */}
                <View className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
                <View className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

                {/* Top Navigation */}
                <View className="flex-row items-center px-6 py-4 mt-8">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full items-center justify-center shadow-sm"
                    >
                        <ArrowLeft size={24} color="#186be7" />
                    </TouchableOpacity>
                </View>

                {/* Content Area */}
                <View className="flex-1 px-8 pt-4 pb-12 items-center justify-center">

                    {/* Illustration/Icon */}
                    <View className="mb-8 p-6 bg-primary/10 rounded-full">
                        <View className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30">
                            <ShieldCheck size={40} color="white" />
                        </View>
                    </View>

                    {/* Title & Subtitle */}
                    <View className="text-center mb-10 items-center">
                        <Text className="text-slate-900 dark:text-slate-100 text-3xl font-extrabold tracking-tight mb-3">
                            Verify Your Phone
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-base text-center max-w-[280px]">
                            Please enter the 4-digit code sent to{' '}
                            <Text className="text-slate-900 dark:text-slate-100 font-semibold">{phone}</Text>
                        </Text>
                    </View>

                    {/* OTP Input Group */}
                    <View className="flex-row gap-4 mb-10 w-full justify-center">
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => (inputRefs.current[index] = ref)}
                                className={`w-16 h-16 text-center text-2xl font-bold bg-white dark:bg-slate-800 border-2 rounded-2xl text-slate-900 dark:text-slate-100 transition-all ${digit ? 'border-primary' : 'border-transparent'
                                    }`}
                                maxLength={4} // Allow paste up to 4
                                keyboardType="number-pad"
                                value={digit}
                                onChangeText={(value) => handleOtpChange(value, index)}
                                onKeyPress={(e) => handleKeyPress(e, index)}
                                placeholder="-"
                                placeholderTextColor="#9ca3af"
                            />
                        ))}
                    </View>

                    {/* CTA Button */}
                    <PrimaryButton
                        title="Verify"
                        onPress={handleVerify}
                        loading={loading}
                    />

                    {/* Resend Section */}
                    <View className="mt-8 items-center">
                        <Text className="text-slate-500 dark:text-slate-400 text-sm mb-2">Didn't receive the code?</Text>
                        <View className="flex-row items-center justify-center gap-2">
                            <TouchableOpacity
                                disabled={timer > 0}
                                onPress={() => setTimer(55)}
                            >
                                <Text className={`font-bold text-sm ${timer > 0 ? 'text-slate-400' : 'text-primary hover:underline'}`}>
                                    Resend Code
                                </Text>
                            </TouchableOpacity>
                            <Text className="text-slate-300 dark:text-slate-600">|</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium tabular-nums">
                                Resend in 00:{timer.toString().padStart(2, '0')}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default OTPVerificationScreen;
