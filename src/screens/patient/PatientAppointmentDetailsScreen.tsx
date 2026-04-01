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
    Hash,
    CheckCircle,
    MessageSquare,
    UploadCloud,
} from 'lucide-react-native';
import DocumentPicker from 'react-native-document-picker';
import {
    useCancelAppointmentMutation,
    useGetAppointmentByIdQuery,
    useSubmitReviewMutation,
    useUploadAppointmentDocumentMutation,
} from '../../services/api';
import { colors } from '../../theme/colors';
import { formatDateLabel as formatDate, formatTime, formatCreatedAt } from '../../utils/formatters';
import { STATUS_CONFIG } from '../../utils/appointmentStatus';
import { SectionCard } from '../../components/ui/SectionCard';
import { InfoRow } from '../../components/ui/InfoRow';
import { StarRating } from '../../components/ui/StarRating';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { FieldWrapper, StyledInput } from '../../components/ui/FormField';
import { DocumentList } from '../../components/ui/DocumentList';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

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

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [showReviewForm, setShowReviewForm] = useState(false);

    const [cancelAppointment, { isLoading: isCancelling }] = useCancelAppointmentMutation();
    const [submitReview, { isLoading: isSubmittingReview }] = useSubmitReviewMutation();
    const [uploadDoc, { isLoading: isUploading }] = useUploadAppointmentDocumentMutation();
    
    // Using simple patient selector to pass down to components
    const currentUserId = useSelector((state: RootState) => state.auth.user?.id || '');

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

    const handleSubmitReview = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a star rating.');
            return;
        }
        if (!comment.trim()) {
            Alert.alert('Error', 'Please write a short comment about your experience.');
            return;
        }

        try {
            await submitReview({
                appointmentId: appointment.appointmentId,
                rating,
                comment: comment.trim(),
            }).unwrap();
            Alert.alert('Success', 'Thank you for your feedback!');
            setRating(0);
            setComment('');
            setShowReviewForm(false);
        } catch (err: any) {
            Alert.alert('Error', err.data?.message || 'Failed to submit review.');
        }
    };

    const handleCancelReview = () => {
        setRating(0);
        setComment('');
        setShowReviewForm(false);
    };

    const handleUploadDocument = async () => {
        try {
            const result = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.pdf, DocumentPicker.types.images],
            });

            if (result.size && result.size > 10 * 1024 * 1024) {
                Alert.alert('File too large', 'Please select a file smaller than 10MB.');
                return;
            }

            const formData = new FormData();
            formData.append('file', {
                uri: result.uri,
                type: result.type || 'application/octet-stream',
                name: result.name || `document_${Date.now()}`,
            } as any);
            formData.append('documentType', 'LAB_REPORT');

            await uploadDoc({
                appointmentId: appointment.appointmentId,
                formData,
            }).unwrap();

            Alert.alert('Success', 'Document uploaded securely.');
        } catch (err: any) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert('Upload Failed', err?.data?.message || 'Could not upload the document.');
            }
        }
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

                    {appointment.createdAt ? (
                        <InfoRow
                            icon={<CalendarDays size={16} color={colors.primary} />}
                            label="Booked On"
                            value={formatCreatedAt(appointment.createdAt)}
                        />
                    ) : null}
                </SectionCard>

                {/* ── Clinical Notes ── */}
                {appointment.notes ? (
                    <SectionCard title="Clinical Notes & Prescriptions">
                        <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#bbf7d0' }}>
                            <Text style={{ color: '#166534', fontSize: 14, lineHeight: 22 }}>
                                {appointment.notes}
                            </Text>
                        </View>
                        <Text style={{ color: '#94a3b8', fontSize: 11, marginTop: 10, fontStyle: 'italic' }}>
                            Added by Dr. {appointment.doctorName}
                        </Text>
                    </SectionCard>
                ) : null}

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

                {/* ── Medical Documents ── */}
                <SectionCard title="Medical Documents">
                    <DocumentList appointmentId={appointment.appointmentId} currentUserId={currentUserId} />
                    
                    <TouchableOpacity 
                        onPress={handleUploadDocument} 
                        disabled={isUploading}
                        style={{
                            marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                            paddingVertical: 12, borderRadius: 12, backgroundColor: `${colors.primary}15`,
                            borderWidth: 1, borderColor: `${colors.primary}30`, borderStyle: 'dashed'
                        }}
                    >
                        {isUploading ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <>
                                <UploadCloud size={18} color={colors.primary} />
                                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>Upload Lab Report</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </SectionCard>

                {/* Read-only status footer for terminal statuses */}
                {!canCancel && (
                    <View style={{
                        backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.border,
                        borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
                    }}>
                        <StatusIcon size={18} color={cfg.text} />
                        <Text style={{ color: cfg.text, fontWeight: '700', fontSize: 14, flex: 1 }}>
                            This appointment was {status.toLowerCase().replace('_', ' ')}.
                        </Text>
                    </View>
                )}

                {/* ── Patient Review Section ── */}
                {status === 'COMPLETED' && (
                    <>
                        {appointment.reviewId ? (
                            <SectionCard title="Your Review">
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <StarRating rating={appointment.rating} size={18} />
                                    <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <CheckCircle size={12} color="#16a34a" />
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#16a34a', textTransform: 'uppercase' }}>Verified Visit</Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 14, color: '#334155', lineHeight: 20, fontStyle: 'italic' }}>
                                    "{appointment.comment}"
                                </Text>
                                
                                {appointment.doctorReply && (
                                    <View style={{ marginTop: 16, padding: 12, backgroundColor: '#f8fafc', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.primary }}>
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 4 }}>
                                            Dr. {appointment.doctorName}'s Reply:
                                        </Text>
                                        <Text style={{ fontSize: 13, color: '#475569', lineHeight: 18 }}>
                                            {appointment.doctorReply}
                                        </Text>
                                    </View>
                                )}
                            </SectionCard>
                        ) : (
                            <SectionCard title="Rate Your Experience">
                                {!showReviewForm ? (
                                    <View style={{ alignItems: 'center', paddingVertical: 10 }}>
                                        <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16, textAlign: 'center' }}>
                                            How was your consultation with Dr. {appointment.doctorName}?
                                        </Text>
                                        <TouchableOpacity 
                                            onPress={() => setShowReviewForm(true)}
                                            style={{ backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}
                                        >
                                            <Text style={{ color: 'white', fontWeight: '700' }}>Write a Review</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e293b', marginBottom: 8 }}>Rating</Text>
                                        <StarRating 
                                            rating={rating} 
                                            onRatingChange={setRating} 
                                            size={28} 
                                            style={{ marginBottom: 20 }} 
                                        />
                                        
                                        <FieldWrapper label="Your Feedback" required>
                                            <StyledInput
                                                icon={<MessageSquare size={18} color="#94a3b8" />}
                                                placeholder="Tell us what you liked or how the doctor can improve..."
                                                value={comment}
                                                onChangeText={setComment}
                                                multiline
                                            />
                                        </FieldWrapper>

                                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                                            <TouchableOpacity 
                                                onPress={handleCancelReview}
                                                style={{ flex: 1, paddingVertical: 12, alignItems: 'center' }}
                                            >
                                                <Text style={{ color: '#64748b', fontWeight: '600' }}>Cancel</Text>
                                            </TouchableOpacity>
                                            <PrimaryButton
                                                title="Submit Review"
                                                onPress={handleSubmitReview}
                                                loading={isSubmittingReview}
                                                className="flex-1"
                                            />
                                        </View>
                                    </View>
                                )}
                            </SectionCard>
                        )}
                    </>
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
