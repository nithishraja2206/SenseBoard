import React, { useState, useEffect } from 'react';

interface WaveformDisplayProps {
  isPlaying: boolean;
  progress?: number;
  randomize?: boolean;
}

const WaveformDisplay: React.FC<WaveformDisplayProps> = ({ 
  isPlaying, 
  progress = 0,
  randomize = false
}) => {
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  // Generate random waveform data on mount
  useEffect(() => {
    // Create 30 random heights between 5 and 35
    const generateWaveform = () => {
      return Array.from({ length: 30 }, () => 
        Math.floor(Math.random() * 30) + 5
      );
    };
    
    setWaveformData(generateWaveform());
    
    // If randomize is true, update waveform data periodically when playing
    if (randomize) {
      let interval: NodeJS.Timeout | null = null;
      
      if (isPlaying) {
        interval = setInterval(() => {
          setWaveformData(generateWaveform());
        }, 500);
      }
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [isPlaying, randomize]);
  
  return (
    <div className="audio-wave">
      {waveformData.map((height, index) => {
        // Apply progress to visualize playback position
        const isActive = index / waveformData.length <= progress;
        
        return (
          <span
            key={index}
            className={isActive ? 'opacity-90' : 'opacity-40'}
            style={{
              height: `${height}px`,
              // Add a slight animation when playing
              animation: isPlaying ? `pulse 1s infinite alternate ${index * 0.1}s` : 'none',
            }}
          ></span>
        );
      })}
    </div>
  );
};

export default WaveformDisplay;
