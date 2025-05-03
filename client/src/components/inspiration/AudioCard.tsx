import React, { useState, useRef, useEffect } from 'react';
import { InspirationNode } from '@shared/schema';
import MoodBadge from '@/components/ui/MoodBadge';
import WaveformDisplay from '@/components/ui/WaveformDisplay';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AudioCardProps {
  node: InspirationNode;
}

const AudioCard: React.FC<AudioCardProps> = ({ node }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current && node.contentUrl) {
      const audio = new Audio(node.contentUrl);
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      audioRef.current = audio;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', () => {});
        audioRef.current.removeEventListener('timeupdate', () => {});
        audioRef.current.removeEventListener('ended', () => {});
      }
    };
  }, [node.contentUrl]);
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
      });
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-medium">{node.title}</h3>
        <MoodBadge mood={node.mood} />
      </div>
      <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
      
      <div className="mt-3 p-3 bg-secondary rounded-lg">
        <div className="flex items-center mb-3">
          <Button 
            variant="ghost"
            size="icon"
            className={`p-1 rounded-full mr-2 ${isPlaying ? 'bg-[hsl(var(--energetic))]/20 text-[hsl(var(--energetic))]' : 'bg-primary/20 text-primary'}`}
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          <div className="text-xs text-muted-foreground">
            {formatTime(currentTime)} / {formatTime(duration || 0)}
          </div>
        </div>
        
        {/* Audio waveform visualization */}
        <WaveformDisplay isPlaying={isPlaying} progress={duration > 0 ? currentTime / duration : 0} />
      </div>
    </div>
  );
};

export default AudioCard;
