import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Star } from 'lucide-react-native';
import { Doctor } from '../../store/slices/doctorSlice';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  onBookPress: () => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onPress, onBookPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="p-4 rounded-3xl bg-white dark:bg-gray-800 border border-[#f0f2f4] dark:border-gray-700 shadow-sm flex-col gap-3 mb-4"
    >
      <View className="flex-row gap-4">
        <Image
          source={{ uri: doctor.imageUrl }}
          className="h-20 w-20 rounded-2xl bg-gray-200"
          resizeMode="cover"
        />
        <View className="flex-1 justify-center">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="font-bold text-base text-[#111418] dark:text-white">
                {doctor.name}
              </Text>
              <Text className="text-[#637288] text-sm mt-1">
                {doctor.specialty}
              </Text>
            </View>
            <View className="flex-row items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
              <Star size={14} color="#eab308" fill="#eab308" />
              <Text className="text-xs font-bold text-yellow-700 dark:text-yellow-500">
                {doctor.rating.toFixed(1)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4 mt-2">
            <View className="flex-col">
              <Text className="text-[10px] text-[#637288] uppercase tracking-wide">
                Experience
              </Text>
              <Text className="text-sm font-semibold text-[#111418] dark:text-white">
                {doctor.experience} Years
              </Text>
            </View>
            <View className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
            <View className="flex-col">
              <Text className="text-[10px] text-[#637288] uppercase tracking-wide">
                Fee
              </Text>
              <Text className="text-sm font-semibold text-primary">
                ${doctor.fee.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity
        onPress={onBookPress}
        className="w-full py-3 rounded-full bg-[#f0f2f4] dark:bg-gray-700 active:bg-primary active:opacity-90"
      >
        <Text className="text-[#111418] dark:text-white font-bold text-sm text-center">
          Book Appointment
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

export default DoctorCard;
