import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { twMerge } from 'tailwind-merge';

interface SectionHeaderProps {
  title: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, actionText, onAction, className }) => {
  return (
    <View className={twMerge('flex-row items-center justify-between px-6 pt-4 pb-2', className)}>
      <Text className="text-[#111418] dark:text-white text-lg font-bold">{title}</Text>
      {actionText && onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-primary text-sm font-semibold hover:underline">{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SectionHeader;
