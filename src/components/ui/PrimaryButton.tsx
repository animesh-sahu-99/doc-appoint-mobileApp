import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  className = '',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
}) => {
  const baseStyles = 'h-14 rounded-full flex-row items-center justify-center px-6 transition-all active:scale-[0.98]';

  const variants = {
    primary: 'bg-primary shadow-lg shadow-primary/25',
    secondary: 'bg-primary/10',
    outline: 'bg-transparent border border-gray-200 dark:border-gray-700',
    ghost: 'bg-transparent',
  };

  const textVariants = {
    primary: 'text-white font-bold text-base',
    secondary: 'text-primary font-bold text-sm',
    outline: 'text-gray-700 dark:text-gray-200 font-semibold text-base',
    ghost: 'text-gray-500 dark:text-gray-400 text-sm font-medium',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={twMerge(
        baseStyles,
        variants[variant],
        disabled ? 'opacity-50' : '',
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? 'white' : '#186be7'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && <View className="mr-2">{icon}</View>}
          <Text className={twMerge(textVariants[variant])}>{title}</Text>
          {icon && iconPosition === 'right' && <View className="ml-2">{icon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default PrimaryButton;
