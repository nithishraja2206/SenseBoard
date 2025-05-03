import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import MoodSelector from '@/components/ui/MoodSelector';
import IntensitySlider from '@/components/ui/IntensitySlider';
import { MoodType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import WaveformDisplay from '@/components/ui/WaveformDisplay';
import { Mic, Square, Play, Pause } from 'lucide-react';

interface AudioRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  moodBoardId: number;
  onAudioCreated?: (nodeId: number) => void;
  defaultPosition?: { x: number; y: number };
  defaultMood?: MoodType;
  defaultIntensity?: number;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  mood: z.string(),
  intensity: z.number().min(0).max(100),
});

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  isOpen,
  onClose,
  moodBoardId,
  onAudioCreated,
  defaultPosition = { x: 100, y: 100 },
  defaultMood = 'energetic',
  defaultIntensity = 60,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const {
    isRecording,
    isPaused,
    duration,
    audioUrl,
    audioBlob,
    formattedDuration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
  } = useAudioRecorder();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Initialize audio element when audio URL changes
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      audioRef.current = audio;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [audioUrl]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      mood: defaultMood,
      intensity: defaultIntensity,
    },
  });
  
  // Handle play/pause recorded audio
  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
      });
      setIsPlaying(true);
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!audioBlob) {
      toast({
        title: "No audio recorded",
        description: "Please record audio before saving",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio');
      }
      
      const uploadData = await uploadResponse.json();
      
      // Create node with the audio URL
      const response = await apiRequest("POST", "/api/nodes", {
        moodBoardId,
        type: "audio",
        title: values.title,
        description: values.description || "",
        contentUrl: uploadData.audioUrl,
        positionX: defaultPosition.x,
        positionY: defaultPosition.y,
        mood: values.mood,
        intensity: values.intensity,
        tags: [], // Add tags support later
      });
      
      toast({
        title: "Success!",
        description: "Audio has been added to your mood board",
      });
      
      // Call the callback if provided
      if (onAudioCreated) {
        onAudioCreated(response.id);
      }
      
      // Clean up audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      onClose();
    } catch (error) {
      console.error("Error creating audio node:", error);
      toast({
        title: "Error",
        description: "Failed to upload audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Audio</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Ambient Water Flow" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Background audio for meditation feature" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mood</FormLabel>
                    <FormControl>
                      <MoodSelector 
                        value={field.value as MoodType} 
                        onChange={(mood) => field.onChange(mood)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="intensity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intensity</FormLabel>
                    <FormControl>
                      <IntensitySlider 
                        value={field.value} 
                        onChange={(value) => field.onChange(value)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border rounded-md p-4">
              <div className="flex items-center mb-4 justify-between">
                <div className="text-sm font-medium">
                  {audioUrl ? 'Recording Complete' : isRecording ? 'Recording...' : 'Record Audio'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formattedDuration}
                </div>
              </div>
              
              <div className="bg-secondary rounded-lg p-3 mb-4">
                <WaveformDisplay 
                  isPlaying={isRecording || isPlaying} 
                  progress={0.5} 
                  randomize={isRecording}
                />
              </div>
              
              <div className="flex justify-center space-x-2">
                {!audioUrl && !isRecording && (
                  <Button
                    type="button"
                    onClick={startRecording}
                    className="bg-[hsl(var(--energetic))]"
                  >
                    <Mic className="h-4 w-4 mr-1" />
                    Start Recording
                  </Button>
                )}
                
                {isRecording && !isPaused && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={pauseRecording}
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={stopRecording}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </>
                )}
                
                {isRecording && isPaused && (
                  <>
                    <Button
                      type="button"
                      onClick={resumeRecording}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={stopRecording}
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </Button>
                  </>
                )}
                
                {audioUrl && (
                  <>
                    <Button
                      type="button"
                      onClick={togglePlayback}
                    >
                      {isPlaying ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                      {isPlaying ? 'Pause' : 'Play'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        clearRecording();
                        setIsPlaying(false);
                      }}
                    >
                      Record Again
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!audioUrl || isUploading}>
                {isUploading ? 'Uploading...' : 'Save Audio'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AudioRecorder;
