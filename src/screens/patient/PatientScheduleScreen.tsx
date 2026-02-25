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
    useGetUpcomingPatientAppointmentsQuery,
} from '../../services/api';
import { colors } from '../../theme/colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildDays = () => {
    const days: { dateStr: string; dayNum: number; dayName: string }[] = [];
    // Show 30 days: 7 past + today + 22 future
    for (let i = -7; i <= 22; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
        ).padStart(2, '0')}`;
        days.push({
            dateStr,
            dayNum: d.getDate(),
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        });
    }
    return days;
};

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
    ).padStart(2, '0')}`;
};

const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00'); // local parse
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PENDING: { label: 'Pending', bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
    CONFIRMED: { label: 'Confirmed', bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
    COMPLETED: { label: 'Completed', bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
    CANCELLED: { label: 'Cancelled', bg: '#fee2e2', text: '#dc2626', dot: '#ef4444' },
    NO_SHOW: { label: 'No Show', bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
};

const DAYS = buildDays();

// ─── Appointment Card ─────────────────────────────────────────────────────────

function AppointmentCard({ appt }: { appt: any }) {
    const status = appt.status as string;
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

    return (
        <View
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
            {/* Header row */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                {/* Doctor avatar + info */}
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
                    <View
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 14,
                            backgroundColor: `${colors.primary}15`,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Stethoscope size={22} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '800', fontSize: 15, color: '#0f172a' }} numberOfLines={1}>
                            {appt.doctorName ?? 'Doctor'}
                        </Text>
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                            {appt.specialization?.replace('_', ' ') ?? 'Specialist'}
                        </Text>
                    </View>
                </View>

                {/* Status badge */}
                <View style={{ backgroundColor: cfg.bg, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ color: cfg.text, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        {cfg.label}
                    </Text>
                </View>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: '#f8fafc', marginBottom: 12 }} />

            {/* Details */}
            <View style={{ gap: 8 }}>
                {/* Time */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} color="#94a3b8" />
                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>
                        {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                        {appt.durationMinutes ? `  ·  ${appt.durationMinutes} min` : ''}
                    </Text>
                </View>

                {/* Reason */}
                {appt.reasonForVisit && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <FileText size={14} color="#94a3b8" />
                        <Text style={{ color: '#475569', fontSize: 13, flex: 1 }} numberOfLines={2}>
                            {appt.reasonForVisit}
                        </Text>
                    </View>
                )}

                {/* Fee */}
                {appt.consultationFee && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <BadgeDollarSign size={14} color="#94a3b8" />
                        <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>
                            ₹ {appt.consultationFee}
                        </Text>
                    </View>
                )}

                {/* Notes */}
                {appt.notes && (
                    <View
                        style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: 10,
                            padding: 10,
                            marginTop: 4,
                        }}
                    >
                        <Text style={{ color: '#64748b', fontSize: 12, lineHeight: 18 }}>
                            📝 {appt.notes}
                        </Text>
                    </View>
                )}
            </View>

            {/* Appointment number */}
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.dot }} />
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>
                    {appt.appointmentNumber}
                </Text>
            </View>
        </View>
    );
}

// ─── Upcoming Banner ──────────────────────────────────────────────────────────

function UpcomingBanner({ appt }: { appt: any }) {
    const status = appt.status as string;
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.CONFIRMED;
    return (
        <View
            style={{
                backgroundColor: colors.primary,
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                shadowColor: colors.primary,
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 4,
            }}
        >
            <View
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Stethoscope size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Next Appointment
                </Text>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15, marginTop: 2 }}>
                    {appt.doctorName}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 }}>
                    {formatDateLabel(appt.appointmentDate)}  ·  {formatTime(appt.startTime)}
                </Text>
            </View>
            <View style={{ backgroundColor: cfg.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ color: cfg.text, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>
                    {cfg.label}
                </Text>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PatientScheduleScreen() {
    const user = useSelector((s: any) => s.auth.user);
    const patientId: string = user?.patientId ?? user?.id ?? '';

    const today = todayStr();
    const [selectedDate, setSelectedDate] = useState(today);
    const [refreshing, setRefreshing] = useState(false);

    const {
        data: allData,
        isLoading: loadingAll,
        refetch: refetchAll,
    } = useGetPatientAppointmentsQuery(patientId, { skip: !patientId });

    const {
        data: upcomingData,
        isLoading: loadingUpcoming,
        refetch: refetchUpcoming,
    } = useGetUpcomingPatientAppointmentsQuery(patientId, { skip: !patientId });

    const allAppointments: any[] = allData?.data ?? [];
    const upcomingAppointments: any[] = upcomingData?.data ?? [];

    // Filter appointments matching the selected date
    const appointmentsForDate = useMemo(
        () => allAppointments.filter((a) => a.appointmentDate === selectedDate),
        [allAppointments, selectedDate]
    );

    // Compute which dates have appointments (for dot indicator on date strip)
    const datesWithAppointments = useMemo(
        () => new Set(allAppointments.map((a) => a.appointmentDate as string)),
        [allAppointments]
    );

    const nextUpcoming = upcomingAppointments[0] ?? null;

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchAll(), refetchUpcoming()]);
        setRefreshing(false);
    };

    const isLoading = loadingAll || loadingUpcoming;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingTop: 12,
                    paddingBottom: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: `${colors.primary}12`,
                }}
            >
                <CalendarDays size={22} color={colors.primary} />
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', flex: 1, marginLeft: 10 }}>
                    My Schedule
                </Text>
                <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '600' }}>
                    {allAppointments.length} total
                </Text>
            </View>

            {/* Date Strip */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}
                style={{ flexShrink: 0, borderBottomWidth: 1, borderBottomColor: `${colors.primary}08` }}
            >
                {DAYS.map((day) => {
                    const isSelected = day.dateStr === selectedDate;
                    const isToday = day.dateStr === today;
                    const hasAppt = datesWithAppointments.has(day.dateStr);

                    return (
                        <TouchableOpacity
                            key={day.dateStr}
                            onPress={() => setSelectedDate(day.dateStr)}
                            style={{
                                width: 52,
                                height: 68,
                                borderRadius: 14,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isSelected ? `${colors.primary}15` : '#f8fafc',
                                borderWidth: isSelected ? 1.5 : 0,
                                borderColor: isSelected ? colors.primary : 'transparent',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    color: isSelected ? colors.primary : '#94a3b8',
                                    letterSpacing: 0.5,
                                }}
                            >
                                {day.dayName}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: '800',
                                    marginTop: 2,
                                    color: isSelected ? colors.primary : isToday ? '#334155' : '#475569',
                                }}
                            >
                                {day.dayNum}
                            </Text>
                            {/* Dot for dates with appointments */}
                            <View
                                style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: 3,
                                    marginTop: 3,
                                    backgroundColor: hasAppt
                                        ? isSelected
                                            ? colors.primary
                                            : '#94a3b8'
                                        : 'transparent',
                                }}
                            />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Body */}
            {isLoading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {/* Upcoming banner — only on today's view */}
                    {selectedDate === today && nextUpcoming && (
                        <UpcomingBanner appt={nextUpcoming} />
                    )}

                    {/* Date label */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, marginTop: 4 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
                            {selectedDate === today
                                ? "Today's Appointments"
                                : formatDateLabel(selectedDate)}
                        </Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>
                            {appointmentsForDate.length > 0
                                ? `${appointmentsForDate.length} appt${appointmentsForDate.length > 1 ? 's' : ''}`
                                : ''}
                        </Text>
                    </View>

                    {/* Appointment cards for selected date */}
                    {appointmentsForDate.length === 0 ? (
                        <View
                            style={{
                                backgroundColor: '#f8fafc',
                                borderRadius: 20,
                                padding: 36,
                                alignItems: 'center',
                            }}
                        >
                            <CalendarDays size={40} color="#cbd5e1" />
                            <Text style={{ color: '#94a3b8', fontSize: 15, fontWeight: '600', marginTop: 12, textAlign: 'center' }}>
                                No appointments{'\n'}on this date
                            </Text>
                        </View>
                    ) : (
                        appointmentsForDate.map((appt: any) => (
                            <AppointmentCard key={appt.appointmentId} appt={appt} />
                        ))
                    )}

                    {/* Upcoming section — shown at bottom of today's view */}
                    {selectedDate === today && upcomingAppointments.length > 1 && (
                        <>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12 }}>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>All Upcoming</Text>
                                <Text style={{ fontSize: 13, color: colors.primary, fontWeight: '600' }}>
                                    {upcomingAppointments.length} total
                                </Text>
                            </View>
                            {upcomingAppointments.map((appt: any) => (
                                <AppointmentCard key={appt.appointmentId} appt={appt} />
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}
