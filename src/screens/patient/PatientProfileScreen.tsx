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
    User as UserIcon,
    Phone,
    Mail,
    MapPin,
    CalendarDays,
    Activity,
    LogOut,
    ChevronRight,
} from 'lucide-react-native';
import { useGetPatientProfileQuery } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import { colors } from '../../theme/colors';

export default function PatientProfileScreen({ navigation }: any) {
    const user = useSelector((s: any) => s.auth.user);
    const dispatch = useDispatch();
    const patientId: string = user?.patientId ?? user?.id ?? '';

    const { data, isLoading } = useGetPatientProfileQuery(patientId, { skip: !patientId });
    const patient = data?.data ?? user;

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
            icon: <Phone size={18} color={colors.primary} />,
            label: 'Phone Number',
            value: patient?.fullPhoneNumber ?? patient?.phoneNumber ?? '—',
        },
        {
            icon: <Mail size={18} color={colors.primary} />,
            label: 'Email Address',
            value: patient?.email ?? '—',
        },
        {
            icon: <CalendarDays size={18} color={colors.primary} />,
            label: 'Date of Birth',
            value: patient?.dateOfBirth ?? '—',
        },
        {
            icon: <Activity size={18} color={colors.primary} />,
            label: 'Gender',
            value: patient?.gender ? patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase() : '—',
        },
        {
            icon: <MapPin size={18} color={colors.primary} />,
            label: 'Address',
            value: patient?.address ?? '—',
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-background-dark">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 pt-4 pb-2">
                    <Text className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        My Profile
                    </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('EditPatientProfile')}>
                        <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Hero Section */}
                <View className="items-center px-6 pt-6 pb-8">
                    {isLoading ? (
                        <ActivityIndicator size="large" color={colors.primary} />
                    ) : (
                        <>
                            <View
                                className="w-24 h-24 rounded-full items-center justify-center mb-4"
                                style={{ backgroundColor: `${colors.primary}15`, borderWidth: 3, borderColor: `${colors.primary}25` }}
                            >
                                <Text className="text-3xl font-extrabold" style={{ color: colors.primary }}>
                                    {(patient?.fullName ?? patient?.name ?? 'P').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <Text className="text-slate-900 dark:text-white text-2xl font-extrabold text-center">
                                {patient?.fullName ?? patient?.name ?? 'Patient'}
                            </Text>
                            <View className="mt-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                                <Text className="text-sm font-bold text-slate-500 max-w-[250px]" numberOfLines={1}>
                                    ID: {patient?.patientId ?? '—'}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Info Cards */}
                <View className="px-5 mt-2" style={{ gap: 10 }}>
                    <Text className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-2 ml-1">
                        Personal Information
                    </Text>
                    {infoItems.map(({ icon, label, value }) => (
                        <View
                            key={label}
                            className="flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3.5"
                            style={{ gap: 12 }}
                        >
                            <View
                                className="w-10 h-10 rounded-xl items-center justify-center"
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
                <View className="px-5 mt-10">
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="flex-row items-center justify-between bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-4 border border-red-100 dark:border-red-900/30 active:bg-red-100"
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
