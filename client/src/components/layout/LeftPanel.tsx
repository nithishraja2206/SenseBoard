import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ActiveTool, MoodIntensity } from '@/types';
import { MoodType } from '@shared/schema';
import TeamAura from '@/components/ui/TeamAura';

interface LeftPanelProps {
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;
  selectedMood: MoodType;
  setSelectedMood: (mood: MoodType) => void;
  intensityValue: number;
  setIntensityValue: (value: number) => void;
  teamAura?: {
    dominantMood: MoodType;
    alignment: number;
    description: string;
  };
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  activeTool,
  setActiveTool,
  selectedMood,
  setSelectedMood,
  intensityValue,
  setIntensityValue,
  teamAura
}) => {
  const handleToolClick = (type: NonNullable<ActiveTool['type']>) => {
    setActiveTool({
      type,
      isOpen: true
    });
  };

  return (
    <div className="w-60 glass-panel border-r border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">Create</h2>
        
        <div className="mt-3 space-y-2">
          <Button
            variant="ghost"
            className="flex items-center justify-start space-x-3 w-full px-3 py-2 rounded-lg hover:bg-secondary"
            onClick={() => handleToolClick('sketch')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[hsl(var(--calm))]"
            >
              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            <span>Sketch</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex items-center justify-start space-x-3 w-full px-3 py-2 rounded-lg hover:bg-secondary"
            onClick={() => handleToolClick('image')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[hsl(var(--energetic))]"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <span>Image</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex items-center justify-start space-x-3 w-full px-3 py-2 rounded-lg hover:bg-secondary"
            onClick={() => handleToolClick('audio')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[hsl(var(--focused))]"
            >
              <path d="M12 2v20" />
              <path d="M6 16v4" />
              <path d="M18 8v12" />
              <path d="M18 4v2" />
              <path d="M6 12v2" />
            </svg>
            <span>Sound Clip</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex items-center justify-start space-x-3 w-full px-3 py-2 rounded-lg hover:bg-secondary"
            onClick={() => handleToolClick('thought')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-[hsl(var(--accent))]"
            >
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 1-1 2s1 1 1 1" />
              <path d="M15 21c-3 0-7-1-7-8V5c0-1.25.757-2.017 2-2h4c1.25 0 2 .75 2 1.972V11c0 1.25-.75 2-2 2-1 0-1 0-1 1v1c0 1 1 1 1 2s-1 1-1 1" />
            </svg>
            <span>Thought</span>
          </Button>
          
          <Button
            variant="ghost"
            className="flex items-center justify-start space-x-3 w-full px-3 py-2 rounded-lg hover:bg-secondary"
            onClick={() => handleToolClick('link')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span>Link</span>
          </Button>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">Filter</h2>
        
        <div className="mt-3 space-y-3">
          <div>
            <label className="text-sm text-muted-foreground">Mood Type</label>
            <Select
              value={selectedMood}
              onValueChange={(value) => setSelectedMood(value as MoodType)}
            >
              <SelectTrigger className="mt-1 bg-secondary text-sm rounded-lg">
                <SelectValue placeholder="Select Mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="calm">Calm</SelectItem>
                <SelectItem value="energetic">Energetic</SelectItem>
                <SelectItem value="focused">Focused</SelectItem>
                <SelectItem value="playful">Playful</SelectItem>
                <SelectItem value="serious">Serious</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Intensity</label>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs">Subtle</span>
              <Slider
                className="flex-1"
                value={[intensityValue]}
                min={0}
                max={100}
                step={1}
                onValueChange={(values) => setIntensityValue(values[0])}
              />
              <span className="text-xs">Bold</span>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground">Tags</label>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--calm))]/20 text-[hsl(var(--calm))]">UX Flow</span>
              <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--energetic))]/20 text-[hsl(var(--energetic))]">Visual</span>
              <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--focused))]/20 text-[hsl(var(--focused))]">Ambient</span>
              <span className="text-xs px-2 py-1 rounded-full bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]">Intent</span>
              <span className="text-xs px-2 py-1 rounded-full bg-secondary">+ Add Tag</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <h2 className="font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">Team Mood Aura</h2>
        
        {teamAura ? (
          <TeamAura 
            dominantMood={teamAura.dominantMood} 
            alignment={teamAura.alignment}
            description={teamAura.description}
          />
        ) : (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            No team mood data available
          </div>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;
