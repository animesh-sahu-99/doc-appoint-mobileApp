import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput
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
    MessageSquare,
} from 'lucide-react-native';
import {
    useGetPatientProfileQuery,
    useGetPatientAppointmentsQuery,
    useCompleteAppointmentMutation,
    useCancelAppointmentMutation,
    useNoShowAppointmentMutation,
    useConfirmAppointmentMutation,
    useGetAppointmentByIdQuery,
    useUpdateAppointmentNotesMutation,
    useReplyToReviewMutation,
} from '../../services/api';
import { colors } from '../../theme/colors';
import { STATUS_CONFIG } from '../../utils/appointmentStatus';
import { formatDateLabel, formatTime, calculateAge, formatCreatedAt } from '../../utils/formatters';
import { SectionCard } from '../../components/ui/SectionCard';
import { InfoRow } from '../../components/ui/InfoRow';
import { StarRating } from '../../components/ui/StarRating';


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
    const [updateNotes, { isLoading: isUpdatingNotes }] = useUpdateAppointmentNotesMutation();
    const [replyToReview, { isLoading: isReplying }] = useReplyToReviewMutation();

    const [showAllHistory, setShowAllHistory] = useState(false);
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesText, setNotesText] = useState('');
    
    const [isReplyingToReview, setIsReplyingToReview] = useState(false);
    const [replyText, setReplyText] = useState('');

    const isMutating = isConfirming || isCompleting || isCancelling || isNoShowing || isUpdatingNotes || isReplying;

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

    const handleSaveNotes = async () => {
        try {
            await updateNotes({ appointmentId, notes: notesText.trim() }).unwrap();
            setIsEditingNotes(false);
            Alert.alert('Success', 'Notes updated successfully.');
        } catch (e: any) {
            Alert.alert('Error', e?.data?.message || 'Failed to update notes.');
        }
    };

    const handleSaveReply = async () => {
        if (!replyText.trim()) return;
        try {
            await replyToReview({
                reviewId: appointment.reviewId,
                reply: replyText.trim(),
            }).unwrap();
            setIsReplyingToReview(false);
            Alert.alert('Success', 'Reply submitted successfully.');
        } catch (e: any) {
            Alert.alert('Error', e?.data?.message || 'Failed to submit reply.');
        }
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
                                {formatDateLabel(appointment.appointmentDate)}
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
                    </View>
                </View>

                {/* 1.5. Clinical Notes Card */}
                {(originalStatus === 'COMPLETED' || originalStatus === 'CONFIRMED' || originalStatus === 'PENDING') && (
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800' }}>Clinical Notes</Text>
                            {(!isEditingNotes) && (
                                <TouchableOpacity onPress={() => {
                                    setNotesText(appointment.notes || '');
                                    setIsEditingNotes(true);
                                }}>
                                    <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>
                                        {appointment.notes ? 'Edit Notes' : '+ Add Notes'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {isEditingNotes ? (
                            <View>
                                <TextInput
                                    value={notesText}
                                    onChangeText={setNotesText}
                                    placeholder="Enter diagnosis, prescription, or clinical notes..."
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    numberOfLines={4}
                                    style={{
                                        backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
                                        borderRadius: 12, padding: 12, minHeight: 100,
                                        color: '#334155', fontSize: 14, textAlignVertical: 'top'
                                    }}
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 10 }}>
                                    <TouchableOpacity 
                                        onPress={() => setIsEditingNotes(false)}
                                        style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' }}
                                    >
                                        <Text style={{ color: '#475569', fontWeight: '600' }}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={handleSaveNotes}
                                        disabled={isUpdatingNotes}
                                        style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary }}
                                    >
                                        <Text style={{ color: '#fff', fontWeight: '600' }}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            appointment.notes ? (
                                <Text style={{ color: '#334155', fontSize: 14, lineHeight: 22 }}>{appointment.notes}</Text>
                            ) : (
                                <Text style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>No clinical notes added yet.</Text>
                            )
                        )}
                    </View>
                )}

                {/* 1.5. Patient Feedback Card (Shown if appointment is COMPLETED and has feedback) */}
                {originalStatus === 'COMPLETED' && appointment.reviewId && (
                    <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: colors.accent, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800' }}>Patient Feedback</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                <CheckCircle size={12} color="#16a34a" />
                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a' }}>VERIFIED VISIT</Text>
                            </View>
                        </View>

                        <View style={{ marginBottom: 12 }}>
                            <StarRating rating={appointment.rating} size={18} />
                            <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 4 }}>{formatCreatedAt(appointment.reviewCreatedAt)}</Text>
                        </View>
                        
                        <Text style={{ color: '#334155', fontSize: 14, lineHeight: 22, fontStyle: 'italic', marginBottom: 16 }}>
                            "{appointment.comment}"
                        </Text>

                        {appointment.doctorReply ? (
                            <View style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 12, borderLeftWidth: 2, borderLeftColor: colors.primary }}>
                                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary, marginBottom: 4 }}>YOUR RESPONSE</Text>
                                <Text style={{ fontSize: 14, color: '#334155', lineHeight: 20 }}>{appointment.doctorReply}</Text>
                            </View>
                        ) : (
                            !isReplyingToReview ? (
                                <TouchableOpacity 
                                    onPress={() => {
                                        setReplyText('');
                                        setIsReplyingToReview(true);
                                    }}
                                    style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${colors.primary}10`, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
                                >
                                    <MessageSquare size={16} color={colors.primary} />
                                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Reply to Patient</Text>
                                </TouchableOpacity>
                            ) : (
                                <View>
                                    <TextInput
                                        value={replyText}
                                        onChangeText={setReplyText}
                                        placeholder="Write a professional response..."
                                        placeholderTextColor="#94a3b8"
                                        multiline
                                        style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, minHeight: 80, color: '#334155', fontSize: 14, textAlignVertical: 'top' }}
                                    />
                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, gap: 10 }}>
                                        <TouchableOpacity 
                                            onPress={() => setIsReplyingToReview(false)}
                                            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                                        >
                                            <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={handleSaveReply}
                                            disabled={isReplying || !replyText.trim()}
                                            style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.primary }}
                                        >
                                            <Text style={{ color: '#fff', fontWeight: '700' }}>Send Reply</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )
                        )}
                    </View>
                )}

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
                                                {formatDateLabel(appt.appointmentDate)}
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
