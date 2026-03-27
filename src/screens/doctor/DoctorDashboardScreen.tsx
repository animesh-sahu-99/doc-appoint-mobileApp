import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, CalendarDays, CheckCircle2, ClipboardList } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import {
    useGetDoctorAppointmentsByDateQuery,
    useGetUpcomingDoctorAppointmentsQuery,
    useGetAllSlotsByDateQuery,
    useConfirmAppointmentMutation,
    useCompleteAppointmentMutation,
    useCancelAppointmentMutation,
    useNoShowAppointmentMutation,
    useGetUnreadNotificationCountQuery,
} from '../../services/api';
import { colors } from '../../theme/colors';
import { STATUS_CONFIG } from '../../utils/appointmentStatus';
import { todayStr } from '../../utils/formatters';

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};


const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

export default function DoctorDashboardScreen({ navigation }: any) {
    const user = useSelector((s: any) => s.auth.user);
    const doctorId: string = user?.doctorId ?? user?.id ?? '';

    const today = todayStr();

    const {
        data: todayApptData,
        isLoading: loadingToday,
        refetch: refetchToday,
    } = useGetDoctorAppointmentsByDateQuery({ doctorId, date: today }, { skip: !doctorId });

    const {
        data: upcomingData,
        isLoading: loadingUpcoming,
        refetch: refetchUpcoming,
    } = useGetUpcomingDoctorAppointmentsQuery(doctorId, { skip: !doctorId });

    const {
        data: slotsData,
        refetch: refetchSlots,
    } = useGetAllSlotsByDateQuery({ doctorId, date: today }, { skip: !doctorId });

    const [confirmAppt] = useConfirmAppointmentMutation();
    const [completeAppt] = useCompleteAppointmentMutation();
    const [cancelAppt] = useCancelAppointmentMutation();
    const [noShowAppt] = useNoShowAppointmentMutation();
    const [refreshing, setRefreshing] = useState(false);

    const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined);
    const unreadCount = unreadData?.data?.count ?? 0;

    const todayAppointments: any[] = todayApptData?.data ?? [];
    const upcomingAppointments: any[] = upcomingData?.data ?? [];
    const slots: any[] = slotsData?.data ?? [];
    const openSlots = slots.filter((s: any) => s.isAvailable).length;

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchToday(), refetchUpcoming(), refetchSlots()]);
        setRefreshing(false);
    };

    const handleAction = async (
        action: 'confirm' | 'complete' | 'cancel' | 'noShow',
        appointmentId: string
    ) => {
        try {
            if (action === 'confirm') await confirmAppt(appointmentId).unwrap();
            else if (action === 'complete') await completeAppt(appointmentId).unwrap();
            else if (action === 'cancel') await cancelAppt(appointmentId).unwrap();
            else await noShowAppt(appointmentId).unwrap();
        } catch {
            Alert.alert('Error', 'Action failed. Please try again.');
        }
    };

    const isLoading = loadingToday || loadingUpcoming;

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-background-dark">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-4 pb-3">
                <View>
                    <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {getGreeting()}
                    </Text>
                    <Text className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {user?.name ? `Dr. ${user.name}` : 'Doctor Dashboard'}
                    </Text>
                </View>
                <TouchableOpacity 
                    onPress={() => navigation.navigate('Notifications')}
                    className="relative w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center"
                >
                    <Bell size={20} color="#64748b" />
                    {unreadCount > 0 && (
                        <View 
                            style={{ 
                                position: 'absolute', 
                                top: 8, 
                                right: 10, 
                                width: 10, 
                                height: 10, 
                                borderRadius: 5, 
                                backgroundColor: '#ef4444', 
                                borderWidth: 2, 
                                borderColor: '#f1f5f9' 
                            }} 
                        />
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Metric Cards */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}
                    className="py-2"
                >
                    {/* Today */}
                    <View
                        className="rounded-2xl p-5 shadow-lg"
                        style={{ backgroundColor: colors.primary, minWidth: 140 }}
                    >
                        <CalendarDays size={20} color="rgba(255,255,255,0.8)" />
                        <Text className="text-white/80 text-sm font-medium mt-3">Today</Text>
                        <Text className="text-white text-3xl font-bold">
                            {isLoading ? '–' : todayAppointments.length}
                        </Text>
                    </View>

                    {/* Upcoming */}
                    <View
                        className="rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
                        style={{ minWidth: 140 }}
                    >
                        <ClipboardList size={20} color={colors.primary} />
                        <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-3">
                            Upcoming
                        </Text>
                        <Text className="text-slate-900 dark:text-white text-3xl font-bold">
                            {isLoading ? '–' : upcomingAppointments.length}
                        </Text>
                    </View>

                    {/* Open Slots */}
                    <View
                        className="rounded-2xl p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm"
                        style={{ minWidth: 140 }}
                    >
                        <CheckCircle2 size={20} color="#22c55e" />
                        <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-3">
                            Open Slots
                        </Text>
                        <Text className="text-slate-900 dark:text-white text-3xl font-bold">{openSlots}</Text>
                    </View>
                </ScrollView>

                {/* Today's Schedule */}
                <View className="px-6 pt-6 pb-2 flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">
                        Today's Schedule
                    </Text>
                    <Text className="text-xs text-slate-400 font-medium">
                        {new Date().toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                        })}
                    </Text>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} className="mt-12" />
                ) : todayAppointments.length === 0 ? (
                    <View className="mx-6 mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800 p-8 items-center">
                        <CalendarDays size={40} color="#94a3b8" />
                        <Text className="text-slate-400 text-base font-semibold mt-3 text-center">
                            No appointments today
                        </Text>
                    </View>
                ) : (
                    <View className="px-6 gap-4" style={{ gap: 16 }}>
                        {todayAppointments.map((appt: any) => {
                            const status = appt.status as string;
                            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
                            return (
                                <TouchableOpacity
                                    key={appt.appointmentId}
                                    activeOpacity={0.7}
                                    onPress={() => navigation.navigate('DoctorAppointmentDetails', { appointment: appt })}
                                    className="rounded-2xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm"
                                    style={{ gap: 12 }}
                                >
                                    {/* Top row */}
                                    <View className="flex-row items-start justify-between">
                                        <View className="flex-row items-center" style={{ gap: 12 }}>
                                            <View
                                                className="w-12 h-12 rounded-xl items-center justify-center"
                                                style={{ backgroundColor: `${colors.primary}18` }}
                                            >
                                                <Text className="text-lg font-bold" style={{ color: colors.primary }}>
                                                    {appt.patientName?.charAt(0) ?? 'P'}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text className="text-slate-900 dark:text-white font-bold text-base">
                                                    {appt.patientName ?? 'Patient'}
                                                </Text>
                                                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                                    {appt.reasonForVisit ?? 'Consultation'}
                                                </Text>
                                            </View>
                                        </View>
                                        <View
                                            className="rounded-full px-3 py-1"
                                            style={{ backgroundColor: cfg.bg }}
                                        >
                                            <Text
                                                className="text-[10px] font-bold uppercase tracking-wider"
                                                style={{ color: cfg.text }}
                                            >
                                                {cfg.label}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Time */}
                                    <View className="flex-row items-center pt-2 border-t border-slate-50 dark:border-slate-700 justify-between">
                                        <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                            🕐 {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                                        </Text>
                                        {/* Action Buttons */}
                                        <View className="flex-row" style={{ gap: 8 }}>
                                            {status === 'PENDING' && (
                                                <>
                                                    <TouchableOpacity
                                                        onPress={() => handleAction('confirm', appt.appointmentId)}
                                                        className="rounded-full px-3 py-1.5"
                                                        style={{ backgroundColor: `${colors.primary}18` }}
                                                    >
                                                        <Text
                                                            className="text-xs font-bold"
                                                            style={{ color: colors.primary }}
                                                        >
                                                            Confirm
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleAction('cancel', appt.appointmentId)}
                                                        className="rounded-full px-3 py-1.5 bg-red-50"
                                                    >
                                                        <Text className="text-xs font-bold text-red-500">Cancel</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                            {status === 'CONFIRMED' && (
                                                <>
                                                    <TouchableOpacity
                                                        onPress={() => handleAction('complete', appt.appointmentId)}
                                                        className="rounded-full px-3 py-1.5 bg-green-50"
                                                    >
                                                        <Text className="text-xs font-bold text-green-600">Complete</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        onPress={() => handleAction('noShow', appt.appointmentId)}
                                                        className="rounded-full px-3 py-1.5 bg-slate-100 dark:bg-slate-700"
                                                    >
                                                        <Text className="text-xs font-bold text-slate-500">No Show</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
