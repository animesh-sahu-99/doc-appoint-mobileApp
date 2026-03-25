import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Stethoscope,
  CreditCard,
  QrCode,
  Banknote,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import {
  useGetDoctorByIdQuery,
  useGetDoctorSlotsQuery,
  useCreateAppointmentMutation,
} from '../../services/api';
import { colors } from '../../theme/colors';

// ─── Simple Schema since payment method is mocked client-side ──────────────
const bookingSchema = z.object({
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  notes: z.string().optional(),
});
type BookingFormData = z.infer<typeof bookingSchema>;

const PAYMENT_METHODS = [
  { id: 'CARD', label: 'Card', sub: '**** 4242', icon: <CreditCard size={24} color={colors.primary} /> },
  { id: 'UPI', label: 'UPI', sub: 'GPay / PhonePe', icon: <QrCode size={24} color="#637288" /> },
  { id: 'CASH', label: 'Pay at Clinic', sub: 'Cash / Insurance', icon: <Banknote size={24} color="#637288" /> },
];

const formatTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function AppointmentBookingScreen({ navigation, route }: any) {
  const { doctorId } = route.params;

  // Global state
  const user = useSelector((s: any) => s.auth.user);
  const patientId = user?.patientId ?? user?.id;

  // Local state
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

  // Queries
  const { data: docRes, isLoading: loadingDoc } = useGetDoctorByIdQuery(doctorId);
  const { data: slotsRes, isLoading: loadingSlots } = useGetDoctorSlotsQuery(doctorId);
  const [bookAppointment, { isLoading: bookingInProgress }] = useCreateAppointmentMutation();

  const doctor = docRes?.data;

  // Hook Form
  const { control, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      reason: 'General Checkup',
      notes: '',
    },
  });

  // Calculate Available Slots
  const availableSlots = useMemo(() => {
    return (slotsRes?.data || []).filter((s: any) => s.isAvailable);
  }, [slotsRes]);

  const slotsByDate = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    for (const s of availableSlots) {
      if (!grouped[s.slotDate]) grouped[s.slotDate] = [];
      grouped[s.slotDate].push(s);
    }
    // Sort times within each date
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    return grouped;
  }, [availableSlots]);

  const availableDates = useMemo(() => {
    return Object.keys(slotsByDate).sort();
  }, [slotsByDate]);

  // Auto-select first date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Clear selected slot if date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate]);

  const onSubmit = async (data: BookingFormData) => {
    if (!selectedSlot) {
      Alert.alert('Missing Slot', 'Please select a date and time for your appointment.');
      return;
    }

    try {
      const payload = {
        slotId: selectedSlot.slotId,
        patientId,
        doctorId,
        reasonForVisit: data.reason,
        notes: data.notes || '',
      };

      const res = await bookAppointment(payload).unwrap();
      if (res.success) {
        Alert.alert('Success', 'Appointment booked successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('PatientTabs', { screen: 'Appointments' }) }
        ]);
      } else {
        Alert.alert('Error', res.message || 'Failed to book appointment.');
      }
    } catch (err: any) {
      const errorMsg = err?.data?.message ?? err?.error ?? 'Network error occurred';
      Alert.alert('Booking Failed', errorMsg);
    }
  };

  if (loadingDoc || loadingSlots) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const initials = (doctor?.name ?? 'D').slice(0, 2).toUpperCase();
  const fee = doctor?.consultationFee ?? 0;
  const bookingFee = 2; // Flat mock booking fee
  const total = fee + bookingFee;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#f8fafc' }}>

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, marginLeft: -8 }}>
          <ChevronLeft size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Book Appointment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>

        {/* Doctor Summary Inline */}
        <View style={{ backgroundColor: '#fff', padding: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: `${colors.primary}15`, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 18 }}>{initials}</Text>
            </View>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Dr. {doctor?.name}</Text>
                {doctor?.isActive && <ShieldCheck size={14} color="#16a34a" />}
              </View>
              <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500', marginTop: 2 }}>{doctor?.specializationDisplayName}</Text>
            </View>
          </View>
        </View>

        {/* Date & Time Selection */}
        <View style={{ backgroundColor: '#fff', paddingVertical: 16, marginBottom: 8 }}>
          <View style={{ paddingHorizontal: 16, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <CalendarIcon size={18} color="#0f172a" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Select Schedule</Text>
          </View>

          {availableDates.length === 0 ? (
            <Text style={{ color: '#64748b', marginHorizontal: 16, fontStyle: 'italic' }}>No available slots found for this doctor right now.</Text>
          ) : (
            <>
              {/* Date Strip */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
                {availableDates.map((date) => {
                  const isSelected = selectedDate === date;
                  const [y, m, d] = date.split('-');
                  const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNumber = dateObj.getDate();

                  return (
                    <TouchableOpacity
                      key={date}
                      onPress={() => setSelectedDate(date)}
                      style={{
                        width: 65,
                        height: 75,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: isSelected ? colors.primary : '#e2e8f0',
                        backgroundColor: isSelected ? colors.primary : '#fff',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: isSelected ? '#fff' : '#64748b', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>{dayName}</Text>
                      <Text style={{ color: isSelected ? '#fff' : '#0f172a', fontSize: 18, fontWeight: '800', marginTop: 2 }}>{dayNumber}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Slots Grid */}
              {selectedDate && (
                <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 12 }}>Time Slots</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                    {slotsByDate[selectedDate].map((slot) => {
                      const isSelected = selectedSlot?.slotId === slot.slotId;
                      return (
                        <TouchableOpacity
                          key={slot.slotId}
                          onPress={() => setSelectedSlot(slot)}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 16,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary : '#e2e8f0',
                            backgroundColor: isSelected ? `${colors.primary}15` : '#fff',
                          }}
                        >
                          <Text style={{ color: isSelected ? colors.primary : '#334155', fontSize: 13, fontWeight: '700' }}>
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}
        </View>

        {/* Form */}
        <View style={{ backgroundColor: '#fff', padding: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 16 }}>Visit Details</Text>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginLeft: 2 }}>Reason for visit</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: errors.reason ? '#ef4444' : '#e2e8f0', borderRadius: 14, paddingHorizontal: 12, height: 50, marginTop: 6 }}>
              <Stethoscope size={18} color="#94a3b8" />
              <Controller
                control={control}
                name="reason"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#0f172a' }}
                    value={value}
                    onChangeText={onChange}
                    placeholder="e.g. General Checkup"
                    placeholderTextColor="#94a3b8"
                  />
                )}
              />
            </View>
            {errors.reason && <Text style={{ color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>{errors.reason.message}</Text>}
          </View>

          <View>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginLeft: 2 }}>Notes (Optional)</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, marginTop: 6, fontSize: 14, color: '#0f172a', minHeight: 90, textAlignVertical: 'top' }}
                  multiline
                  placeholder="Describe symptoms, medical history..."
                  placeholderTextColor="#94a3b8"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </View>
        </View>

        {/* Payment Methods */}
        <View style={{ backgroundColor: '#fff', paddingVertical: 16, paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 16 }}>Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    onPress={() => setPaymentMethod(method.id)}
                    style={{
                      width: 140,
                      height: 90,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? colors.primary : '#e2e8f0',
                      backgroundColor: isSelected ? `${colors.primary}08` : '#fff',
                      padding: 12,
                      justifyContent: 'space-between'
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      {React.cloneElement(method.icon as React.ReactElement, {
                        color: isSelected ? colors.primary : '#94a3b8'
                      })}
                      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: isSelected ? colors.primary : '#cbd5e1', backgroundColor: isSelected ? colors.primary : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {isSelected && <Check size={12} color="#fff" />}
                      </View>
                    </View>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? colors.primary : '#334155' }}>{method.label}</Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{method.sub}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Breakdowns */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#64748b', fontSize: 14 }}>Consultation Fee</Text>
            <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '600' }}>₹ {fee.toFixed(2)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: '#64748b', fontSize: 14 }}>Platform Fee</Text>
            <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '600' }}>₹ {bookingFee.toFixed(2)}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: '#e2e8f0', marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#0f172a', fontSize: 16, fontWeight: '800' }}>Total Payable</Text>
            <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '800' }}>₹ {total.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', padding: 16, paddingBottom: 32 }}>
        <TouchableOpacity
          onPress={handleSubmit(onSubmit)}
          disabled={!selectedSlot || bookingInProgress}
          style={{
            backgroundColor: (!selectedSlot || bookingInProgress) ? '#94a3b8' : colors.primary,
            height: 56,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {bookingInProgress ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                {!selectedSlot ? 'Select a Time Slot' : `Pay ₹ ${total.toFixed(2)}`}
              </Text>
              {selectedSlot && <ArrowRight size={18} color="#fff" />}
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
