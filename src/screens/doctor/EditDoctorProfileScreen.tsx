import React from 'react';
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
import { useSelector } from 'react-redux';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    ChevronLeft,
    User,
    GraduationCap,
    Briefcase,
    BadgeDollarSign,
    FileText,
} from 'lucide-react-native';
import { useGetDoctorProfileQuery, useUpdateDoctorMutation } from '../../services/api';
import { colors } from '../../theme/colors';

// ─── Validation Schema ──────────────────────────────────────────────────────
const editDoctorSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(80),
    qualification: z.string().optional(),
    experienceYears: z
        .string()
        .optional()
        .refine((v) => !v || /^\d+$/.test(v), { message: 'Must be a whole number' }),
    consultationFee: z
        .string()
        .optional()
        .refine((v) => !v || /^\d+(\.\d{1,2})?$/.test(v), { message: 'Must be a valid amount' }),
    about: z.string().optional(),
});
type EditDoctorFormData = z.infer<typeof editDoctorSchema>;

// ─── Reusable Field Components ───────────────────────────────────────────────
const FieldWrapper = ({ label, required, children, error }: {
    label: string; required?: boolean; children: React.ReactNode; error?: string;
}) => (
    <View>
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginLeft: 4 }}>
            {label}{required && <Text style={{ color: '#ef4444' }}> *</Text>}
        </Text>
        {children}
        {error && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{error}</Text>}
    </View>
);

const StyledInput = ({
    icon,
    hasError,
    multiline,
    ...rest
}: { icon: React.ReactNode; hasError?: boolean; multiline?: boolean; [key: string]: any }) => (
    <View style={{
        flexDirection: 'row',
        alignItems: multiline ? 'flex-start' : 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: hasError ? '#ef4444' : '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 12,
        ...(multiline ? { paddingTop: 14, minHeight: 100 } : { height: 50 }),
    }}>
        <View style={multiline ? { marginTop: 2 } : {}}>{icon}</View>
        <TextInput
            style={{ flex: 1, marginLeft: 10, fontSize: 15, color: '#0f172a', ...(multiline ? { textAlignVertical: 'top' } : {}) }}
            placeholderTextColor="#94a3b8"
            multiline={multiline}
            {...rest}
        />
    </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function EditDoctorProfileScreen({ navigation }: any) {
    const user = useSelector((s: any) => s.auth.user);
    const doctorId: string = user?.doctorId ?? user?.id ?? '';

    const { data, isLoading } = useGetDoctorProfileQuery(doctorId, { skip: !doctorId });
    const doctor = data?.data ?? null;

    const [updateDoctor, { isLoading: isUpdating }] = useUpdateDoctorMutation();

    const { control, handleSubmit, formState: { errors } } = useForm<EditDoctorFormData>({
        resolver: zodResolver(editDoctorSchema),
        defaultValues: {
            name: doctor?.name || '',
            qualification: doctor?.qualification || '',
            experienceYears: doctor?.experienceYears != null ? String(doctor.experienceYears) : '',
            consultationFee: doctor?.consultationFee != null ? String(doctor.consultationFee) : '',
            about: doctor?.about || '',
        },
    });

    const onSubmit = async (formData: EditDoctorFormData) => {
        try {
            const payload: any = { name: formData.name };
            if (formData.qualification) payload.qualification = formData.qualification;
            if (formData.experienceYears) payload.experienceYears = parseInt(formData.experienceYears, 10);
            if (formData.consultationFee) payload.consultationFee = parseFloat(formData.consultationFee);
            if (formData.about !== undefined) payload.about = formData.about;

            const res = await updateDoctor({ doctorId, data: payload }).unwrap();

            if (res.success) {
                Alert.alert('Success', 'Profile updated successfully!', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Error', res.message || 'Failed to update profile.');
            }
        } catch (err: any) {
            Alert.alert('Update Failed', err?.data?.message || 'A network error occurred.');
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
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 16, paddingVertical: 12,
                backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>

                {/* Readonly notice */}
                <View style={{ backgroundColor: '#eff6ff', padding: 12, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#bfdbfe' }}>
                    <Text style={{ color: '#1e40af', fontSize: 13, fontWeight: '500' }}>
                        Email, phone, and specialization cannot be changed here. Contact support if needed.
                    </Text>
                </View>

                <View style={{ gap: 16 }}>

                    {/* Name */}
                    <FieldWrapper label="Full Name" required error={errors.name?.message}>
                        <Controller
                            control={control}
                            name="name"
                            render={({ field: { onChange, value } }) => (
                                <StyledInput
                                    icon={<User size={18} color="#94a3b8" />}
                                    hasError={!!errors.name}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="Dr. Jane Smith"
                                />
                            )}
                        />
                    </FieldWrapper>

                    {/* Qualification */}
                    <FieldWrapper label="Qualification" error={errors.qualification?.message}>
                        <Controller
                            control={control}
                            name="qualification"
                            render={({ field: { onChange, value } }) => (
                                <StyledInput
                                    icon={<GraduationCap size={18} color="#94a3b8" />}
                                    hasError={!!errors.qualification}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="e.g. MBBS, MD"
                                />
                            )}
                        />
                    </FieldWrapper>

                    {/* Experience */}
                    <FieldWrapper label="Experience (years)" error={errors.experienceYears?.message}>
                        <Controller
                            control={control}
                            name="experienceYears"
                            render={({ field: { onChange, value } }) => (
                                <StyledInput
                                    icon={<Briefcase size={18} color="#94a3b8" />}
                                    hasError={!!errors.experienceYears}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="e.g. 10"
                                    keyboardType="numeric"
                                />
                            )}
                        />
                    </FieldWrapper>

                    {/* Consultation Fee */}
                    <FieldWrapper label="Consultation Fee (₹)" error={errors.consultationFee?.message}>
                        <Controller
                            control={control}
                            name="consultationFee"
                            render={({ field: { onChange, value } }) => (
                                <StyledInput
                                    icon={<BadgeDollarSign size={18} color="#94a3b8" />}
                                    hasError={!!errors.consultationFee}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="e.g. 500"
                                    keyboardType="decimal-pad"
                                />
                            )}
                        />
                    </FieldWrapper>

                    {/* About */}
                    <FieldWrapper label="About / Bio" error={errors.about?.message}>
                        <Controller
                            control={control}
                            name="about"
                            render={({ field: { onChange, value } }) => (
                                <StyledInput
                                    icon={<FileText size={18} color="#94a3b8" />}
                                    hasError={!!errors.about}
                                    value={value}
                                    onChangeText={onChange}
                                    placeholder="A short bio about yourself and your expertise..."
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
                        marginTop: 32,
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
