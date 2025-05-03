import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MoodType, moodTypes } from '@shared/schema';
import { Waves, Zap, Target, Sparkles, Shield } from 'lucide-react';

interface MoodSelectorProps {
  value?: MoodType;
  selectedMood?: MoodType;
  onChange: (value: MoodType) => void;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ value, selectedMood, onChange }) => {
  // Use selectedMood if provided, otherwise fallback to value
  const selectedValue = selectedMood || value;
  // Map mood types to icons
  const getMoodIcon = (mood: MoodType) => {
    switch (mood) {
      case 'calm':
        return <Waves className="h-4 w-4 text-[hsl(var(--calm))]" />;
      case 'energetic':
        return <Zap className="h-4 w-4 text-[hsl(var(--energetic))]" />;
      case 'focused':
        return <Target className="h-4 w-4 text-[hsl(var(--focused))]" />;
      case 'playful':
        return <Sparkles className="h-4 w-4 text-pink-400" />;
      case 'serious':
        return <Shield className="h-4 w-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <Select value={selectedValue} onValueChange={(val) => onChange(val as MoodType)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a mood" />
      </SelectTrigger>
      <SelectContent>
        {moodTypes.map((mood) => (
          <SelectItem key={mood} value={mood} className="flex items-center">
            <div className="flex items-center">
              <span className="mr-2">{getMoodIcon(mood)}</span>
              <span>{mood.charAt(0).toUpperCase() + mood.slice(1)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default MoodSelector;
