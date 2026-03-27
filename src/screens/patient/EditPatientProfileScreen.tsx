import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    ChevronLeft,
    User,
    Calendar,
    MapPin,
    VenusAndMars,
    Check,
} from 'lucide-react-native';
import { useGetPatientProfileQuery, useUpdatePatientMutation } from '../../services/api';
import { colors } from '../../theme/colors';
import { FieldWrapper, StyledInput } from '../../components/ui/FormField';

const editProfileSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters").max(50),
    lastName: z.string().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format").optional().or(z.literal('')),
    address: z.string().optional(),
});
type EditProfileFormData = z.infer<typeof editProfileSchema>;

export default function EditPatientProfileScreen({ navigation }: any) {
    const user = useSelector((s: any) => s.auth.user);
    const patientId = user?.patientId ?? user?.id;

    const { data, isLoading } = useGetPatientProfileQuery(patientId, { skip: !patientId });
    const patient = data?.data;

    const [updatePatient, { isLoading: isUpdating }] = useUpdatePatientMutation();

    const { control, handleSubmit, formState: { errors } } = useForm<EditProfileFormData>({
        resolver: zodResolver(editProfileSchema),
        defaultValues: {
            firstName: patient?.firstName || patient?.name?.split(' ')[0] || '',
            lastName: patient?.lastName || patient?.name?.split(' ').slice(1).join(' ') || '',
            gender: patient?.gender || 'MALE',
            dateOfBirth: patient?.dateOfBirth || '',
            address: patient?.address || '',
        },
    });

    const onSubmit = async (formData: EditProfileFormData) => {
        try {
            // Clean empty strings for optional fields expecting specific formats
            const payload = { ...formData };
            if (!payload.dateOfBirth) delete payload.dateOfBirth;

            const res = await updatePatient({ patientId, data: payload }).unwrap();

            if (res.success) {
                Alert.alert("Success", "Profile updated successfully!", [
                    { text: "OK", onPress: () => navigation.goBack() }
                ]);
            } else {
                Alert.alert("Error", res.message || "Failed to update profile");
            }
        } catch (err: any) {
            console.error("Update Profile Error:", err);
            Alert.alert("Update Failed", err?.data?.message || err?.error || "A network error occurred.");
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: '#f8fafc' }}
        >
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* Email / Phone Readonly Notice */}
                <View style={{ backgroundColor: '#eff6ff', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe' }}>
                    <Text style={{ color: '#1e40af', fontSize: 13, fontWeight: '500' }}>Email and Phone Number cannot be changed from the app. Please contact support to update them.</Text>
                </View>

                {/* Form Fields */}
                <View style={{ gap: 16 }}>

                    {/* First Name */}
                    <FieldWrapper label="First Name" required error={errors.firstName?.message}>
                        <Controller
                            control={control}
                            name="firstName"
                            render={({ field: { onChange, value } }) => (
                                <StyledInput
                                    icon={<User size={18} color="#94a3b8" />}
                                    hasError={!!errors.firstName}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="John"
                                />
                            )}
                        />
                    </FieldWrapper>

                    {/* Last Name */}
                    <FieldWrapper label="Last Name" error={errors.lastName?.message}>
                        <Controller
                            control={control}
                            name="lastName"
                            render={({ field: { onChange, value } }) => (
                                <StyledInput
                                    icon={<User size={18} color="#94a3b8" />}
                                    hasError={!!errors.lastName}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Doe"
                                />
                            )}
                        />
                    </FieldWrapper>

                    {/* Gender */}
                    <View>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginLeft: 4 }}>Gender</Text>
                        <Controller
                            control={control}
                            name="gender"
                            render={({ field: { onChange, value } }) => (
                                <View style={{ flexDirection: 'row', gap: 10 }}>
                                    {['MALE', 'FEMALE', 'OTHER'].map(g => (
                                        <TouchableOpacity
                                            key={g}
                                            onPress={() => onChange(g)}
                                            style={{
                                                flex: 1,
                                                height: 46,
                                                borderRadius: 12,
                                                borderWidth: 1,
                                                borderColor: value === g ? colors.primary : '#e2e8f0',
                                                backgroundColor: value === g ? `${colors.primary}10` : '#fff',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Text style={{ fontSize: 13, fontWeight: value === g ? '700' : '600', color: value === g ? colors.primary : '#64748b' }}>
                                                {g.charAt(0) + g.slice(1).toLowerCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        />
                    </View>

                    {/* Date of Birth */}
                    <FieldWrapper label="Date of Birth (YYYY-MM-DD)" error={errors.dateOfBirth?.message}>
                        <Controller
                            control={control}
                            name="dateOfBirth"
                            render={({ field: { onChange, value } }) => (
                                <StyledInput
                                    icon={<Calendar size={18} color="#94a3b8" />}
                                    hasError={!!errors.dateOfBirth}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="1990-01-30"
                                />
                            )}
                        />
                    </FieldWrapper>

                    {/* Address */}
                    <FieldWrapper label="Address" error={errors.address?.message}>
                        <Controller
                            control={control}
                            name="address"
                            render={({ field: { onChange, value } }) => (
                                <StyledInput
                                    icon={<MapPin size={18} color="#94a3b8" />}
                                    hasError={!!errors.address}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="123 Main St, City, Country"
                                    multiline
                                />
                            )}
                        />
                    </FieldWrapper>

                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    disabled={isUpdating}
                    style={{
                        backgroundColor: colors.primary,
                        height: 56,
                        borderRadius: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 30,
                        opacity: isUpdating ? 0.7 : 1,
                    }}
                >
                    {isUpdating ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Save Changes</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}
