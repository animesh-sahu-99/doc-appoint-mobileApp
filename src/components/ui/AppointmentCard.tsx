import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Appointment, AppointmentStatus } from '../../store/slices/appointmentSlice';
import { Calendar, Clock, MapPin, Video, Check, AlertCircle } from 'lucide-react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
  onCancel?: () => void;
  onReschedule?: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
  onCancel,
  onReschedule,
}) => {
  const statusColors: Record<AppointmentStatus, string> = {
    CONFIRMED: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    PENDING: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    COMPLETED: 'bg-gray-50 dark:bg-gray-800 text-gray-500',
    CANCELLED: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  const statusDot: Record<AppointmentStatus, string> = {
    CONFIRMED: 'bg-green-500',
    PENDING: 'bg-orange-500',
    COMPLETED: 'bg-gray-500',
    CANCELLED: 'bg-red-500',
  };

  const statusTextColors: Record<AppointmentStatus, string> = {
    CONFIRMED: 'text-green-700 dark:text-green-300',
    PENDING: 'text-orange-700 dark:text-orange-300',
    COMPLETED: 'text-gray-500',
    CANCELLED: 'text-red-700 dark:text-red-300',
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className="bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 mb-4"
    >
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row gap-4 flex-1">
          <Image
            source={{ uri: appointment.doctorImage }}
            className="w-14 h-14 rounded-full bg-gray-200"
          />
          <View className="flex-1">
            <Text className="font-bold text-lg text-[#111418] dark:text-white">
              {appointment.doctorName}
            </Text>
            <Text className="text-sm text-primary font-medium">
              {appointment.doctorSpecialty}
            </Text>
            <View className="flex-row items-center gap-1 mt-1">
              {appointment.type === 'Video' ? (
                <Video size={14} color="#637288" />
              ) : (
                <MapPin size={14} color="#637288" />
              )}
              <Text className="text-xs text-[#637288] dark:text-[#94a3b8]">
                {appointment.type === 'Video' ? 'Video Consultation' : 'In-Person'}
              </Text>
            </View>
          </View>
        </View>

        <View
          className={twMerge(
            'flex-row items-center gap-1 px-2.5 py-1 rounded-full',
            statusColors[appointment.status]
          )}
        >
          <View className={twMerge('w-1.5 h-1.5 rounded-full', statusDot[appointment.status])} />
          <Text className={twMerge('text-xs font-bold', statusTextColors[appointment.status])}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).toLowerCase()}
          </Text>
        </View>
      </View>

      <View className="bg-[#f6f7f8] dark:bg-background-dark rounded-lg p-3 flex-row items-center gap-3 mb-4">
        <View className="w-10 h-10 rounded-full bg-primary/10 flex-row items-center justify-center">
          <Calendar size={20} color="#186be7" />
        </View>
        <View className="flex-1">
          <Text className="text-xs text-[#637288] dark:text-[#94a3b8] font-medium">
            Date & Time
          </Text>
          <Text className="text-sm font-bold text-[#111418] dark:text-white">
            {appointment.date} • {appointment.time}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        {onCancel && (
          <TouchableOpacity
            onPress={onCancel}
            className="flex-1 py-2.5 rounded-full border border-gray-200 dark:border-gray-600 items-center justify-center"
          >
            <Text className="text-[#111418] dark:text-white text-sm font-bold text-center">
              Cancel
            </Text>
          </TouchableOpacity>
        )}
        {onReschedule && (
          <TouchableOpacity
            onPress={onReschedule}
            className="flex-1 py-2.5 rounded-full bg-primary shadow-md shadow-primary/20 items-center justify-center"
          >
            <Text className="text-white text-sm font-bold text-center">
              Reschedule
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default AppointmentCard;
