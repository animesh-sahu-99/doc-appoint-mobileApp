import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { CalendarDays, Clock, Stethoscope, BadgeDollarSign, FileText } from 'lucide-react-native';
import {
    useGetPatientAppointmentsQuery,
} from '../../services/api';
import { colors } from '../../theme/colors';
import { formatTime, formatDateLabel } from '../../utils/formatters';
import { STATUS_CONFIG } from '../../utils/appointmentStatus';


// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({ appt, onPress }: { appt: any; onPress: () => void }) {
    const status = appt.status as string;
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.75}
            style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#f1f5f9',
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                    <View style={{
                        width: 48, height: 48, borderRadius: 14, backgroundColor: `${colors.primary}15`,
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Stethoscope size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '800', fontSize: 15, color: '#0f172a' }} numberOfLines={1}>
                            {appt.doctorName ?? 'Doctor'}
                        </Text>
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                            {appt.specialization?.replace(/_/g, ' ') ?? 'Specialist'}
                        </Text>
                    </View>
                </View>
                <View style={{ backgroundColor: cfg.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: cfg.text, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        {cfg.label}
                    </Text>
                </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#f8fafc', marginBottom: 12 }} />

            <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <CalendarDays size={14} color="#94a3b8" />
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>
                        {formatDateLabel(appt.appointmentDate)}
                    </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} color="#94a3b8" />
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>
                        {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                    </Text>
                </View>

                {appt.reasonForVisit && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <FileText size={14} color="#94a3b8" />
                        <Text style={{ color: '#475569', fontSize: 13, flex: 1 }} numberOfLines={1}>
                            {appt.reasonForVisit}
                        </Text>
                    </View>
                )}
            </View>

            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.dot }} />
                    <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>
                        {appt.appointmentNumber}
                    </Text>
                </View>
                <Text style={{ color: '#cbd5e1', fontSize: 12, fontWeight: '600' }}>View details →</Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PatientScheduleScreen({ navigation }: any) {
    const user = useSelector((s: any) => s.auth.user);
    const patientId: string = user?.patientId ?? user?.id ?? '';

    const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST'>('UPCOMING');
    const [refreshing, setRefreshing] = useState(false);

    // We only need the single query that returns ALL appointments
    const {
        data: allData,
        isLoading,
        refetch,
    } = useGetPatientAppointmentsQuery(patientId, { skip: !patientId });

    const navigateToDetails = (appointment: any) => {
        navigation.navigate('PatientAppointmentDetails', { appointment });
    };

    const allAppointments: any[] = allData?.data ?? [];

    // Split appointments into Upcoming vs Past based on status and date
    // PENDING, CONFIRMED go to Upcoming
    // COMPLETED, CANCELLED, NO_SHOW go to Past
    const { upcoming, past } = useMemo(() => {
        const up: any[] = [];
        const pa: any[] = [];

        allAppointments.forEach((appt) => {
            if (appt.status === 'PENDING' || appt.status === 'CONFIRMED') {
                up.push(appt);
            } else {
                pa.push(appt);
            }
        });

        // Sort upcoming: nearest first (ascending)
        up.sort((a, b) => {
            const dateA = new Date(`${a.appointmentDate}T${a.startTime}`);
            const dateB = new Date(`${b.appointmentDate}T${b.startTime}`);
            return dateA.getTime() - dateB.getTime();
        });

        // Sort past: most recent first (descending)
        pa.sort((a, b) => {
            const dateA = new Date(`${a.appointmentDate}T${a.startTime}`);
            const dateB = new Date(`${b.appointmentDate}T${b.startTime}`);
            return dateB.getTime() - dateA.getTime();
        });

        return { upcoming: up, past: pa };
    }, [allAppointments]);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const displayList = activeTab === 'UPCOMING' ? upcoming : past;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16,
                backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
            }}>
                <CalendarDays size={24} color={colors.primary} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a', marginLeft: 10 }}>
                    My Appointments
                </Text>
            </View>

            {/* Tabs */}
            <View style={{
                flexDirection: 'row',
                backgroundColor: '#fff',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#f1f5f9',
                gap: 12,
            }}>
                <TouchableOpacity
                    onPress={() => setActiveTab('UPCOMING')}
                    style={{
                        flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
                        backgroundColor: activeTab === 'UPCOMING' ? `${colors.primary}12` : '#f8fafc',
                        borderWidth: 1, borderColor: activeTab === 'UPCOMING' ? colors.primary : 'transparent',
                    }}
                >
                    <Text style={{
                        fontSize: 14, fontWeight: '700',
                        color: activeTab === 'UPCOMING' ? colors.primary : '#64748b'
                    }}>
                        Upcoming ({upcoming.length})
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('PAST')}
                    style={{
                        flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
                        backgroundColor: activeTab === 'PAST' ? `${colors.primary}12` : '#f8fafc',
                        borderWidth: 1, borderColor: activeTab === 'PAST' ? colors.primary : 'transparent',
                    }}
                >
                    <Text style={{
                        fontSize: 14, fontWeight: '700',
                        color: activeTab === 'PAST' ? colors.primary : '#64748b'
                    }}>
                        Past ({past.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Body */}
            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {displayList.length === 0 ? (
                        <View style={{
                            backgroundColor: '#fff', borderRadius: 20, padding: 40,
                            alignItems: 'center', marginTop: 20,
                            borderWidth: 1, borderColor: '#f1f5f9'
                        }}>
                            <CalendarDays size={48} color="#e2e8f0" />
                            <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '700', marginTop: 16 }}>
                                No appointments found
                            </Text>
                            <Text style={{ color: '#64748b', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
                                You don't have any {activeTab.toLowerCase()} appointments at the moment.
                            </Text>
                        </View>
                    ) : (
                        displayList.map((appt: any) => (
                            <AppointmentCard
                                key={appt.appointmentId}
                                appt={appt}
                                onPress={() => navigateToDetails(appt)}
                            />
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
