import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Calendar, Stethoscope, ChevronDown, CreditCard, QrCode, Banknote, Check, ArrowRight, Star, BadgeCheck } from 'lucide-react-native';
import { bookingSchema, BookingFormData } from '../../utils/validation';
import { colors } from '../../theme/colors';
import { twMerge } from 'tailwind-merge';

const PAYMENT_METHODS = [
  { id: 'CARD', label: 'Card', sub: '**** 4242', icon: <CreditCard size={24} color={colors.primary} /> },
  { id: 'UPI', label: 'UPI', sub: 'GPay / PhonePe', icon: <QrCode size={24} color="#637288" /> },
  { id: 'CASH', label: 'Pay at Clinic', sub: 'Cash / Insurance', icon: <Banknote size={24} color="#637288" /> },
];

const AppointmentBookingScreen = ({ navigation, route }: any) => {
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      reason: 'General Checkup',
      notes: '',
      paymentMethod: 'CARD',
    },
  });

  const onSubmit = async (data: BookingFormData) => {
    setLoading(true);
    // Simulate booking
    setTimeout(() => {
      setLoading(false);
      navigation.goBack();
    }, 1500);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white dark:bg-background-dark">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-background-dark z-10">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ChevronLeft size={24} color={colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-[#111418] dark:text-white">Appointment Details</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Doctor Profile Card */}
        <View className="p-4">
          <View className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex-row gap-4 items-center">
            <View className="relative">
              <Image
                source={{ uri: 'https://randomuser.me/api/portraits/women/44.jpg' }}
                className="w-20 h-20 rounded-full border-2 border-white dark:border-gray-800"
              />
              <View className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1">
                <BadgeCheck size={18} color={colors.primary} fill={colors.primary} />
              </View>
            </View>
            <View className="flex-1 justify-center">
              <Text className="text-xl font-bold text-[#111418] dark:text-white">Dr. Sarah Johnson</Text>
              <Text className="text-primary font-semibold text-sm mt-1">Cardiologist</Text>
              <View className="flex-row items-center gap-2 mt-1">
                <View className="flex-row items-center gap-1">
                  <Star size={14} color="#fbbf24" fill="#fbbf24" />
                  <Text className="font-medium text-[#111418] dark:text-white">4.9</Text>
                </View>
                <Text className="text-gray-400 text-xs">•</Text>
                <Text className="text-gray-500 text-sm">12 yrs exp</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Schedule Recap */}
        <View className="px-4 pb-2">
          <View className="flex-row justify-between items-center py-2">
            <Text className="text-lg font-bold text-[#111418] dark:text-white">Schedule</Text>
            <TouchableOpacity>
              <Text className="text-primary text-sm font-bold">Edit</Text>
            </TouchableOpacity>
          </View>
          <View className="bg-primary/5 dark:bg-primary/10 rounded-xl p-4 flex-row justify-between items-center border border-primary/10">
            <View className="flex-row items-center gap-4">
              <View className="bg-white dark:bg-gray-800 w-12 h-12 rounded-full items-center justify-center shadow-sm">
                <Calendar size={24} color={colors.primary} />
              </View>
              <View>
                <Text className="text-base font-bold text-[#111418] dark:text-white">Mon, Aug 14</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">10:30 AM - 11:00 AM</Text>
              </View>
            </View>
            <View className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2" />
            <View className="items-end">
              <Text className="text-xs text-gray-400 font-bold uppercase tracking-wider">Type</Text>
              <Text className="text-sm font-medium text-[#111418] dark:text-white">In-Person</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View className="p-4 space-y-6">
          <View>
            <Text className="text-lg font-bold text-[#111418] dark:text-white mb-4">Visit Details</Text>

            {/* Reason */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">Reason for visit</Text>
              <View className="relative">
                <View className="absolute top-0 bottom-0 left-0 pl-4 justify-center pointer-events-none z-10">
                  <Stethoscope size={20} color="#9ca3af" />
                </View>
                {/* Mock Select using TextInput for now, real app would use a Picker or Modal */}
                <Controller
                  control={control}
                  name="reason"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="w-full h-14 pl-12 pr-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-[#111418] dark:text-white"
                      value={value}
                      onChangeText={onChange}
                      // editable={false} // Would open a picker
                    />
                  )}
                />
                <View className="absolute top-0 bottom-0 right-0 pr-4 justify-center pointer-events-none">
                  <ChevronDown size={20} color="#9ca3af" />
                </View>
              </View>
            </View>

            {/* Notes */}
            <View>
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">Notes for the doctor (Optional)</Text>
              <Controller
                 control={control}
                 name="notes"
                 render={({ field: { onChange, onBlur, value } }) => (
                   <TextInput
                     className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-[#111418] dark:text-white p-4 min-h-[100px] text-top"
                     multiline
                     textAlignVertical="top"
                     placeholder="Describe symptoms, current medications, or any specific concerns..."
                     placeholderTextColor="#9ca3af"
                     onBlur={onBlur}
                     onChangeText={onChange}
                     value={value}
                   />
                 )}
              />
            </View>
          </View>

          {/* Payment Method */}
          <View>
            <Text className="text-lg font-bold text-[#111418] dark:text-white mb-4">Payment Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4 pb-2">
              <View className="flex-row">
              {PAYMENT_METHODS.map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    onPress={() => {
                        setPaymentMethod(method.id);
                        // Also update form value if using controller for paymentMethod, but currently using local state + controller might need sync
                    }}
                    className={twMerge(
                      "w-36 h-24 rounded-xl border-2 p-3 mr-3 flex-col justify-between transition-all bg-white dark:bg-gray-900",
                      isSelected ? "border-primary bg-primary/5" : "border-transparent"
                    )}
                  >
                    <View className="flex-row justify-between items-start">
                      {/* Clone icon with correct color if needed, but passing color prop in array is easier */}
                      {React.cloneElement(method.icon as React.ReactElement, {
                          color: isSelected ? colors.primary : '#637288'
                      })}
                      <View className={twMerge(
                        "w-5 h-5 rounded-full border flex items-center justify-center",
                        isSelected ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
                      )}>
                        {isSelected && <Check size={12} color="white" />}
                      </View>
                    </View>
                    <View>
                      <Text className="font-bold text-sm text-[#111418] dark:text-white">{method.label}</Text>
                      <Text className="text-xs text-gray-500">{method.sub}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              </View>
            </ScrollView>
          </View>

          {/* Price Breakdown */}
          <View className="bg-white dark:bg-gray-900 rounded-xl p-4 space-y-3 border border-gray-100 dark:border-gray-800">
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Consultation Fee</Text>
              <Text className="font-medium text-[#111418] dark:text-white text-sm">$60.00</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Booking Fee</Text>
              <Text className="font-medium text-[#111418] dark:text-white text-sm">$2.00</Text>
            </View>
            <View className="h-px bg-gray-100 dark:bg-gray-800 my-2" />
            <View className="flex-row justify-between items-center">
              <Text className="font-bold text-base text-[#111418] dark:text-white">Total</Text>
              <Text className="font-bold text-xl text-primary">$62.00</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 p-4 pb-8">
         <TouchableOpacity
           onPress={handleSubmit(onSubmit)}
           className="w-full bg-primary h-16 rounded-full flex-row items-center justify-between px-6 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 active:scale-[0.98]"
         >
           <Text className="text-white/90 font-medium">Total: $62.00</Text>
           <View className="flex-row items-center gap-2">
             <Text className="text-white font-bold text-base">Confirm Booking</Text>
             <ArrowRight size={20} color="white" />
           </View>
         </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default AppointmentBookingScreen;
