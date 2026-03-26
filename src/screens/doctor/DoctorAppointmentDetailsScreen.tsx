import React, { useMemo, useState } from 'react';
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
    User,
    Phone,
    Mail,
    MapPin,
    AlertCircle,
    CheckCircle,
    XCircle,
    UserMinus,
    FileText,
} from 'lucide-react-native';
import {
    useGetPatientProfileQuery,
    useGetPatientAppointmentsQuery,
    useCompleteAppointmentMutation,
    useCancelAppointmentMutation,
    useNoShowAppointmentMutation,
    useConfirmAppointmentMutation,
    useGetAppointmentByIdQuery,
} from '../../services/api';
import { colors } from '../../theme/colors';

// Helpers
const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
};

const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string; icon: any }> = {
    PENDING: { label: 'Pending', bg: '#fef3c7', text: '#d97706', dot: '#f59e0b', icon: AlertCircle },
    CONFIRMED: { label: 'Confirmed', bg: '#dcfce7', text: '#16a34a', dot: '#22c55e', icon: CheckCircle },
    COMPLETED: { label: 'Completed', bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6', icon: CheckCircle },
    CANCELLED: { label: 'Cancelled', bg: '#fee2e2', text: '#dc2626', dot: '#ef4444', icon: XCircle },
    NO_SHOW: { label: 'No Show', bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af', icon: UserMinus },
};

function calculateAge(dobStr: string) {
    if (!dobStr) return null;
    const dob = new Date(dobStr);
    const diff = Date.now() - dob.getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
}

export default function DoctorAppointmentDetailsScreen({ route, navigation }: any) {
    const { appointment: appointmentParam } = route.params;

    // If navigated from a notification, we only have { id }. Fetch the full object in that case.
    const isIdOnly = appointmentParam && Object.keys(appointmentParam).length === 1 && appointmentParam.id;
    const { data: fetchedApptRes, isLoading: isLoadingAppt } = useGetAppointmentByIdQuery(
        appointmentParam?.id ?? '',
        { skip: !isIdOnly }
    );

    // Use the fetched data when navigated from notification, otherwise use the passed full object
    const appointment = isIdOnly ? (fetchedApptRes?.data ?? null) : appointmentParam;

    const { patientId, appointmentId, status: originalStatus } = appointment ?? {};

    // Fetch Patient Details
    const { data: profileRes, isLoading: loadingProfile } = useGetPatientProfileQuery(patientId, { skip: !patientId });
    const patient = profileRes?.data ?? null;

    // Fetch Patient History
    const { data: historyRes, isLoading: loadingHistory } = useGetPatientAppointmentsQuery(patientId, { skip: !patientId });
    const historyData: any[] = historyRes?.data ?? [];

    const history = useMemo(() => {
        // filter out the current appointment
        return historyData
            .filter(a => a.appointmentId !== appointmentId)
            .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
    }, [historyData, appointmentId]);

    // Show loading spinner while fetching a notification deep-linked appointment
    if (isIdOnly && isLoadingAppt) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    // Mutations
    const [confirmAppt, { isLoading: isConfirming }] = useConfirmAppointmentMutation();
    const [completeAppt, { isLoading: isCompleting }] = useCompleteAppointmentMutation();
    const [cancelAppt, { isLoading: isCancelling }] = useCancelAppointmentMutation();
    const [noShowAppt, { isLoading: isNoShowing }] = useNoShowAppointmentMutation();

    const [showAllHistory, setShowAllHistory] = useState(false);
    const isMutating = isConfirming || isCompleting || isCancelling || isNoShowing;

    const handleMutation = (
        action: 'confirm' | 'complete' | 'cancel' | 'no-show',
        mutationFn: any,
        confirmMsg: string
    ) => {
        Alert.alert(
            `Mark as ${action.charAt(0).toUpperCase() + action.slice(1)}`,
            confirmMsg,
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: action === 'cancel' || action === 'no-show' ? "destructive" : "default",
                    onPress: async () => {
                        try {
                            const res = await mutationFn(appointmentId).unwrap();
                            if (res.success) {
                                // Redux RTK invalidates tags so the UI auto-updates if data is fed from cache.
                                // But since we passed `appointment` via props, we might want to pop back or just show alert.
                                Alert.alert("Success", res.message || "Updated successfully", [
                                    { text: "OK", onPress: () => navigation.goBack() }
                                ]);
                            } else {
                                Alert.alert("Error", res.message || "Failed to update.");
                            }
                        } catch (e: any) {
                            Alert.alert('Error', e?.data?.message || 'Action failed.');
                        }
                    }
                }
            ]
        );
    };

    const StatusIcon = STATUS_CONFIG[originalStatus]?.icon ?? AlertCircle;
    const statusCfg = STATUS_CONFIG[originalStatus] ?? STATUS_CONFIG.PENDING;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
                    <ChevronLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Appointment Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* 1. Appointment Info Card */}
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800' }}>Overview</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: statusCfg.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 4 }}>
                            <StatusIcon size={14} color={statusCfg.text} />
                            <Text style={{ color: statusCfg.text, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{statusCfg.label}</Text>
                        </View>
                    </View>

                    <View style={{ gap: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <CalendarDays size={18} color="#94a3b8" />
                            <Text style={{ color: '#334155', fontSize: 14, fontWeight: '600' }}>
                                {formatDate(appointment.appointmentDate)}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Clock size={18} color="#94a3b8" />
                            <Text style={{ color: '#334155', fontSize: 14, fontWeight: '600' }}>
                                {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)} ({appointment.durationMinutes} min)
                            </Text>
                        </View>
                        {appointment.reasonForVisit && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                                <FileText size={18} color="#94a3b8" />
                                <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 10, borderRadius: 8 }}>
                                    <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>
                                        Reason: {appointment.reasonForVisit}
                                    </Text>
                                </View>
                            </View>
                        )}
                        {appointment.notes && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <FileText size={18} color="#94a3b8" />
                                <View style={{ flex: 1, backgroundColor: '#fffbeb', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#fef3c7' }}>
                                    <Text style={{ color: '#b45309', fontSize: 13 }}>
                                        Patient Notes: {appointment.notes}
                                    </Text>
                                </View>
                            </View>
                        )}
                        <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600', marginTop: 8 }}>
                            Appointment ID: {appointment.appointmentNumber}
                        </Text>
                    </View>
                </View>

                {/* 2. Patient Demographics Card */}
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                    <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Patient Details</Text>

                    {loadingProfile ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : patient ? (
                        <View style={{ gap: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
                                    <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '800' }}>
                                        {patient.firstName?.charAt(0) || patient.fullName?.charAt(0)}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '700' }}>
                                        {patient.fullName}
                                    </Text>
                                    <Text style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                                        {patient.gender ? patient.gender.charAt(0) + patient.gender.slice(1).toLowerCase() : 'Unknown Gender'}
                                        {patient.dateOfBirth ? `, ${calculateAge(patient.dateOfBirth)} y/o` : ''}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ height: 1, backgroundColor: '#f1f5f9' }} />

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Phone size={16} color="#64748b" />
                                <Text style={{ color: '#334155', fontSize: 14, fontWeight: '500' }}>{patient.fullPhoneNumber}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Mail size={16} color="#64748b" />
                                <Text style={{ color: '#334155', fontSize: 14, fontWeight: '500' }}>{patient.email}</Text>
                            </View>
                            {patient.address && (
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                                    <MapPin size={16} color="#64748b" style={{ marginTop: 2 }} />
                                    <Text style={{ color: '#334155', fontSize: 14, fontWeight: '500', flex: 1 }}>{patient.address}</Text>
                                </View>
                            )}
                        </View>
                    ) : (
                        <Text style={{ color: '#94a3b8', fontSize: 14 }}>Could not load patient details.</Text>
                    )}
                </View>

                {/* 3. Patient History */}
                <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                    <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 12 }}>Patient History</Text>

                    {loadingHistory ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : history.length === 0 ? (
                        <Text style={{ color: '#64748b', fontSize: 13 }}>No past appointments found.</Text>
                    ) : (
                        <View style={{ gap: 12 }}>
                            {(showAllHistory ? history : history.slice(0, 5)).map((appt) => {
                                const hCfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.PENDING;
                                return (
                                    <View key={appt.appointmentId} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: hCfg.dot, marginTop: 4 }} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: '#334155', fontSize: 14, fontWeight: '600' }}>
                                                {formatDate(appt.appointmentDate)}
                                            </Text>
                                            {appt.startTime ? (
                                                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                                                    🕐 {formatTime(appt.startTime)} – {formatTime(appt.endTime)}
                                                </Text>
                                            ) : null}
                                            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                                                {appt.reasonForVisit || appt.doctorName}
                                            </Text>
                                        </View>
                                        <Text style={{ color: hCfg.text, fontSize: 11, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, backgroundColor: hCfg.bg, borderRadius: 6, overflow: 'hidden' }}>
                                            {hCfg.label}
                                        </Text>
                                    </View>
                                );
                            })}
                            {history.length > 5 && (
                                <TouchableOpacity
                                    onPress={() => setShowAllHistory(prev => !prev)}
                                    style={{ alignItems: 'center', paddingVertical: 10, marginTop: 4, backgroundColor: '#f8fafc', borderRadius: 10 }}
                                >
                                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                                        {showAllHistory
                                            ? '▲ Show less'
                                            : `▼ Show ${history.length - 5} more appointments`}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>

            </ScrollView>

            {/* 4. Action Footer */}
            {isMutating && (
                <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}

            <View style={{ padding: 16, paddingBottom: 30, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {originalStatus === 'PENDING' && (
                    <>
                        <TouchableOpacity
                            onPress={() => handleMutation('confirm', confirmAppt, 'Confirm this appointment?')}
                            style={{ flex: 1, minWidth: '45%', backgroundColor: '#dcfce7', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#16a34a', fontWeight: '700', fontSize: 15 }}>Confirm</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleMutation('cancel', cancelAppt, 'Cancel this appointment and free the slot?')}
                            style={{ flex: 1, minWidth: '45%', backgroundColor: '#fee2e2', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#dc2626', fontWeight: '700', fontSize: 15 }}>Cancel</Text>
                        </TouchableOpacity>
                    </>
                )}
                {originalStatus === 'CONFIRMED' && (
                    <>
                        <TouchableOpacity
                            onPress={() => handleMutation('complete', completeAppt, 'Mark this appointment as Completed?')}
                            style={{ flex: 1, minWidth: '45%', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Complete</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => handleMutation('no-show', noShowAppt, 'Mark patient as No-Show?')}
                            style={{ flex: 1, minWidth: '45%', backgroundColor: '#f1f5f9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
                        >
                            <Text style={{ color: '#475569', fontWeight: '700', fontSize: 15 }}>No Show</Text>
                        </TouchableOpacity>
                    </>
                )}
                {(originalStatus === 'COMPLETED' || originalStatus === 'CANCELLED' || originalStatus === 'NO_SHOW') && (
                    <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingVertical: 14, borderRadius: 12, alignItems: 'center', opacity: 0.7 }}>
                        <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 15 }}>Appointment {originalStatus.toLowerCase()}</Text>
                    </View>
                )}
            </View>

        </SafeAreaView>
    );
}
