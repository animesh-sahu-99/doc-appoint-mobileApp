import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import {
    ArrowLeft,
    Stethoscope,
    Star,
    MapPin,
    Clock,
    Briefcase,
    GraduationCap,
    ShieldCheck,
    BadgeDollarSign,
    Heart,
    Eye,
    Brain,
    Bone,
    Baby,
    Smile,
} from 'lucide-react-native';
import { useGetDoctorByIdQuery } from '../../services/api';
import { colors } from '../../theme/colors';
import { RootStackParamList } from '../../navigation/types';

type DoctorProfileRouteProp = RouteProp<RootStackParamList, 'DoctorProfile'>;

const SPEC_ICONS: Record<string, React.ReactNode> = {
    CARDIOLOGIST: <Heart size={20} color={colors.primary} />,
    NEUROLOGIST: <Brain size={20} color={colors.primary} />,
    OPHTHALMOLOGIST: <Eye size={20} color={colors.primary} />,
    ORTHOPEDIC_SURGEON: <Bone size={20} color={colors.primary} />,
    PEDIATRICIAN: <Baby size={20} color={colors.primary} />,
    DENTIST: <Smile size={20} color={colors.primary} />,
    GENERAL_PRACTITIONER: <Stethoscope size={20} color={colors.primary} />,
};
const DEFAULT_ICON = <Stethoscope size={20} color={colors.primary} />;

export default function PatientDoctorProfileScreen() {
    const route = useRoute<DoctorProfileRouteProp>();
    const navigation = useNavigation<any>();
    const { doctorId } = route.params;

    const { data, isLoading } = useGetDoctorByIdQuery(doctorId);
    const doctor = data?.data;

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!doctor) {
        return (
            <View style={{ flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: '#64748b' }}>Doctor not found.</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const initials = (doctor.name ?? 'D')
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const specIcon = SPEC_ICONS[doctor.specialization ?? ''] ?? DEFAULT_ICON;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
            {/* Dynamic Header */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    backgroundColor: '#fff',
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                    ...Platform.select({
                        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
                        android: { elevation: 2 },
                    })
                }}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ padding: 8, marginLeft: -8 }}
                >
                    <ArrowLeft size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
                    Doctor Details
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Top Profile Card */}
                <View style={{ backgroundColor: '#fff', padding: 24, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        {/* Avatar */}
                        <View
                            style={{
                                width: 90,
                                height: 90,
                                borderRadius: 24,
                                backgroundColor: `${colors.primary}12`,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 2,
                                borderColor: `${colors.primary}30`,
                            }}
                        >
                            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 30 }}>
                                {initials}
                            </Text>
                        </View>

                        {/* Info */}
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', flexShrink: 1 }}>
                                    Dr. {doctor.name}
                                </Text>
                                {doctor.isActive && <ShieldCheck size={18} color="#16a34a" />}
                            </View>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 }}>
                                {doctor.specializationDisplayName ?? doctor.specialization}
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9c3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 }}>
                                    <Star size={12} color="#eab308" fill="#eab308" />
                                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#854d0e' }}>4.8</Text>
                                </View>
                                <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>
                                    (120+ reviews)
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: -20, gap: 12 }}>
                    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                            <Briefcase size={20} color={colors.primary} />
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>{doctor.experienceYears ?? 0}+</Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 2 }}>Years Exp.</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                            {specIcon}
                        </View>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>{doctor.specialization?.replace('_', ' ') ?? 'Specialist'}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: '#94a3b8', marginTop: 2 }}>Field</Text>
                    </View>
                </View>

                {/* Content Details */}
                <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 24 }}>
                    {/* About */}
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10 }}>About Doctor</Text>
                        <Text style={{ fontSize: 14, color: '#475569', lineHeight: 22 }}>
                            {doctor.about || `Dr. ${doctor.name} is a highly qualified ${doctor.specializationDisplayName?.toLowerCase()} with ${doctor.experienceYears} years of experience.`}
                        </Text>
                    </View>

                    {/* Details List */}
                    <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 20, gap: 16 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                                <GraduationCap size={18} color="#64748b" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 2 }}>Qualifications</Text>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155' }}>{doctor.qualification ?? '—'}</Text>
                            </View>
                        </View>
                        <View style={{ height: 1, backgroundColor: '#f1f5f9', marginLeft: 48 }} />

                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' }}>
                                <BadgeDollarSign size={18} color="#64748b" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 2 }}>Consultation Fee</Text>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>₹ {doctor.consultationFee ?? '--'}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Floating Bottom Bar */}
            <View
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: '#fff',
                    paddingHorizontal: 20,
                    paddingTop: 16,
                    paddingBottom: 32, // safe area 
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                }}
            >
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>Consultation Fee</Text>
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>₹ {doctor.consultationFee ?? '--'}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('BookingModal', { doctorId: doctor.doctorId })}
                    style={{
                        backgroundColor: colors.primary,
                        paddingHorizontal: 24,
                        paddingVertical: 16,
                        borderRadius: 16,
                        flex: 1.5,
                        alignItems: 'center',
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        elevation: 4,
                    }}
                >
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Book Now</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
