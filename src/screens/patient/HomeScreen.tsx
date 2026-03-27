import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  Bell,
  Calendar,
  ChevronRight,
  Stethoscope,
  Heart,
  Eye,
  Brain,
  Bone,
  Baby,
  Smile,
  SlidersHorizontal,
  Star,
  BadgeDollarSign,
  Briefcase,
} from 'lucide-react-native';
import { useSelector } from 'react-redux';
import {
  useGetSpecializationsQuery,
  useGetUpcomingPatientAppointmentsQuery,
  useGetUnreadNotificationCountQuery,
  useSearchDoctorsQuery,
} from '../../services/api';
import { colors } from '../../theme/colors';
import { FilterBottomSheet, FilterState } from './components/FilterBottomSheet';

// ─── Specialization icon map ──────────────────────────────────────────────────
const SPEC_ICONS: Record<string, React.ReactNode> = {
  CARDIOLOGIST: <Heart size={18} />,
  NEUROLOGIST: <Brain size={18} />,
  OPHTHALMOLOGIST: <Eye size={18} />,
  ORTHOPEDIC_SURGEON: <Bone size={18} />,
  PEDIATRICIAN: <Baby size={18} />,
  DENTIST: <Smile size={18} />,
  GENERAL_PRACTITIONER: <Stethoscope size={18} />,
};
const DEFAULT_ICON = <Stethoscope size={18} />;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatTime = (t: string) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

// ─── Inline Doctor Card ───────────────────────────────────────────────────────
function DoctorCard({ doctor, onBookPress, onViewPress }: any) {
  const initials = (doctor.name ?? 'D')
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <TouchableOpacity
      onPress={onViewPress}
      activeOpacity={0.92}
      style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 14 }}>
        {/* Avatar */}
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            backgroundColor: `${colors.primary}15`,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: `${colors.primary}25`,
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 20 }}>
            {initials}
          </Text>
        </View>

        {/* Details */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 15, color: '#0f172a' }} numberOfLines={1}>
                Dr. {doctor.name}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '500', marginTop: 2 }}>
                {doctor.specializationDisplayName ?? doctor.specialization}
              </Text>
            </View>
            {/* Active badge */}
            {doctor.isActive && (
              <View style={{ backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 }}>
                <Text style={{ color: '#16a34a', fontSize: 10, fontWeight: '700' }}>Available</Text>
              </View>
            )}
          </View>

          {/* Experience + Fee */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 14 }}>
            <View>
              <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Experience
              </Text>
              <Text style={{ color: '#334155', fontWeight: '700', fontSize: 13, marginTop: 1 }}>
                {doctor.experienceYears ?? '—'} yrs
              </Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: '#e2e8f0' }} />
            <View>
              <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Fee
              </Text>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13, marginTop: 1 }}>
                ₹ {doctor.consultationFee}
              </Text>
            </View>
            <View style={{ width: 1, height: 24, backgroundColor: '#e2e8f0' }} />
            <View>
              <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Qual.
              </Text>
              <Text style={{ color: '#334155', fontWeight: '600', fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                {(doctor.qualification ?? '').split(',')[0]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Book button */}
      <TouchableOpacity
        onPress={onBookPress}
        style={{
          marginTop: 12,
          backgroundColor: `${colors.primary}10`,
          borderRadius: 12,
          paddingVertical: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>
          Book Appointment
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const user = useSelector((s: any) => s.auth.user);
  const patientId: string = user?.patientId ?? user?.id ?? '';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    specialization: null,
    minFee: null,
    maxFee: null,
    minExperience: null,
    availableOnly: false,
  });

  // Debounce search text
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // Combine search + structured filters for the API query
  const apiFilters = useMemo(() => {
    const payload: any = { ...filters };
    if (debouncedSearch.trim()) payload.name = debouncedSearch.trim();
    // Remove nulls so RTK/Axios doesn't send "minFee=null"
    Object.keys(payload).forEach(key => {
      if (payload[key] === null) delete payload[key];
    });
    return payload;
  }, [filters, debouncedSearch]);

  // API calls
  const { data: specsData, isLoading: loadingSpecs } = useGetSpecializationsQuery();
  const { data: searchData, isLoading: loadingSearch, refetch: refetchSearch, isFetching } = useSearchDoctorsQuery(apiFilters);
  const { data: upcomingData } = useGetUpcomingPatientAppointmentsQuery(patientId, { skip: !patientId });
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined);

  const specializations: any[] = specsData?.data ?? [];
  const displayedDoctors: any[] = searchData?.data ?? [];
  const upcomingAppointments: any[] = upcomingData?.data ?? [];
  const unreadCount = unreadData?.data?.count ?? 0;
  const nextAppt = upcomingAppointments[0] ?? null;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchSearch();
    setRefreshing(false);
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== null && v !== false).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <View>
          <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '600' }}>{getGreeting()},</Text>
          <Text style={{ color: '#0f172a', fontSize: 22, fontWeight: '800', marginTop: 1 }}>
            {user?.name ?? 'Welcome'} 👋
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Bell size={20} color="#334155" />
          {unreadCount > 0 && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 10,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: '#ef4444',
                borderWidth: 2,
                borderColor: '#f1f5f9',
              }}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search bar + Filter Button */}
        <View style={{ paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', gap: 10 }}>
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              borderRadius: 16,
              paddingHorizontal: 14,
              height: 52,
              borderWidth: 1,
              borderColor: '#e2e8f0',
            }}
          >
            <Search size={20} color="#94a3b8" />
            <TextInput
              placeholder="Search doctor name..."
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, marginLeft: 10, fontSize: 14, color: '#0f172a' }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={{ color: '#94a3b8', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            onPress={() => setIsFilterOpen(true)}
            style={{
              width: 52,
              height: 52,
              backgroundColor: activeFilterCount > 0 ? `${colors.primary}15` : '#f8fafc',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: activeFilterCount > 0 ? `${colors.primary}30` : '#e2e8f0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SlidersHorizontal size={20} color={activeFilterCount > 0 ? colors.primary : '#64748b'} />
            {activeFilterCount > 0 && (
              <View style={{
                position: 'absolute', top: -4, right: -4,
                backgroundColor: colors.primary, borderRadius: 10,
                width: 20, height: 20, alignItems: 'center', justifyContent: 'center',
                borderWidth: 2, borderColor: '#fff'
              }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Upcoming appointment banner */}
        {nextAppt && (
          <View style={{ paddingHorizontal: 20, marginBottom: 4 }}>
            <TouchableOpacity
              activeOpacity={0.95}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 22,
                padding: 18,
                overflow: 'hidden',
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View>
                  <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    Upcoming Appointment
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 3 }}>
                    Dr. {nextAppt.doctorName}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 }}>
                    {nextAppt.specialization?.replace('_', ' ')}
                  </Text>
                </View>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={22} color="#fff" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Calendar size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                    {nextAppt.appointmentDate}  ·  {formatTime(nextAppt.startTime)}
                  </Text>
                </View>
                <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Specialization category chips */}
        <View style={{ paddingTop: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0f172a' }}>Categories</Text>
            <TouchableOpacity onPress={() => setIsFilterOpen(true)}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>See All</Text>
            </TouchableOpacity>
          </View>

          {loadingSpecs ? (
            <ActivityIndicator color={colors.primary} style={{ marginLeft: 20 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              <TouchableOpacity
                onPress={() => setFilters({ ...filters, specialization: null })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 999,
                  backgroundColor: !filters.specialization ? colors.primary : '#f1f5f9',
                  gap: 6,
                }}
              >
                <Stethoscope size={16} color={!filters.specialization ? '#fff' : '#64748b'} />
                <Text style={{ color: !filters.specialization ? '#fff' : '#64748b', fontWeight: '700', fontSize: 13 }}>All</Text>
              </TouchableOpacity>

              {specializations.slice(0, 10).map((spec: any) => {
                const isActive = filters.specialization === spec.code;
                const icon = SPEC_ICONS[spec.code] ?? DEFAULT_ICON;
                return (
                  <TouchableOpacity
                    key={spec.code}
                    onPress={() => setFilters({ ...filters, specialization: isActive ? null : spec.code })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 999,
                      backgroundColor: isActive ? colors.primary : '#f1f5f9',
                      gap: 6,
                    }}
                  >
                    {React.cloneElement(icon as React.ReactElement, {
                      color: isActive ? '#fff' : '#64748b',
                      size: 16,
                    })}
                    <Text style={{ color: isActive ? '#fff' : '#64748b', fontWeight: '700', fontSize: 13 }}>
                      {spec.displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Doctor list */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0f172a' }}>
              {filters.specialization
                ? specializations.find((s) => s.code === filters.specialization)?.displayName ?? 'Doctors'
                : 'All Doctors'}
            </Text>
            {(isFetching || loadingSearch) ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>
                {displayedDoctors.length} found
              </Text>
            )}
          </View>

          {(loadingSearch && !isFetching) ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : displayedDoctors.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Stethoscope size={44} color="#cbd5e1" />
              <Text style={{ color: '#64748b', fontWeight: '700', fontSize: 15, marginTop: 16 }}>
                No doctors found
              </Text>
              <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
                Try adjusting your filters
              </Text>
              <TouchableOpacity
                onPress={() => setFilters({ specialization: null, minFee: null, maxFee: null, minExperience: null, availableOnly: false })}
                style={{ marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#f1f5f9', borderRadius: 8 }}
              >
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayedDoctors.map((doctor: any) => (
              <DoctorCard
                key={doctor.doctorId}
                doctor={doctor}
                onViewPress={() =>
                  navigation.navigate('DoctorProfile', { doctorId: doctor.doctorId })
                }
                onBookPress={() =>
                  navigation.navigate('BookingModal', { doctorId: doctor.doctorId })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
      <FilterBottomSheet
        visible={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilters={filters}
        onApply={setFilters}
        specializations={specializations}
      />
    </SafeAreaView>
  );
}
