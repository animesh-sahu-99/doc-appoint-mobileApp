/// <reference types="nativewind/types" />
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    RefreshControl,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Layers, Trash2, X, Clock, CalendarDays, Calendar as CalendarIcon, ChevronDown } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import {
    useGetAllSlotsByDateQuery,
    useCreateSlotMutation,
    useCreateBulkSlotsMutation,
    useDeleteSlotMutation,
    useDeleteSlotsByDateMutation,
} from '../../services/api';
import { colors } from '../../theme/colors';
import { formatTime } from '../../utils/formatters';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Returns 14 day objects starting from startDateStr */
const buildDays = (startDateStr: string) => {
    const days: { dateStr: string; dayNum: number; dayName: string }[] = [];
    const [y, m, d] = startDateStr.split('-').map(Number);
    if (!y || !m || !d) return [];

    // Generate 14 past days + 1 selected + 14 future days (29 total)
    for (let i = -14; i <= 14; i++) {
        const dateObj = new Date(y, m - 1, d + i);
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        days.push({
            dateStr,
            dayNum: dateObj.getDate(),
            dayName: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
        });
    }
    return days;
};



/** Add `minutes` to a "HH:MM" string, returns new "HH:MM" string */
const addMinutes = (timeStr: string, minutes: number): string => {
    const [h, m] = timeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const totalMins = h * 60 + m + minutes;
    const newH = Math.floor(totalMins / 60) % 24;
    const newM = totalMins % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

/** Count how many slots a bulk config would produce */
const countBulkSlots = (dayStart: string, dayEnd: string, slotDur: number, breakDur: number): number => {
    const [sh, sm] = dayStart.split(':').map(Number);
    const [eh, em] = dayEnd.split(':').map(Number);
    if (isNaN(sh) || isNaN(eh)) return 0;
    const totalMins = (eh * 60 + em) - (sh * 60 + sm);
    if (totalMins <= 0 || slotDur <= 0) return 0;
    return Math.floor(totalMins / (slotDur + breakDur));
};

/** Validate HH:MM format */
const isValidTime = (t: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);

// ─── Reusable Time Input ───────────────────────────────────────────────────────
interface TimeInputProps {
    label: string;
    value: string;
    onChange: (v: string) => void;
    readOnly?: boolean;
}

function TimeInput({ label, value, onChange, readOnly }: TimeInputProps) {
    const isValid = isValidTime(value);
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {label}
            </Text>
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: readOnly ? '#f1f5f9' : '#fff',
                borderWidth: 1.5,
                borderColor: readOnly ? '#e2e8f0' : (isValid || value === '' ? '#e2e8f0' : '#ef4444'),
                borderRadius: 12, paddingHorizontal: 12, height: 48,
            }}>
                <Clock size={16} color={readOnly ? '#94a3b8' : '#64748b'} />
                <TextInput
                    value={value}
                    onChangeText={onChange}
                    placeholder="09:00"
                    placeholderTextColor="#94a3b8"
                    editable={!readOnly}
                    keyboardType="numeric"
                    maxLength={5}
                    style={{ flex: 1, marginLeft: 8, fontSize: 16, fontWeight: '600', color: readOnly ? '#94a3b8' : '#0f172a' }}
                />
                {readOnly && (
                    <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '500' }}>auto</Text>
                )}
            </View>
            {!isValid && value.length > 0 && !readOnly && (
                <Text style={{ color: '#ef4444', fontSize: 11, marginTop: 3 }}>Use HH:MM format (e.g. 09:00)</Text>
            )}
        </View>
    );
}

// ─── Single Slot Modal ────────────────────────────────────────────────────────
function SingleSlotModal({
    visible, onClose, doctorId, selectedDate, onCreate,
}: { visible: boolean; onClose: () => void; doctorId: string; selectedDate: string; onCreate: () => void }) {
    const [startTime, setStartTime] = useState('09:00');
    const [duration, setDuration] = useState('30');
    const [createSlot, { isLoading }] = useCreateSlotMutation();

    // Auto-calculate end time
    const endTime = useMemo(() => {
        const dur = parseInt(duration, 10);
        if (!isNaN(dur) && dur > 0 && isValidTime(startTime)) {
            return addMinutes(startTime, dur);
        }
        return '';
    }, [startTime, duration]);

    const handleCreate = async () => {
        if (!isValidTime(startTime)) { Alert.alert('Invalid Time', 'Please enter a valid start time (HH:MM).'); return; }
        const dur = parseInt(duration, 10);
        if (isNaN(dur) || dur < 10) { Alert.alert('Invalid Duration', 'Duration must be at least 10 minutes.'); return; }
        if (!endTime) { Alert.alert('Error', 'Could not calculate end time.'); return; }

        try {
            await createSlot({
                doctorId,
                slotDate: selectedDate,
                startTime,
                endTime,
                durationMinutes: dur,
            }).unwrap();
            onCreate();
            onClose();
            setStartTime('09:00');
            setDuration('30');
        } catch (e: any) {
            Alert.alert('Error', e?.data?.message ?? 'Failed to create slot.');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
                <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 }}>
                        {/* Handle bar */}
                        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 20 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Add Single Slot</Text>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                                <X size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Date badge */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.primary}10`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 20, gap: 8 }}>
                            <CalendarDays size={15} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>{selectedDate}</Text>
                        </View>

                        <TimeInput label="Start Time" value={startTime} onChange={setStartTime} />

                        {/* Duration selector */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Duration (minutes)
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[15, 20, 30, 45, 60].map(d => (
                                    <TouchableOpacity
                                        key={d}
                                        onPress={() => setDuration(String(d))}
                                        style={{
                                            flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: duration === String(d) ? colors.primary : '#f1f5f9',
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: duration === String(d) ? '#fff' : '#64748b' }}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Preview end time */}
                        {endTime ? (
                            <View style={{ backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Clock size={14} color="#16a34a" />
                                <Text style={{ color: '#16a34a', fontWeight: '600', fontSize: 13 }}>
                                    Slot: {formatTime(startTime)} → {formatTime(endTime)}
                                </Text>
                            </View>
                        ) : null}

                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={isLoading}
                            style={{ backgroundColor: colors.primary, borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center', opacity: isLoading ? 0.7 : 1 }}
                        >
                            {isLoading ? <ActivityIndicator color="#fff" /> : (
                                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Create Slot</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

// ─── Bulk Slot Modal ──────────────────────────────────────────────────────────
function BulkSlotModal({
    visible, onClose, doctorId, selectedDate, onCreate,
}: { visible: boolean; onClose: () => void; doctorId: string; selectedDate: string; onCreate: () => void }) {
    const [dayStart, setDayStart] = useState('09:00');
    const [dayEnd, setDayEnd] = useState('17:00');
    const [slotDuration, setSlotDuration] = useState('30');
    const [breakDuration, setBreakDuration] = useState('0');
    const [createBulk, { isLoading }] = useCreateBulkSlotsMutation();

    const dur = parseInt(slotDuration, 10) || 0;
    const brk = parseInt(breakDuration, 10) || 0;
    const slotCount = useMemo(() => countBulkSlots(dayStart, dayEnd, dur, brk), [dayStart, dayEnd, dur, brk]);

    const handleCreate = async () => {
        if (!isValidTime(dayStart) || !isValidTime(dayEnd)) { Alert.alert('Invalid Time', 'Please enter valid times in HH:MM format.'); return; }
        if (dur < 10) { Alert.alert('Invalid Duration', 'Slot duration must be at least 10 minutes.'); return; }
        if (slotCount <= 0) { Alert.alert('Invalid Range', 'No slots can be generated with the current settings.'); return; }

        Alert.alert(
            'Confirm Bulk Creation',
            `This will create ${slotCount} slots for ${selectedDate} from ${formatTime(dayStart)} to ${formatTime(dayEnd)}. Continue?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: `Create ${slotCount} Slots`,
                    onPress: async () => {
                        try {
                            await createBulk({
                                doctorId,
                                slotDate: selectedDate,
                                dayStartTime: dayStart,
                                dayEndTime: dayEnd,
                                slotDurationMinutes: dur,
                                breakDurationMinutes: brk,
                            }).unwrap();
                            onCreate();
                            onClose();
                        } catch (e: any) {
                            Alert.alert('Error', e?.data?.message ?? 'Failed to create slots.');
                        }
                    }
                },
            ]
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <TouchableOpacity activeOpacity={1} onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
                <TouchableOpacity activeOpacity={1} onPress={() => { }}>
                    <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 36 }}>
                        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', alignSelf: 'center', marginBottom: 20 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Bulk Create Slots</Text>
                            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                                <X size={22} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        {/* Date badge */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: `${colors.primary}10`, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 20, gap: 8 }}>
                            <CalendarDays size={15} color={colors.primary} />
                            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>{selectedDate}</Text>
                        </View>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <TimeInput label="Day Start" value={dayStart} onChange={setDayStart} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <TimeInput label="Day End" value={dayEnd} onChange={setDayEnd} />
                            </View>
                        </View>

                        {/* Duration quick picks */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Slot Duration (min)
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[15, 20, 30, 45, 60].map(d => (
                                    <TouchableOpacity
                                        key={d}
                                        onPress={() => setSlotDuration(String(d))}
                                        style={{
                                            flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: slotDuration === String(d) ? colors.primary : '#f1f5f9',
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: slotDuration === String(d) ? '#fff' : '#64748b' }}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Break duration */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Break Between Slots (min)
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {[0, 5, 10, 15].map(b => (
                                    <TouchableOpacity
                                        key={b}
                                        onPress={() => setBreakDuration(String(b))}
                                        style={{
                                            flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: breakDuration === String(b) ? '#0f172a' : '#f1f5f9',
                                        }}
                                    >
                                        <Text style={{ fontSize: 13, fontWeight: '700', color: breakDuration === String(b) ? '#fff' : '#64748b' }}>{b}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Preview banner */}
                        <View style={{
                            borderRadius: 12, padding: 14, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 10,
                            backgroundColor: slotCount > 0 ? '#f0fdf4' : '#fff7ed',
                            borderWidth: 1, borderColor: slotCount > 0 ? '#bbf7d0' : '#fed7aa',
                        }}>
                            <Layers size={18} color={slotCount > 0 ? '#16a34a' : '#ea580c'} />
                            <Text style={{ fontWeight: '700', fontSize: 14, color: slotCount > 0 ? '#15803d' : '#c2410c' }}>
                                {slotCount > 0
                                    ? `${slotCount} slots will be created`
                                    : 'Invalid settings — 0 slots'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={handleCreate}
                            disabled={isLoading || slotCount <= 0}
                            style={{
                                backgroundColor: slotCount > 0 ? colors.primary : '#94a3b8',
                                borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center',
                                opacity: isLoading ? 0.7 : 1,
                            }}
                        >
                            {isLoading ? <ActivityIndicator color="#fff" /> : (
                                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                                    {slotCount > 0 ? `Create ${slotCount} Slots` : 'Adjust Settings'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DoctorScheduleScreen() {
    const user = useSelector((s: any) => s.auth.user);
    const doctorId: string = user?.doctorId ?? user?.id ?? '';

    const [selectedDate, setSelectedDate] = useState(() => getTodayStr());
    const [stripStartDate, setStripStartDate] = useState(() => getTodayStr());
    const [showSingle, setShowSingle] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const flatListRef = useRef<FlatList>(null);
    const dynamicDays = useMemo(() => buildDays(stripStartDate), [stripStartDate]);

    // Whenever the calendar picker changes the strip's center date, scroll the list back to center (index 14)
    useEffect(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: 14, animated: true, viewPosition: 0.5 });
        }, 100);
    }, [stripStartDate]);

    // Month/Year picker state
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const YEARS = Array.from({ length: 201 }, (_, i) => 1900 + i); // 1900–2100
    const parsedSelected = new Date(selectedDate + 'T12:00:00');
    const [pickerMonth, setPickerMonth] = useState(parsedSelected.getMonth());
    const [pickerYear, setPickerYear] = useState(parsedSelected.getFullYear());

    const applyMonthYear = () => {
        const dateStr = `${pickerYear}-${String(pickerMonth + 1).padStart(2, '0')}-01`;
        setSelectedDate(dateStr);
        setStripStartDate(dateStr);
        setShowCalendarModal(false);
    };

    const { data: slotsData, isLoading, refetch } = useGetAllSlotsByDateQuery(
        { doctorId, date: selectedDate },
        { skip: !doctorId }
    );

    const [deleteSlot] = useDeleteSlotMutation();
    const [deleteSlotsByDate] = useDeleteSlotsByDateMutation();

    const slots: any[] = slotsData?.data ?? [];
    const availableCount = slots.filter(s => s.isAvailable).length;
    const bookedCount = slots.length - availableCount;

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleDeleteSlot = useCallback((slotId: string) => {
        Alert.alert('Delete Slot', 'Remove this available slot?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    try { await deleteSlot(slotId).unwrap(); }
                    catch { Alert.alert('Error', 'Could not delete slot.'); }
                },
            },
        ]);
    }, [deleteSlot]);

    const handleClearDay = useCallback(() => {
        if (slots.length === 0) { Alert.alert('No Slots', 'There are no slots to clear on this date.'); return; }
        if (bookedCount > 0) {
            Alert.alert('Cannot Clear', `${bookedCount} slot(s) are booked. Only available (unbooked) slots can be cleared.`);
            return;
        }
        Alert.alert(
            'Clear All Slots',
            `Remove all ${slots.length} slots for ${selectedDate}?\nThis cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All', style: 'destructive',
                    onPress: async () => {
                        try { await deleteSlotsByDate({ doctorId, date: selectedDate }).unwrap(); }
                        catch { Alert.alert('Error', 'Could not delete slots.'); }
                    },
                },
            ]
        );
    }, [slots, bookedCount, doctorId, selectedDate, deleteSlotsByDate]);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Schedule</Text>
                
                <TouchableOpacity 
                    onPress={() => setShowCalendarModal(true)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: `${colors.primary}10`, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}
                >
                    <CalendarIcon size={16} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Text>
                    <ChevronDown size={14} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Date strip */}
            <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <FlatList
                    ref={flatListRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={dynamicDays}
                    keyExtractor={item => item.dateStr}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
                    initialScrollIndex={14}
                    getItemLayout={(_, index) => ({ length: 60, offset: 60 * index, index })}
                    renderItem={({ item: day, index }) => {
                        const isSelected = day.dateStr === selectedDate;
                        // Add margin right except on the last item to act like gap parameter
                        const isLast = index === dynamicDays.length - 1;
                        return (
                            <TouchableOpacity
                                onPress={() => setSelectedDate(day.dateStr)}
                                style={{
                                    width: 52, height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                                    marginRight: isLast ? 0 : 8,
                                    backgroundColor: isSelected ? colors.primary : '#f8fafc',
                                    shadowColor: isSelected ? colors.primary : 'transparent',
                                    shadowOpacity: 0.3, shadowRadius: 6, elevation: isSelected ? 4 : 0,
                                }}
                            >
                                <Text style={{ fontSize: 11, fontWeight: '700', textTransform: 'uppercase', color: isSelected ? 'rgba(255,255,255,0.85)' : '#94a3b8' }}>
                                    {day.dayName}
                                </Text>
                                <Text style={{ fontSize: 20, fontWeight: '800', color: isSelected ? '#fff' : '#334155', marginTop: 2 }}>
                                    {day.dayNum}
                                </Text>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>

            {/* Stats bar */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, gap: 12 }}>
                <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: colors.primary }}>{availableCount}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2 }}>Open</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>{bookedCount}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2 }}>Booked</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#f1f5f9' }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#334155' }}>{slots.length}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b', marginTop: 2 }}>Total</Text>
                </View>
            </View>

            {/* Slot Grid */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 180 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
            >
                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
                ) : slots.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                            <CalendarDays size={32} color={colors.primary} />
                        </View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 6 }}>No Slots Yet</Text>
                        <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 }}>
                            Add a single slot with the{'\n'}+ button, or bulk-create below.
                        </Text>
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {slots.map((slot: any) => {
                            const isBooked = !slot.isAvailable;
                            return (
                                <TouchableOpacity
                                    key={slot.slotId}
                                    onPress={() => !isBooked && handleDeleteSlot(slot.slotId)}
                                    onLongPress={() => !isBooked && handleDeleteSlot(slot.slotId)}
                                    activeOpacity={isBooked ? 1 : 0.75}
                                    style={{
                                        width: '47.5%',
                                        borderRadius: 14,
                                        padding: 14,
                                        backgroundColor: isBooked ? colors.primary : '#fff',
                                        borderWidth: isBooked ? 0 : 1.5,
                                        borderStyle: isBooked ? 'solid' : 'dashed',
                                        borderColor: `${colors.primary}55`,
                                        shadowColor: isBooked ? colors.primary : '#000',
                                        shadowOpacity: isBooked ? 0.25 : 0.04,
                                        shadowRadius: 6, elevation: isBooked ? 4 : 1,
                                    }}
                                >
                                    {/* Status badge */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <View style={{
                                            paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
                                            backgroundColor: isBooked ? 'rgba(255,255,255,0.2)' : `${colors.primary}15`,
                                        }}>
                                            <Text style={{ fontSize: 10, fontWeight: '800', textTransform: 'uppercase', color: isBooked ? '#fff' : colors.primary }}>
                                                {isBooked ? '🔒 Booked' : '✓ Open'}
                                            </Text>
                                        </View>
                                        {!isBooked && (
                                            <TouchableOpacity onPress={() => handleDeleteSlot(slot.slotId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                <Trash2 size={13} color={`${colors.primary}70`} />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {/* Time range */}
                                    <Text style={{ fontSize: 15, fontWeight: '800', color: isBooked ? '#fff' : '#0f172a' }}>
                                        {formatTime(slot.startTime)}
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: '500', color: isBooked ? 'rgba(255,255,255,0.7)' : '#64748b', marginTop: 2 }}>
                                        → {formatTime(slot.endTime)}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: isBooked ? 'rgba(255,255,255,0.55)' : '#94a3b8', marginTop: 4 }}>
                                        {slot.durationMinutes} min
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Bottom action bar */}
            <View style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9',
                paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 28,
                flexDirection: 'row', gap: 10, alignItems: 'center',
            }}>
                {/* Clear Day */}
                <TouchableOpacity
                    onPress={handleClearDay}
                    style={{
                        height: 48, paddingHorizontal: 16, borderRadius: 12,
                        borderWidth: 1.5, borderColor: '#fee2e2',
                        backgroundColor: '#fff5f5', alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'row', gap: 6,
                    }}
                >
                    <Trash2 size={15} color="#ef4444" />
                    <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 13 }}>Clear Day</Text>
                </TouchableOpacity>

                {/* Bulk Create */}
                <TouchableOpacity
                    onPress={() => setShowBulk(true)}
                    style={{
                        flex: 1, height: 48, borderRadius: 12,
                        borderWidth: 1.5, borderColor: `${colors.primary}40`,
                        backgroundColor: `${colors.primary}10`, alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'row', gap: 6,
                    }}
                >
                    <Layers size={17} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Bulk Create</Text>
                </TouchableOpacity>
            </View>

            {/* FAB - Add single slot */}
            <TouchableOpacity
                onPress={() => setShowSingle(true)}
                style={{
                    position: 'absolute', right: 20, bottom: 104,
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: colors.primary,
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: colors.primary, shadowOpacity: 0.45,
                    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 8,
                }}
            >
                <Plus size={26} color="#fff" />
            </TouchableOpacity>

            {/* Modals */}
            <SingleSlotModal
                visible={showSingle}
                onClose={() => setShowSingle(false)}
                doctorId={doctorId}
                selectedDate={selectedDate}
                onCreate={refetch}
            />
            <BulkSlotModal
                visible={showBulk}
                onClose={() => setShowBulk(false)}
                doctorId={doctorId}
                selectedDate={selectedDate}
                onCreate={refetch}
            />

            {/* Pure-JS Month/Year Picker Modal */}
            <Modal visible={showCalendarModal} transparent animationType="slide" onRequestClose={() => setShowCalendarModal(false)}>
                <TouchableOpacity activeOpacity={1} onPress={() => setShowCalendarModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <TouchableOpacity activeOpacity={1} style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 36 }}>
                        {/* Handle + Title */}
                        <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#e2e8f0', marginBottom: 12 }} />
                            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>Jump to Month</Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#f1f5f9', marginBottom: 8 }} />

                        {/* Two-column picker */}
                        <View style={{ flexDirection: 'row', height: 240 }}>
                            {/* Month column */}
                            <FlatList
                                style={{ flex: 1 }}
                                data={MONTHS}
                                keyExtractor={(_, i) => String(i)}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 8 }}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        onPress={() => setPickerMonth(index)}
                                        style={{
                                            paddingVertical: 12, paddingHorizontal: 16, marginHorizontal: 8, borderRadius: 10,
                                            backgroundColor: pickerMonth === index ? `${colors.primary}15` : 'transparent',
                                        }}
                                    >
                                        <Text style={{ fontSize: 15, fontWeight: pickerMonth === index ? '800' : '500', color: pickerMonth === index ? colors.primary : '#475569', textAlign: 'center' }}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />

                            {/* Divider */}
                            <View style={{ width: 1, backgroundColor: '#f1f5f9', marginVertical: 12 }} />

                            {/* Year column — scrollable 1900-2100 */}
                            <FlatList
                                style={{ flex: 0.6 }}
                                data={YEARS}
                                keyExtractor={item => String(item)}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ paddingVertical: 8 }}
                                initialScrollIndex={Math.max(0, YEARS.indexOf(pickerYear))}
                                getItemLayout={(_, index) => ({ length: 44, offset: 44 * index, index })}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => setPickerYear(item)}
                                        style={{
                                            height: 44, paddingHorizontal: 10, marginHorizontal: 8, borderRadius: 10,
                                            alignItems: 'center', justifyContent: 'center',
                                            backgroundColor: pickerYear === item ? `${colors.primary}15` : 'transparent',
                                        }}
                                    >
                                        <Text style={{ fontSize: 15, fontWeight: pickerYear === item ? '800' : '500', color: pickerYear === item ? colors.primary : '#475569', textAlign: 'center' }}>
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>

                        {/* Apply button */}
                        <TouchableOpacity
                            onPress={applyMonthYear}
                            style={{ backgroundColor: colors.primary, marginHorizontal: 20, marginTop: 12, borderRadius: 14, height: 50, alignItems: 'center', justifyContent: 'center' }}
                        >
                            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
                                Go to {MONTHS[pickerMonth]} {pickerYear}
                            </Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
