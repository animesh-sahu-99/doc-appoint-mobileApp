import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import { Star, StarHalf } from 'lucide-react-native';
import { colors } from '../../theme/colors';

interface StarRatingProps {
  rating: number; // 0 to 5
  maxStars?: number;
  size?: number;
  color?: string;
  onRatingChange?: (rating: number) => void; // If provided, component is interactive
  style?: ViewStyle;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 20,
  color = colors.accent, // Gold/Amber color
  onRatingChange,
  style,
}) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 1; i <= maxStars; i++) {
      if (i <= fullStars) {
        // Full Star
        if (onRatingChange) {
          stars.push(
            <TouchableOpacity key={i} onPress={() => onRatingChange(i)}>
              <Star size={size} color={color} fill={color} />
            </TouchableOpacity>
          );
        } else {
          stars.push(<Star key={i} size={size} color={color} fill={color} />);
        }
      } else if (i === fullStars + 1 && hasHalfStar && !onRatingChange) {
        // Half Star (only for read-only mode)
        stars.push(<StarHalf key={i} size={size} color={color} fill={color} />);
      } else {
        // Empty Star
        if (onRatingChange) {
          stars.push(
            <TouchableOpacity key={i} onPress={() => onRatingChange(i)}>
              <Star size={size} color={color} />
            </TouchableOpacity>
          );
        } else {
          stars.push(<Star key={i} size={size} color={color} />);
        }
      }
    }
    return stars;
  };

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {renderStars()}
    </View>
  );
};
