import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Switch } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '../../../theme/colors';

export interface FilterState {
    specialization: string | null;
    minFee: number | null;
    maxFee: number | null;
    minExperience: number | null;
    availableOnly: boolean;
}

interface FilterBottomSheetProps {
    visible: boolean;
    onClose: () => void;
    currentFilters: FilterState;
    onApply: (filters: FilterState) => void;
    specializations: any[];
}

const EXP_OPTIONS = [
    { label: 'Any', value: null },
    { label: '2+ Years', value: 2 },
    { label: '5+ Years', value: 5 },
    { label: '10+ Years', value: 10 },
];

const FEE_RANGES = [
    { label: 'Any', min: null, max: null },
    { label: 'Free', min: 0, max: 0 },
    { label: 'Under ₹500', min: null, max: 500 },
    { label: '₹500 - ₹1000', min: 500, max: 1000 },
    { label: '₹1000+', min: 1000, max: null },
];

export function FilterBottomSheet({ visible, onClose, currentFilters, onApply, specializations }: FilterBottomSheetProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);

    // Sync when opened
    React.useEffect(() => {
        if (visible) setLocalFilters(currentFilters);
    }, [visible, currentFilters]);

    const handleApply = () => {
        onApply(localFilters);
        onClose();
    };

    const handleClear = () => {
        const reset: FilterState = { specialization: null, minFee: null, maxFee: null, minExperience: null, availableOnly: false };
        setLocalFilters(reset);
        onApply(reset);
        onClose();
    };

    const isFeeSelected = (range: any) => localFilters.minFee === range.min && localFilters.maxFee === range.max;

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%' }}>
                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f1f5f9' }}>
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>Filters</Text>
                        <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
                            <X size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
                        {/* Specialization */}
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Specialization</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                            <TouchableOpacity
                                onPress={() => setLocalFilters({ ...localFilters, specialization: null })}
                                style={{
                                    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                                    backgroundColor: localFilters.specialization === null ? colors.primary : '#f8fafc',
                                    borderWidth: 1, borderColor: localFilters.specialization === null ? colors.primary : '#e2e8f0',
                                }}
                            >
                                <Text style={{ color: localFilters.specialization === null ? '#fff' : '#64748b', fontWeight: '600' }}>All</Text>
                            </TouchableOpacity>
                            {specializations.map(s => (
                                <TouchableOpacity
                                    key={s.code}
                                    onPress={() => setLocalFilters({ ...localFilters, specialization: s.code })}
                                    style={{
                                        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                                        backgroundColor: localFilters.specialization === s.code ? colors.primary : '#f8fafc',
                                        borderWidth: 1, borderColor: localFilters.specialization === s.code ? colors.primary : '#e2e8f0',
                                    }}
                                >
                                    <Text style={{ color: localFilters.specialization === s.code ? '#fff' : '#64748b', fontWeight: '600' }}>{s.displayName}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Fee Range */}
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Consultation Fee</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                            {FEE_RANGES.map((range, i) => (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => setLocalFilters({ ...localFilters, minFee: range.min, maxFee: range.max })}
                                    style={{
                                        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                                        backgroundColor: isFeeSelected(range) ? colors.primary : '#f8fafc',
                                        borderWidth: 1, borderColor: isFeeSelected(range) ? colors.primary : '#e2e8f0',
                                    }}
                                >
                                    <Text style={{ color: isFeeSelected(range) ? '#fff' : '#64748b', fontWeight: '600' }}>{range.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Experience */}
                        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Minimum Experience</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                            {EXP_OPTIONS.map((exp, i) => (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => setLocalFilters({ ...localFilters, minExperience: exp.value })}
                                    style={{
                                        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                                        backgroundColor: localFilters.minExperience === exp.value ? colors.primary : '#f8fafc',
                                        borderWidth: 1, borderColor: localFilters.minExperience === exp.value ? colors.primary : '#e2e8f0',
                                    }}
                                >
                                    <Text style={{ color: localFilters.minExperience === exp.value ? '#fff' : '#64748b', fontWeight: '600' }}>{exp.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Availability */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9' }}>
                            <View>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>Available Only</Text>
                                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Only show doctors with open slots</Text>
                            </View>
                            <Switch
                                value={localFilters.availableOnly}
                                onValueChange={(v) => setLocalFilters({ ...localFilters, availableOnly: v })}
                                trackColor={{ false: '#e2e8f0', true: `${colors.primary}50` }}
                                thumbColor={localFilters.availableOnly ? colors.primary : '#fff'}
                            />
                        </View>
                    </ScrollView>

                    {/* Footer buttons */}
                    <View style={{ flexDirection: 'row', padding: 20, paddingTop: 10, borderTopWidth: 1, borderColor: '#f1f5f9', backgroundColor: '#fff', gap: 12 }}>
                        <TouchableOpacity onPress={handleClear} style={{ flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#f1f5f9' }}>
                            <Text style={{ color: '#475569', fontWeight: '700', fontSize: 15 }}>Clear</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleApply} style={{ flex: 2, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary }}>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
