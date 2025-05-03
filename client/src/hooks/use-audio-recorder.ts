import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioUrl: string | null;
  audioBlob: Blob | null;
}

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioUrl: null,
    audioBlob: null,
  });
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const { toast } = useToast();
  
  // Clean up function to stop recording and release resources
  const cleanup = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (mediaRecorder.current) {
      if (mediaRecorder.current.state !== 'inactive') {
        mediaRecorder.current.stop();
      }
      mediaRecorder.current = null;
    }
    
    audioChunks.current = [];
  };
  
  // Clean up on unmount
  useEffect(() => {
    return cleanup;
  }, []);
  
  // Start recording
  const startRecording = async () => {
    try {
      cleanup();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;
      
      audioChunks.current = [];
      startTimeRef.current = Date.now();
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setState(prev => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioUrl,
          audioBlob
        }));
      };
      
      recorder.start();
      
      // Start the timer
      timerRef.current = window.setInterval(() => {
        const currentDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration: currentDuration }));
      }, 1000);
      
      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioUrl: null,
        audioBlob: null,
      });
      
    } catch (error) {
      toast({
        title: "Recording Error",
        description: "Could not access the microphone. Please check permissions.",
        variant: "destructive",
      });
      
      console.error("Error starting recording:", error);
    }
  };
  
  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      mediaRecorder.current.pause();
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      setState(prev => ({ ...prev, isPaused: true }));
    }
  };
  
  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'paused') {
      mediaRecorder.current.resume();
      
      // Resume the timer
      timerRef.current = window.setInterval(() => {
        const currentDuration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setState(prev => ({ ...prev, duration: currentDuration }));
      }, 1000);
      
      setState(prev => ({ ...prev, isPaused: false }));
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Clear recording
  const clearRecording = () => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioUrl: null,
      audioBlob: null,
    });
  };
  
  // Format duration as mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  return {
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    duration: state.duration,
    audioUrl: state.audioUrl,
    audioBlob: state.audioBlob,
    formattedDuration: formatDuration(state.duration),
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    clearRecording,
  };
}
