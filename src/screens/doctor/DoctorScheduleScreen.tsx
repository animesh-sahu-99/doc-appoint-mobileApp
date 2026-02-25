import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    Platform,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Settings, Plus, Layers, Trash2, X } from 'lucide-react-native';
import { useSelector } from 'react-redux';
import {
    useGetAllSlotsByDateQuery,
    useCreateSlotMutation,
    useCreateBulkSlotsMutation,
    useDeleteSlotMutation,
    useDeleteSlotsByDateMutation,
} from '../../services/api';
import { colors } from '../../theme/colors';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns an array of 14 day objects (today + 13 ahead) */
const buildDays = () => {
    const days: { label: string; dateStr: string; dayNum: number; dayName: string }[] = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
        ).padStart(2, '0')}`;
        days.push({
            label: dateStr,
            dateStr,
            dayNum: d.getDate(),
            dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        });
    }
    return days;
};

const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const DAYS = buildDays();

// ─── Single Slot Modal ────────────────────────────────────────────────────────

interface SingleSlotModalProps {
    visible: boolean;
    onClose: () => void;
    doctorId: string;
    selectedDate: string;
    onCreate: () => void;
}

function SingleSlotModal({
    visible, onClose, doctorId, selectedDate, onCreate,
}: SingleSlotModalProps) {
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('09:30');
    const [duration, setDuration] = useState('30');
    const [createSlot, { isLoading }] = useCreateSlotMutation();

    const handleCreate = async () => {
        try {
            await createSlot({
                doctorId,
                slotDate: selectedDate,
                startTime,
                endTime,
                durationMinutes: parseInt(duration, 10),
            }).unwrap();
            onCreate();
            onClose();
        } catch (e: any) {
            Alert.alert('Error', e?.data?.message ?? 'Failed to create slot.');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/40">
                <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-lg font-extrabold text-slate-900 dark:text-white">
                            Add Single Slot
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={22} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-slate-500 text-sm font-medium mb-1">Date</Text>
                    <View className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 mb-4">
                        <Text className="text-slate-800 dark:text-slate-100 font-semibold">{selectedDate}</Text>
                    </View>

                    <Text className="text-slate-500 text-sm font-medium mb-1">Start Time (HH:MM)</Text>
                    <TextInput
                        value={startTime}
                        onChangeText={setStartTime}
                        placeholder="09:00"
                        className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 mb-4"
                    />

                    <Text className="text-slate-500 text-sm font-medium mb-1">End Time (HH:MM)</Text>
                    <TextInput
                        value={endTime}
                        onChangeText={setEndTime}
                        placeholder="09:30"
                        className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 mb-4"
                    />

                    <Text className="text-slate-500 text-sm font-medium mb-1">Duration (minutes)</Text>
                    <TextInput
                        value={duration}
                        onChangeText={setDuration}
                        keyboardType="numeric"
                        placeholder="30"
                        className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 mb-6"
                    />

                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={isLoading}
                        className="rounded-xl py-4 items-center"
                        style={{ backgroundColor: colors.primary }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-base">Create Slot</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Bulk Slot Modal ──────────────────────────────────────────────────────────

interface BulkSlotModalProps {
    visible: boolean;
    onClose: () => void;
    doctorId: string;
    selectedDate: string;
    onCreate: () => void;
}

function BulkSlotModal({
    visible, onClose, doctorId, selectedDate, onCreate,
}: BulkSlotModalProps) {
    const [dayStart, setDayStart] = useState('09:00');
    const [dayEnd, setDayEnd] = useState('17:00');
    const [slotDuration, setSlotDuration] = useState('30');
    const [breakDuration, setBreakDuration] = useState('0');
    const [createBulk, { isLoading }] = useCreateBulkSlotsMutation();

    const handleCreate = async () => {
        try {
            await createBulk({
                doctorId,
                slotDate: selectedDate,
                dayStartTime: dayStart,
                dayEndTime: dayEnd,
                slotDurationMinutes: parseInt(slotDuration, 10),
                breakDurationMinutes: parseInt(breakDuration, 10),
            }).unwrap();
            onCreate();
            onClose();
        } catch (e: any) {
            Alert.alert('Error', e?.data?.message ?? 'Failed to create slots.');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/40">
                <View className="bg-white dark:bg-slate-800 rounded-t-3xl p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-lg font-extrabold text-slate-900 dark:text-white">
                            Bulk Create Slots
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={22} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-slate-500 text-sm font-medium mb-1">Date</Text>
                    <View className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 mb-4">
                        <Text className="text-slate-800 dark:text-slate-100 font-semibold">{selectedDate}</Text>
                    </View>

                    {[
                        { label: 'Day Start Time (HH:MM)', val: dayStart, set: setDayStart, ph: '09:00' },
                        { label: 'Day End Time (HH:MM)', val: dayEnd, set: setDayEnd, ph: '17:00' },
                        { label: 'Slot Duration (minutes)', val: slotDuration, set: setSlotDuration, ph: '30', numeric: true },
                        { label: 'Break Between Slots (minutes)', val: breakDuration, set: setBreakDuration, ph: '0', numeric: true },
                    ].map(({ label, val, set, ph, numeric }) => (
                        <View key={label}>
                            <Text className="text-slate-500 text-sm font-medium mb-1">{label}</Text>
                            <TextInput
                                value={val}
                                onChangeText={set}
                                placeholder={ph}
                                keyboardType={numeric ? 'numeric' : 'default'}
                                className="bg-slate-100 dark:bg-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-100 mb-4"
                            />
                        </View>
                    ))}

                    <TouchableOpacity
                        onPress={handleCreate}
                        disabled={isLoading}
                        className="rounded-xl py-4 items-center mt-2"
                        style={{ backgroundColor: colors.primary }}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text className="text-white font-bold text-base">Create Slots</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DoctorScheduleScreen({ navigation }: any) {
    const user = useSelector((s: any) => s.auth.user);
    const doctorId: string = user?.doctorId ?? user?.id ?? '';

    const [selectedDate, setSelectedDate] = useState(DAYS[0].dateStr);
    const [showSingle, setShowSingle] = useState(false);
    const [showBulk, setShowBulk] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const { data: slotsData, isLoading, refetch } = useGetAllSlotsByDateQuery(
        { doctorId, date: selectedDate },
        { skip: !doctorId }
    );

    const [deleteSlot] = useDeleteSlotMutation();
    const [deleteSlotsByDate] = useDeleteSlotsByDateMutation();

    const slots: any[] = slotsData?.data ?? [];
    const availableCount = slots.filter((s) => s.isAvailable).length;

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleDeleteSlot = (slotId: string) => {
        Alert.alert('Delete Slot', 'Remove this available slot?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteSlot(slotId).unwrap();
                    } catch {
                        Alert.alert('Error', 'Could not delete slot.');
                    }
                },
            },
        ]);
    };

    const handleDeleteAllSlots = () => {
        Alert.alert('Delete All Slots', `Remove all slots for ${selectedDate}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete All',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await deleteSlotsByDate({ doctorId, date: selectedDate }).unwrap();
                    } catch {
                        Alert.alert('Error', 'Could not delete slots.');
                    }
                },
            },
        ]);
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-background-dark">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <Text className="text-lg font-extrabold text-slate-900 dark:text-white flex-1 text-center">
                    Schedule Management
                </Text>
                <TouchableOpacity onPress={handleDeleteAllSlots}>
                    <Settings size={22} color="#64748b" />
                </TouchableOpacity>
            </View>

            {/* Date Strip */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 10 }}
                className="border-b border-slate-50 dark:border-slate-800 flex-shrink-0"
            >
                {DAYS.map((day) => {
                    const isSelected = day.dateStr === selectedDate;
                    return (
                        <TouchableOpacity
                            key={day.dateStr}
                            onPress={() => setSelectedDate(day.dateStr)}
                            className="w-14 h-16 rounded-xl items-center justify-center"
                            style={{
                                backgroundColor: isSelected ? `${colors.primary}18` : '#f8fafc',
                                borderWidth: isSelected ? 1.5 : 0,
                                borderColor: isSelected ? colors.primary : 'transparent',
                            }}
                        >
                            <Text
                                className="text-xs font-semibold uppercase"
                                style={{ color: isSelected ? colors.primary : '#94a3b8' }}
                            >
                                {day.dayName}
                            </Text>
                            <Text
                                className="text-lg font-bold"
                                style={{ color: isSelected ? colors.primary : '#334155' }}
                            >
                                {day.dayNum}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 160, paddingTop: 4 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Section Header */}
                <View className="flex-row items-center justify-between px-5 py-4">
                    <Text className="text-lg font-bold text-slate-900 dark:text-white">
                        Slots for {selectedDate}
                    </Text>
                    <Text className="text-sm font-semibold" style={{ color: colors.primary }}>
                        {slots.length} Total · {availableCount} Open
                    </Text>
                </View>

                {isLoading ? (
                    <ActivityIndicator size="large" color={colors.primary} className="mt-10" />
                ) : slots.length === 0 ? (
                    <View className="mx-5 rounded-2xl bg-slate-50 dark:bg-slate-800 p-10 items-center">
                        <Plus size={36} color="#94a3b8" />
                        <Text className="text-slate-400 font-semibold mt-3 text-center">
                            No slots for this date.{'\n'}Tap + to create one.
                        </Text>
                    </View>
                ) : (
                    <View
                        className="px-5"
                        style={{
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 12,
                        }}
                    >
                        {slots.map((slot: any) => {
                            const isBooked = !slot.isAvailable;
                            return (
                                <TouchableOpacity
                                    key={slot.slotId}
                                    onLongPress={() => !isBooked && handleDeleteSlot(slot.slotId)}
                                    activeOpacity={isBooked ? 1 : 0.7}
                                    style={{
                                        width: '47%',
                                        borderRadius: 12,
                                        padding: 12,
                                        backgroundColor: isBooked ? colors.primary : '#fff',
                                        borderWidth: isBooked ? 0 : 2,
                                        borderStyle: 'dashed',
                                        borderColor: `${colors.primary}66`,
                                    }}
                                >
                                    <View className="flex-row items-center justify-between mb-1">
                                        <Text
                                            className="text-xs font-bold uppercase tracking-wider"
                                            style={{ color: isBooked ? 'rgba(255,255,255,0.85)' : colors.primary }}
                                        >
                                            {formatTime(slot.startTime)}
                                        </Text>
                                        {isBooked && <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>🔒</Text>}
                                        {!isBooked && (
                                            <TouchableOpacity onPress={() => handleDeleteSlot(slot.slotId)}>
                                                <Trash2 size={13} color={`${colors.primary}80`} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text
                                        className="text-sm font-bold"
                                        style={{ color: isBooked ? '#fff' : colors.primary }}
                                    >
                                        {isBooked ? 'Booked' : 'Available'}
                                    </Text>
                                    <Text
                                        className="text-[10px] font-medium uppercase mt-0.5"
                                        style={{ color: isBooked ? 'rgba(255,255,255,0.7)' : `${colors.primary}80` }}
                                    >
                                        {slot.durationMinutes} min
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                onPress={() => setShowSingle(true)}
                className="absolute right-5 bottom-28 w-14 h-14 rounded-full items-center justify-center shadow-xl"
                style={{ backgroundColor: colors.primary }}
            >
                <Plus size={28} color="#fff" />
            </TouchableOpacity>

            {/* Bulk Button */}
            <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-5 py-4">
                <TouchableOpacity
                    onPress={() => setShowBulk(true)}
                    className="flex-row items-center justify-center rounded-xl h-12 border"
                    style={{ borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}10` }}
                >
                    <Layers size={20} color={colors.primary} />
                    <Text className="ml-2 font-bold text-base" style={{ color: colors.primary }}>
                        Bulk Create Slots
                    </Text>
                </TouchableOpacity>
            </View>

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
        </SafeAreaView>
    );
}
