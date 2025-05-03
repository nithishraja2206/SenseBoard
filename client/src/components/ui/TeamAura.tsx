import React from 'react';
import { MoodType } from '@shared/schema';
import { moodColors } from '@/lib/mood-utils';

interface TeamAuraProps {
  dominantMood: MoodType;
  alignment: number;
  description: string;
}

const TeamAura: React.FC<TeamAuraProps> = ({ 
  dominantMood, 
  alignment, 
  description 
}) => {
  // Get the colors for visualization based on the dominant mood
  const primaryColor = moodColors[dominantMood];
  const secondaryMood = dominantMood === 'energetic' ? 'focused' : 
                        dominantMood === 'focused' ? 'calm' : 'energetic';
  const secondaryColor = moodColors[secondaryMood]; 
  
  return (
    <div className="mt-4 bg-secondary rounded-lg p-3 border border-gray-800">
      <div className="relative h-32 w-full">
        {/* Simplified aura visualization */}
        <div 
          className="absolute inset-0 rounded-lg opacity-70"
          style={{ 
            background: `linear-gradient(to bottom right, ${primaryColor}30, ${secondaryColor}30, ${primaryColor}30)`
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full blur-sm"
          style={{ 
            background: `linear-gradient(to bottom right, ${primaryColor}50, ${secondaryColor}50)`
          }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}70` }}
        >
          <span className="font-display font-bold text-lg">{alignment}%</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-sm font-medium">
          {dominantMood.charAt(0).toUpperCase() + dominantMood.slice(1)} Alignment
        </div>
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      </div>
    </div>
  );
};

export default TeamAura;
