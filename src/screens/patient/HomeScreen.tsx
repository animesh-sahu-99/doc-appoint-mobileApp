import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, Bell, Video, Calendar, ChevronRight, Stethoscope, Heart, Eye } from 'lucide-react-native';
import SectionHeader from '../../components/ui/SectionHeader';
import CategoryChip from '../../components/ui/CategoryChip';
import DoctorCard from '../../components/ui/DoctorCard';
import { colors } from '../../theme/colors';

// Mock Data
const DOCTORS = [
  {
    id: '1',
    name: 'Dr. Emily Chen',
    specialty: 'Cardiologist • St. Mary\'s',
    rating: 4.8,
    reviewsCount: 120,
    experience: 8,
    about: '...',
    imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
    availability: 'Today',
    fee: 45.00,
    isAvailableToday: true,
  },
  {
    id: '2',
    name: 'Dr. James Wilson',
    specialty: 'Dentist • City Clinic',
    rating: 4.9,
    reviewsCount: 85,
    experience: 12,
    about: '...',
    imageUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
    availability: 'Today',
    fee: 30.00,
    isAvailableToday: true,
  },
];

const HomeScreen = ({ navigation }: any) => {
  const [activeCategory, setActiveCategory] = useState('General');

  const CATEGORIES = [
    { id: '1', label: 'General', icon: <Stethoscope size={20} /> },
    { id: '2', label: 'Cardio', icon: <Heart size={20} /> },
    { id: '3', label: 'Dentist', icon: <Stethoscope size={20} /> }, // Placeholder icon
    { id: '4', label: 'Vision', icon: <Eye size={20} /> },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-background-dark">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 pt-2 pb-4">
          <View>
            <Text className="text-[#637288] text-sm font-medium">Good Morning,</Text>
            <Text className="text-[#111418] dark:text-white text-2xl font-bold">Alex 👋</Text>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity className="w-10 h-10 rounded-full bg-background-light dark:bg-gray-800 items-center justify-center">
              <Bell size={24} color="#111418" />
            </TouchableOpacity>
            <Image
              source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
          </View>
        </View>

        {/* Search Bar */}
        <View className="px-6 py-2 mb-2">
          <View className="flex-row items-center bg-[#f0f2f4] dark:bg-gray-800 rounded-full px-4 h-14">
            <Search size={24} color="#637288" />
            <TextInput
              placeholder="Find your specialist..."
              placeholderTextColor="#637288"
              className="flex-1 ml-3 text-base text-[#111418] dark:text-white h-full"
            />
            <TouchableOpacity className="bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm">
              <SlidersHorizontal size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View className="py-4">
          <SectionHeader title="Categories" actionText="See all" onAction={() => {}} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24 }} className="mt-3">
            {CATEGORIES.map((cat) => {
               const isActive = activeCategory === cat.label;
               // Determine icon color
               let iconColor = '#111418';
               if (isActive) iconColor = 'white';
               else if (cat.label === 'Cardio') iconColor = '#ef4444';
               else if (cat.label === 'Vision') iconColor = '#a855f7';
               else if (cat.label === 'Dentist') iconColor = '#3b82f6';

               return (
                  <CategoryChip
                    key={cat.id}
                    label={cat.label}
                    icon={React.cloneElement(cat.icon as React.ReactElement, { color: iconColor })}
                    isActive={isActive}
                    onPress={() => setActiveCategory(cat.label)}
                  />
               );
            })}
          </ScrollView>
        </View>

        {/* Upcoming Appointment */}
        <View className="px-6 py-4">
          <TouchableOpacity
            activeOpacity={0.95}
            className="bg-primary rounded-3xl p-5 shadow-lg shadow-primary/30 relative overflow-hidden"
          >
            {/* Decorative Circle */}
            <View className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

            <View className="flex-row justify-between items-start mb-4 z-10">
              <View>
                <Text className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
                  Upcoming Appointment
                </Text>
                <Text className="text-white text-xl font-bold">Dr. Sarah Smith</Text>
                <Text className="text-white/90 text-sm">General Practitioner</Text>
              </View>
              <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center">
                <Video size={24} color="white" />
              </View>
            </View>

            <View className="bg-black/20 rounded-2xl p-3 flex-row items-center justify-between z-10 backdrop-blur-sm">
              <View className="flex-row items-center gap-2">
                <Calendar size={18} color="white" />
                <Text className="text-white text-sm font-medium">Today, 10:30 AM</Text>
              </View>
              <ChevronRight size={18} color="white" opacity={0.6} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Available Today */}
        <View className="flex-1 pb-6">
          <SectionHeader title="Available Today" />
          <View className="px-6 mt-2">
            {DOCTORS.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onPress={() => navigation.navigate('DoctorProfile', { doctorId: doctor.id })}
                onBookPress={() => navigation.navigate('BookingModal', { doctorId: doctor.id })}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
