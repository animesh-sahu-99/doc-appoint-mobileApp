import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    CalendarDays,
    Clock,
    Stethoscope,
    BadgeDollarSign,
    User,
    Phone,
    FileText,
    CheckCircle,
    AlertCircle,
    XCircle,
    UserMinus,
    Hash,
} from 'lucide-react-native';
import { useCancelAppointmentMutation, useGetAppointmentByIdQuery } from '../../services/api';
import { colors } from '../../theme/colors';
import { formatDateLabel as formatDate, formatTime, formatCreatedAt } from '../../utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────────────────────



const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: any }> = {
    PENDING:   { label: 'Pending',   bg: '#fffbeb', text: '#d97706', border: '#fde68a', icon: AlertCircle },
    CONFIRMED: { label: 'Confirmed', bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0', icon: CheckCircle },
    COMPLETED: { label: 'Completed', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', bg: '#fff1f2', text: '#e11d48', border: '#fecdd3', icon: XCircle },
    NO_SHOW:   { label: 'No Show',   bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', icon: UserMinus },
};

// ─── Info Row Component ───────────────────────────────────────────────────────

function InfoRow({ icon, label, value, highlight }: {
    icon: React.ReactNode; label: string; value: string; highlight?: boolean;
}) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 }}>
            <View style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: `${colors.primary}10`,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                {icon}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 }}>
                    {label}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: highlight ? '700' : '500', color: highlight ? '#0f172a' : '#334155', lineHeight: 20 }}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={{
            backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 14,
            borderWidth: 1, borderColor: '#f1f5f9',
            shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
        }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
                {title}
            </Text>
            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 4 }} />
            {children}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PatientAppointmentDetailsScreen({ route, navigation }: any) {
    const { appointment: appointmentParam } = route.params;

    // If navigated from a notification, we only have { id }. Fetch the full object in that case.
    const isIdOnly = appointmentParam && Object.keys(appointmentParam).length === 1 && appointmentParam.id;
    const { data: fetchedApptRes, isLoading: isLoadingAppt } = useGetAppointmentByIdQuery(
        appointmentParam?.id ?? '',
        { skip: !isIdOnly }
    );

    // Use the fetched data when navigated from a notification, otherwise use the passed full object
    const appointment = isIdOnly ? (fetchedApptRes?.data ?? null) : appointmentParam;

    // Show loading spinner while fetching a notification deep-linked appointment
    if (isIdOnly && isLoadingAppt) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    const status: string = appointment?.status ?? 'PENDING';
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
    const StatusIcon = cfg.icon;

    const [cancelAppointment, { isLoading: isCancelling }] = useCancelAppointmentMutation();

    const canCancel = status === 'PENDING' || status === 'CONFIRMED';

    const handleCancel = () => {
        Alert.alert(
            'Cancel Appointment',
            'Are you sure you want to cancel this appointment? This action cannot be undone.',
            [
                { text: 'Keep It', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const res = await cancelAppointment(appointment.appointmentId).unwrap();
                            if (res.success) {
                                Alert.alert('Cancelled', 'Your appointment has been cancelled.', [
                                    { text: 'OK', onPress: () => navigation.goBack() },
                                ]);
                            } else {
                                Alert.alert('Error', res.message || 'Failed to cancel appointment.');
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err?.data?.message || 'An error occurred. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 16, paddingVertical: 12,
                backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
            }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Appointment Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: canCancel ? 120 : 40 }}
            >
                {/* ── Ticket Header ── */}
                <View style={{
                    backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 14,
                    borderWidth: 1, borderColor: '#f1f5f9',
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
                }}>
                    {/* Status pill */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        alignSelf: 'flex-start',
                        backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.border,
                        borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 16,
                    }}>
                        <StatusIcon size={14} color={cfg.text} />
                        <Text style={{ color: cfg.text, fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {cfg.label}
                        </Text>
                    </View>

                    {/* Doctor name + specialization */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                        <View style={{
                            width: 56, height: 56, borderRadius: 16,
                            backgroundColor: `${colors.primary}12`,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Stethoscope size={26} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                                {appointment.doctorName ?? 'Doctor'}
                            </Text>
                            <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 }}>
                                {appointment.specialization?.replace(/_/g, ' ') ?? 'Specialist'}
                            </Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 14 }} />

                    {/* Date + time big display */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                            <CalendarDays size={18} color={colors.primary} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 6, textAlign: 'center' }}>
                                {formatDate(appointment.appointmentDate)}
                            </Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                            <Clock size={18} color={colors.primary} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 6, textAlign: 'center' }}>
                                {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
                            </Text>
                            {appointment.durationMinutes && (
                                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                    {appointment.durationMinutes} min
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* ── Appointment Info ── */}
                <SectionCard title="Appointment">
                    <InfoRow
                        icon={<Hash size={16} color={colors.primary} />}
                        label="Reference Number"
                        value={appointment.appointmentNumber ?? '—'}
                        highlight
                    />
                    {appointment.reasonForVisit ? (
                        <InfoRow
                            icon={<FileText size={16} color={colors.primary} />}
                            label="Reason for Visit"
                            value={appointment.reasonForVisit}
                        />
                    ) : null}
                    {appointment.notes ? (
                        <View style={{ marginTop: 4 }}>
                            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 10 }} />
                            <View style={{ backgroundColor: '#fffbeb', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#fef3c7' }}>
                                <Text style={{ fontSize: 11, fontWeight: '700', color: '#d97706', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                                    📝 Note
                                </Text>
                                <Text style={{ color: '#92400e', fontSize: 13, lineHeight: 20 }}>
                                    {appointment.notes}
                                </Text>
                            </View>
                        </View>
                    ) : null}
                    {appointment.createdAt ? (
                        <InfoRow
                            icon={<CalendarDays size={16} color={colors.primary} />}
                            label="Booked On"
                            value={formatCreatedAt(appointment.createdAt)}
                        />
                    ) : null}
                </SectionCard>

                {/* ── Doctor Info ── */}
                <SectionCard title="Doctor">
                    <InfoRow
                        icon={<Stethoscope size={16} color={colors.primary} />}
                        label="Specialization"
                        value={appointment.specialization?.replace(/_/g, ' ') ?? '—'}
                        highlight
                    />
                    {appointment.consultationFee ? (
                        <InfoRow
                            icon={<BadgeDollarSign size={16} color={colors.primary} />}
                            label="Consultation Fee"
                            value={`₹ ${appointment.consultationFee}`}
                        />
                    ) : null}
                </SectionCard>

                {/* ── Patient Info ── */}
                <SectionCard title="Patient">
                    <InfoRow
                        icon={<User size={16} color={colors.primary} />}
                        label="Name"
                        value={appointment.patientName ?? '—'}
                        highlight
                    />
                    {appointment.patientPhone ? (
                        <InfoRow
                            icon={<Phone size={16} color={colors.primary} />}
                            label="Phone"
                            value={appointment.patientPhone}
                        />
                    ) : null}
                </SectionCard>

                {/* Read-only status footer for terminal statuses */}
                {!canCancel && (
                    <View style={{
                        backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.border,
                        borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
                    }}>
                        <StatusIcon size={18} color={cfg.text} />
                        <Text style={{ color: cfg.text, fontWeight: '700', fontSize: 14 }}>
                            This appointment is {cfg.label.toLowerCase()}.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Cancel footer — only for PENDING / CONFIRMED */}
            {canCancel && (
                <View style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
                    padding: 16, paddingBottom: 30,
                }}>
                    <TouchableOpacity
                        onPress={handleCancel}
                        disabled={isCancelling}
                        style={{
                            backgroundColor: '#fff1f2', borderWidth: 1.5, borderColor: '#fecdd3',
                            borderRadius: 14, height: 52,
                            alignItems: 'center', justifyContent: 'center',
                            opacity: isCancelling ? 0.6 : 1,
                        }}
                    >
                        {isCancelling ? (
                            <ActivityIndicator color="#e11d48" />
                        ) : (
                            <Text style={{ color: '#e11d48', fontWeight: '800', fontSize: 15 }}>
                                Cancel Appointment
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}
