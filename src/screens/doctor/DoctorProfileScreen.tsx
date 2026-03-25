import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import {
    User,
    Stethoscope,
    GraduationCap,
    Briefcase,
    BadgeDollarSign,
    Phone,
    Mail,
    LogOut,
    ChevronRight,
} from 'lucide-react-native';
import { useGetDoctorProfileQuery } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import { colors } from '../../theme/colors';

export default function DoctorProfileScreen({ navigation }: any) {
    const user = useSelector((s: any) => s.auth.user);
    const dispatch = useDispatch();
    const doctorId: string = user?.doctorId ?? user?.id ?? '';

    const { data, isLoading } = useGetDoctorProfileQuery(doctorId, { skip: !doctorId });
    const doctor = data?.data ?? user;

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: () => dispatch(logout()),
            },
        ]);
    };

    const infoItems = [
        {
            icon: <Stethoscope size={18} color={colors.primary} />,
            label: 'Specialization',
            value: doctor?.specializationDisplayName ?? doctor?.specialization ?? '—',
        },
        {
            icon: <GraduationCap size={18} color={colors.primary} />,
            label: 'Qualification',
            value: doctor?.qualification ?? '—',
        },
        {
            icon: <Briefcase size={18} color={colors.primary} />,
            label: 'Experience',
            value: doctor?.experienceYears ? `${doctor.experienceYears} years` : '—',
        },
        {
            icon: <BadgeDollarSign size={18} color={colors.primary} />,
            label: 'Consultation Fee',
            value: doctor?.consultationFee ? `₹ ${doctor.consultationFee}` : '—',
        },
        {
            icon: <Phone size={18} color={colors.primary} />,
            label: 'Phone',
            value: doctor?.phone ?? '—',
        },
        {
            icon: <Mail size={18} color={colors.primary} />,
            label: 'Email',
            value: doctor?.email ?? '—',
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-background-dark">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Hero Header */}
                <View
                    className="items-center px-6 pt-8 pb-10"
                    style={{
                        backgroundColor: 'white',
                        borderBottomLeftRadius: 32,
                        borderBottomRightRadius: 32,
                    }}
                >
                    {/* Avatar */}
                    {isLoading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <>
                            <View
                                className="w-24 h-24 rounded-full items-center justify-center mb-4"
                                style={{ backgroundColor: `${colors.primary}18`, borderWidth: 3, borderColor: `${colors.primary}30` }}
                            >
                                <User size={40} color={colors.primary} />
                            </View>
                            <Text className="text-slate-900 dark:text-white text-2xl font-extrabold text-center">
                                {doctor?.name ? `Dr. ${doctor.name}` : 'Doctor'}
                            </Text>
                            <View
                                className="mt-2 px-4 py-1.5 rounded-full"
                                style={{ backgroundColor: `${colors.primary}15` }}
                            >
                                <Text className="text-sm font-bold" style={{ color: colors.primary }}>
                                    {doctor?.specializationDisplayName ?? doctor?.specialization ?? 'Specialist'}
                                </Text>
                            </View>
                            {doctor?.about && (
                                <Text className="text-slate-500 dark:text-slate-400 text-sm text-center mt-4 leading-relaxed">
                                    {doctor.about}
                                </Text>
                            )}
                            {/* Edit Profile Button */}
                            <TouchableOpacity
                                onPress={() => navigation.navigate('EditDoctorProfile')}
                                style={{
                                    marginTop: 16,
                                    paddingHorizontal: 24,
                                    paddingVertical: 10,
                                    borderRadius: 20,
                                    borderWidth: 1.5,
                                    borderColor: colors.primary,
                                }}
                            >
                                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Edit Profile</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Info Cards */}
                <View className="px-5 mt-6" style={{ gap: 10 }}>
                    {infoItems.map(({ icon, label, value }) => (
                        <View
                            key={label}
                            className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3.5"
                            style={{ gap: 12 }}
                        >
                            <View
                                className="w-9 h-9 rounded-lg items-center justify-center"
                                style={{ backgroundColor: `${colors.primary}12` }}
                            >
                                {icon}
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-400 text-xs font-medium">{label}</Text>
                                <Text className="text-slate-800 dark:text-slate-100 text-sm font-semibold mt-0.5">
                                    {value}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Logout */}
                <View className="px-5 mt-8">
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="flex-row items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-4 border border-red-100 dark:border-red-900/30"
                    >
                        <View className="flex-row items-center" style={{ gap: 10 }}>
                            <LogOut size={20} color="#ef4444" />
                            <Text className="text-red-500 font-bold text-base">Sign Out</Text>
                        </View>
                        <ChevronRight size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
