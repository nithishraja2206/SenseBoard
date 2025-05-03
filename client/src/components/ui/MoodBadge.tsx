import React from 'react';
import { MoodType } from '@shared/schema';

interface MoodBadgeProps {
  mood: MoodType | string;
}

const MoodBadge: React.FC<MoodBadgeProps> = ({ mood }) => {
  // Get color based on mood
  const getColorClass = (mood: MoodType | string): string => {
    switch (mood) {
      case 'calm':
        return 'bg-[hsl(var(--calm))]/80 text-white';
      case 'energetic':
        return 'bg-[hsl(var(--energetic))]/80 text-white';
      case 'focused':
        return 'bg-[hsl(var(--focused))]/80 text-white';
      case 'playful':
        return 'bg-pink-500/80 text-white';
      case 'serious':
        return 'bg-gray-500/80 text-white';
      default:
        return 'bg-primary/80 text-white';
    }
  };

  return (
    <div className={`px-2 py-1 rounded-full text-xs ${getColorClass(mood)}`}>
      {mood.charAt(0).toUpperCase() + mood.slice(1)}
    </div>
  );
};

export default MoodBadge;
