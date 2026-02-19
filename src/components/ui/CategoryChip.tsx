import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface CategoryChipProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
}

const CategoryChip: React.FC<CategoryChipProps> = ({ label, icon, isActive, onPress }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={twMerge(
        'flex-row items-center justify-center rounded-full pl-4 pr-5 h-10 mr-3',
        isActive
          ? 'bg-primary shadow-md shadow-primary/20'
          : 'bg-[#f0f2f4] dark:bg-gray-800'
      )}
    >
      <View>{icon}</View>
      <Text
        className={twMerge(
          'ml-2 text-sm font-medium',
          isActive ? 'text-white font-semibold' : 'text-[#111418] dark:text-white'
        )}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryChip;
