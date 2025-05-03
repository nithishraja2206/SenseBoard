import React from 'react';
import { Slider } from '@/components/ui/slider';

interface IntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

const IntensitySlider: React.FC<IntensitySliderProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-muted-foreground">Subtle</span>
      <Slider
        className="flex-1"
        value={[value]}
        min={0}
        max={100}
        step={1}
        onValueChange={(values) => onChange(values[0])}
      />
      <span className="text-xs text-muted-foreground">Bold</span>
    </div>
  );
};

export default IntensitySlider;
