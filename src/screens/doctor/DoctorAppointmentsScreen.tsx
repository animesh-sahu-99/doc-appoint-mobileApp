import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MoreVertical, X } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import {
    useGetDoctorAppointmentsQuery,
    useConfirmAppointmentMutation,
    useCancelAppointmentMutation,
    useCompleteAppointmentMutation,
    useNoShowAppointmentMutation,
} from '../../services/api';
import { colors } from '../../theme/colors';

type Tab = 'Upcoming' | 'Completed' | 'Cancelled';

const TABS: Tab[] = ['Upcoming', 'Completed', 'Cancelled'];

const TAB_STATUS_FILTER: Record<Tab, string[]> = {
    Upcoming: ['PENDING', 'CONFIRMED'],
    Completed: ['COMPLETED'],
    Cancelled: ['CANCELLED', 'NO_SHOW'],
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    PENDING: { label: 'Pending', bg: '#fef3c7', text: '#d97706' },
    CONFIRMED: { label: 'Confirmed', bg: '#dcfce7', text: '#16a34a' },
    COMPLETED: { label: 'Completed', bg: '#dbeafe', text: '#1d4ed8' },
    CANCELLED: { label: 'Cancelled', bg: '#fee2e2', text: '#dc2626' },
    NO_SHOW: { label: 'No Show', bg: '#f3f4f6', text: '#6b7280' },
};

const formatDateTime = (date: string, time: string) => {
    if (!date) return '';
    const d = new Date(date);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!time) return label;
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${label}, ${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

// More-actions bottom sheet
interface MoreSheetProps {
    visible: boolean;
    onClose: () => void;
    appointment: any;
    onAction: (action: string, id: string) => void;
}

function MoreSheet({ visible, onClose, appointment, onAction }: MoreSheetProps) {
    if (!appointment) return null;
    const status = appointment.status as string;
    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/40">
                <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6">
                    <View className="flex-row justify-between items-center mb-5">
                        <Text className="font-bold text-base text-slate-900 dark:text-white">
                            Actions · {appointment.patientName}
                        </Text>
                        <TouchableOpacity onPress={onClose}><X size={20} color="#64748b" /></TouchableOpacity>
                    </View>

                    {['PENDING', 'CONFIRMED'].includes(status) && (
                        <TouchableOpacity
                            onPress={() => { onAction('complete', appointment.appointmentId); onClose(); }}
                            className="flex-row items-center py-4 border-b border-slate-100 dark:border-slate-700"
                        >
                            <Text className="text-slate-900 dark:text-white font-semibold text-base">✅ Mark as Completed</Text>
                        </TouchableOpacity>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(status) && (
                        <TouchableOpacity
                            onPress={() => { onAction('noShow', appointment.appointmentId); onClose(); }}
                            className="flex-row items-center py-4 border-b border-slate-100 dark:border-slate-700"
                        >
                            <Text className="text-slate-400 font-semibold text-base">🚫 Mark as No Show</Text>
                        </TouchableOpacity>
                    )}
                    {['PENDING', 'CONFIRMED'].includes(status) && (
                        <TouchableOpacity
                            onPress={() => { onAction('cancel', appointment.appointmentId); onClose(); }}
                            className="flex-row items-center py-4"
                        >
                            <Text className="text-red-500 font-semibold text-base">❌ Cancel Appointment</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

export default function DoctorAppointmentsScreen() {
    const user = useSelector((s: any) => s.auth.user);
    const doctorId: string = user?.doctorId ?? user?.id ?? '';

    const [activeTab, setActiveTab] = useState<Tab>('Upcoming');
    const [search, setSearch] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [selectedAppt, setSelectedAppt] = useState<any>(null);
    const [showMore, setShowMore] = useState(false);

    const { data, isLoading, refetch } = useGetDoctorAppointmentsQuery(doctorId, {
        skip: !doctorId,
    });

    const [confirmAppt] = useConfirmAppointmentMutation();
    const [cancelAppt] = useCancelAppointmentMutation();
    const [completeAppt] = useCompleteAppointmentMutation();
    const [noShowAppt] = useNoShowAppointmentMutation();

    const allAppointments: any[] = data?.data ?? [];

    const filtered = useMemo(() => {
        const statuses = TAB_STATUS_FILTER[activeTab];
        return allAppointments
            .filter((a) => statuses.includes(a.status))
            .filter(
                (a) =>
                    !search ||
                    a.patientName?.toLowerCase().includes(search.toLowerCase()) ||
                    a.appointmentNumber?.toLowerCase().includes(search.toLowerCase())
            );
    }, [allAppointments, activeTab, search]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleAction = async (action: string, appointmentId: string) => {
        try {
            if (action === 'confirm') await confirmAppt(appointmentId).unwrap();
            else if (action === 'cancel') await cancelAppt(appointmentId).unwrap();
            else if (action === 'complete') await completeAppt(appointmentId).unwrap();
            else if (action === 'noShow') await noShowAppt(appointmentId).unwrap();
        } catch {
            Alert.alert('Error', 'Action failed. Please try again.');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-background-dark">
            {/* Header */}
            <View className="flex-row items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <Text className="text-lg font-extrabold text-slate-900 dark:text-white flex-1 text-center">
                    Appointments
                </Text>
            </View>

            {/* Tabs */}
            <View className="flex-row border-b border-slate-100 dark:border-slate-800 px-4">
                {TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        onPress={() => setActiveTab(tab)}
                        className="flex-1 items-center py-3"
                        style={{
                            borderBottomWidth: 2,
                            borderBottomColor: activeTab === tab ? colors.primary : 'transparent',
                        }}
                    >
                        <Text
                            className="text-sm font-bold"
                            style={{ color: activeTab === tab ? colors.primary : '#94a3b8' }}
                        >
                            {tab}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Search */}
            <View className="px-4 py-3">
                <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl h-11 px-3">
                    <Search size={18} color="#94a3b8" />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search by patient name..."
                        placeholderTextColor="#94a3b8"
                        className="flex-1 ml-2 text-sm text-slate-800 dark:text-slate-100"
                    />
                </View>
            </View>

            {/* List */}
            {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} className="mt-12" />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 14 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {filtered.length === 0 ? (
                        <View className="mt-10 items-center">
                            <Text className="text-slate-400 text-base font-semibold">No appointments found</Text>
                        </View>
                    ) : (
                        filtered.map((appt: any) => {
                            const status = appt.status as string;
                            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
                            const isActive = ['PENDING', 'CONFIRMED'].includes(status);
                            return (
                                <View
                                    key={appt.appointmentId}
                                    className="rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-sm p-4"
                                    style={{ gap: 10 }}
                                >
                                    {/* Top */}
                                    <View className="flex-row items-start justify-between">
                                        <View className="flex-row items-center" style={{ gap: 10 }}>
                                            <View
                                                className="w-12 h-12 rounded-full items-center justify-center border"
                                                style={{
                                                    backgroundColor: `${colors.primary}12`,
                                                    borderColor: `${colors.primary}20`,
                                                }}
                                            >
                                                <Text className="font-bold text-lg" style={{ color: colors.primary }}>
                                                    {appt.patientName?.charAt(0) ?? 'P'}
                                                </Text>
                                            </View>
                                            <View>
                                                <Text className="text-slate-900 dark:text-white font-bold text-base">
                                                    {appt.patientName ?? 'Patient'}
                                                </Text>
                                                <Text className="text-slate-500 text-xs font-medium mt-0.5">
                                                    #{appt.appointmentNumber}
                                                </Text>
                                            </View>
                                        </View>
                                        <View
                                            className="rounded-full px-2.5 py-1"
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

                                    {/* Details */}
                                    <View style={{ gap: 5 }}>
                                        <View className="flex-row items-center" style={{ gap: 6 }}>
                                            <Text className="text-slate-500 text-xs">📅</Text>
                                            <Text className="text-slate-600 dark:text-slate-300 text-sm">
                                                {formatDateTime(appt.appointmentDate, appt.startTime)}
                                            </Text>
                                        </View>
                                        {appt.reasonForVisit && (
                                            <View className="flex-row items-center" style={{ gap: 6 }}>
                                                <Text className="text-slate-500 text-xs">📋</Text>
                                                <Text className="text-slate-600 dark:text-slate-300 text-sm">
                                                    {appt.reasonForVisit}
                                                </Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Action Buttons */}
                                    {isActive && (
                                        <View className="flex-row items-center pt-2 border-t border-slate-50 dark:border-slate-700" style={{ gap: 8 }}>
                                            {status === 'PENDING' && (
                                                <TouchableOpacity
                                                    onPress={() => handleAction('confirm', appt.appointmentId)}
                                                    className="flex-1 py-2 rounded-lg items-center"
                                                    style={{ backgroundColor: colors.primary }}
                                                >
                                                    <Text className="text-white text-sm font-bold">Confirm</Text>
                                                </TouchableOpacity>
                                            )}
                                            {status === 'CONFIRMED' && (
                                                <TouchableOpacity
                                                    onPress={() => handleAction('complete', appt.appointmentId)}
                                                    className="flex-1 py-2 rounded-lg items-center bg-green-50"
                                                >
                                                    <Text className="text-green-600 text-sm font-bold">Complete</Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                onPress={() => handleAction('cancel', appt.appointmentId)}
                                                className="flex-1 py-2 rounded-lg items-center border border-slate-200 dark:border-slate-600"
                                            >
                                                <Text className="text-slate-600 dark:text-slate-300 text-sm font-bold">
                                                    Cancel
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => { setSelectedAppt(appt); setShowMore(true); }}
                                                className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 items-center justify-center"
                                            >
                                                <MoreVertical size={18} color="#64748b" />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}

            {/* More-actions sheet */}
            <MoreSheet
                visible={showMore}
                onClose={() => setShowMore(false)}
                appointment={selectedAppt}
                onAction={handleAction}
            />
        </SafeAreaView>
    );
}
