import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';
import LeftPanel from '@/components/layout/LeftPanel';
import MainCanvas from '@/components/layout/MainCanvas';
import RightPanel from '@/components/layout/RightPanel';
import { MoodType, NodeType, InspirationNode, NodeConnection, MoodBoard, Project } from '@shared/schema';
import { calculateTeamAura } from '@/lib/mood-utils';
import { ActiveTool, Point } from '@/types';
import SketchTool from '@/components/tools/SketchTool';
import ImageUploader from '@/components/tools/ImageUploader';
import AudioRecorder from '@/components/tools/AudioRecorder';
import ThoughtEditor from '@/components/tools/ThoughtEditor';
import LinkEmbedder from '@/components/tools/LinkEmbedder';
import SimpleBreadcrumb from '@/components/ui/Breadcrumb';

interface MoodCanvasProps {
  moodBoardId: string;
}

const MoodCanvas: React.FC<MoodCanvasProps> = ({ moodBoardId }) => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State for mood and tools
  const [selectedMood, setSelectedMood] = useState<MoodType>('energetic');
  const [intensityValue, setIntensityValue] = useState(50);
  const [activeTool, setActiveTool] = useState<ActiveTool>({
    type: null,
    isOpen: false,
  });
  const [toolPosition, setToolPosition] = useState<Point>({ x: 100, y: 100 });
  
  // Parse query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const newInspirationParam = queryParams.get('newInspiration');
  
  // Show new inspiration dialog if param is present
  useEffect(() => {
    if (newInspirationParam === 'true') {
      // Remove the parameter from URL
      const newUrl = location.split('?')[0];
      window.history.replaceState({}, '', newUrl);
      
      // Show a guidance toast
      toast({
        title: "Create New Inspiration",
        description: "Choose the type of inspiration that best fits your idea. Add sketches, images, audio clips, or written thoughts to your mood board.",
        duration: 6000,
      });
      
      // Open the inspiration selector dialog
      setTimeout(() => {
        // Set a random position in the viewport
        const canvasWidth = window.innerWidth - 200; // Adjust for panels
        const canvasHeight = window.innerHeight - 100; // Adjust for header
        
        const position = {
          x: Math.max(100, Math.random() * (canvasWidth - 300)),
          y: Math.max(100, Math.random() * (canvasHeight - 200)),
        };
        
        setToolPosition(position);
        
        // Show the inspiration selector dialog
        setActiveTool({
          type: 'sketch', // Default to sketch as a starting tool
          isOpen: true,
        });
      }, 500);
    }
  }, [newInspirationParam, location, toast]);
  
  // Fetch mood board data
  const { data: moodBoard, isLoading: isLoadingMoodBoard } = useQuery({
    queryKey: ['/api/moodboards', moodBoardId],
    queryFn: async () => {
      const res = await fetch(`/api/moodboards/${moodBoardId}`);
      if (!res.ok) throw new Error('Failed to fetch mood board');
      return res.json() as Promise<MoodBoard>;
    },
  });
  
  // Fetch project data once we have the mood board
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['/api/projects', moodBoard?.projectId],
    queryFn: async () => {
      if (!moodBoard?.projectId) return null;
      const res = await fetch(`/api/projects/${moodBoard.projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json() as Promise<Project>;
    },
    enabled: !!moodBoard?.projectId,
  });
  
  // Fetch inspiration nodes
  const { data: nodes = [], isLoading: isLoadingNodes } = useQuery({
    queryKey: ['/api/moodboards', moodBoardId, 'nodes'],
    queryFn: async () => {
      const res = await fetch(`/api/moodboards/${moodBoardId}/nodes`);
      if (!res.ok) throw new Error('Failed to fetch nodes');
      return res.json() as Promise<InspirationNode[]>;
    },
  });
  
  // Fetch node connections
  const { data: connections = [], isLoading: isLoadingConnections } = useQuery({
    queryKey: ['/api/moodboards', moodBoardId, 'connections'],
    queryFn: async () => {
      const res = await fetch(`/api/moodboards/${moodBoardId}/connections`);
      if (!res.ok) throw new Error('Failed to fetch connections');
      return res.json() as Promise<NodeConnection[]>;
    },
  });
  
  // Fetch team mood summary
  const { data: moodSummary = {}, isLoading: isLoadingMoodSummary } = useQuery({
    queryKey: ['/api/projects', moodBoard?.projectId, 'mood-summary'],
    queryFn: async () => {
      if (!moodBoard?.projectId) return {};
      const res = await fetch(`/api/projects/${moodBoard.projectId}/mood-summary`);
      if (!res.ok) throw new Error('Failed to fetch mood summary');
      return res.json();
    },
    enabled: !!moodBoard?.projectId,
  });
  
  // Calculate team aura based on mood summary
  const teamAura = Object.keys(moodSummary).length > 0
    ? calculateTeamAura(moodSummary)
    : undefined;
  
  // Handle adding new inspiration
  const handleAddInspiration = () => {
    // Show guidance toast
    toast({
      title: "Add New Inspiration",
      description: "Choose what inspires you - sketch an idea, upload an image, record audio, or write down your thoughts.",
      duration: 5000,
    });
    
    // Set a position in the center of the viewport
    const canvasWidth = window.innerWidth - 200; // Adjust for panels
    const canvasHeight = window.innerHeight - 100; // Adjust for header
    
    const position = {
      x: Math.max(100, Math.random() * (canvasWidth - 300)),
      y: Math.max(100, Math.random() * (canvasHeight - 200)),
    };
    
    setToolPosition(position);
    
    // Open tool selector dialog
    setActiveTool({
      type: 'sketch', // Default to sketch tool
      isOpen: true,
    });
  };
  
  // Handle node creation callbacks
  const handleNodeCreated = (nodeId: number) => {
    // Refetch nodes
    queryClient.invalidateQueries({ queryKey: ['/api/moodboards', moodBoardId, 'nodes'] });
    
    toast({
      title: 'Success',
      description: 'New element added to your mood board!',
    });
  };
  
  // Create a team mood mutation
  const createTeamMoodMutation = useMutation({
    mutationFn: () => {
      if (!moodBoard?.projectId) throw new Error('No project ID');
      
      return apiRequest('POST', '/api/moods', {
        projectId: moodBoard.projectId,
        userId: 1, // Default user for demo
        mood: selectedMood,
        intensity: intensityValue,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', moodBoard?.projectId, 'mood-summary'] });
      toast({
        title: 'Mood Updated',
        description: 'Your mood has been recorded for the team.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update mood. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Effect to update team mood when mood or intensity changes significantly
  useEffect(() => {
    const updateTimer = setTimeout(() => {
      if (moodBoard?.projectId) {
        createTeamMoodMutation.mutate();
      }
    }, 2000);
    
    return () => clearTimeout(updateTimer);
  }, [selectedMood, intensityValue, moodBoard?.projectId]);
  
  // Loading state
  if (isLoadingMoodBoard || (moodBoard?.projectId && isLoadingProject)) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading mood board...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Breadcrumb navigation */}
      {moodBoard && (
        <div className="bg-background/60 backdrop-blur-sm border-b border-border px-6 py-2 z-10">
          <SimpleBreadcrumb 
            items={[
              { label: 'Home', href: '/' },
              { label: project?.name || `Project #${moodBoard.projectId}`, href: `/project/${moodBoard.projectId}` },
              { label: moodBoard.name }
            ]}
          />
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        <LeftPanel
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          selectedMood={selectedMood}
          setSelectedMood={setSelectedMood}
          intensityValue={intensityValue}
          setIntensityValue={setIntensityValue}
          teamAura={teamAura}
        />
        
        <MainCanvas
          nodes={nodes}
          connections={connections}
          onAddInspiration={handleAddInspiration}
        />
        
        <RightPanel
          nodes={nodes}
          connections={connections}
          moodSummary={moodSummary}
        />
      </div>
      
      {/* Tool Dialogs */}
      {activeTool.type === 'sketch' && activeTool.isOpen && (
        <SketchTool
          isOpen={true}
          onClose={() => setActiveTool({ type: null, isOpen: false })}
          moodBoardId={parseInt(moodBoardId)}
          onSketchCreated={handleNodeCreated}
          defaultPosition={toolPosition}
          defaultMood={selectedMood}
          defaultIntensity={intensityValue}
        />
      )}
      
      {activeTool.type === 'image' && activeTool.isOpen && (
        <ImageUploader
          isOpen={true}
          onClose={() => setActiveTool({ type: null, isOpen: false })}
          moodBoardId={parseInt(moodBoardId)}
          onImageCreated={handleNodeCreated}
          defaultPosition={toolPosition}
          defaultMood={selectedMood}
          defaultIntensity={intensityValue}
        />
      )}
      
      {activeTool.type === 'audio' && activeTool.isOpen && (
        <AudioRecorder
          isOpen={true}
          onClose={() => setActiveTool({ type: null, isOpen: false })}
          moodBoardId={parseInt(moodBoardId)}
          onAudioCreated={handleNodeCreated}
          defaultPosition={toolPosition}
          defaultMood={selectedMood}
          defaultIntensity={intensityValue}
        />
      )}
      
      {activeTool.type === 'thought' && activeTool.isOpen && (
        <ThoughtEditor
          isOpen={true}
          onClose={() => setActiveTool({ type: null, isOpen: false })}
          moodBoardId={parseInt(moodBoardId)}
          onThoughtCreated={handleNodeCreated}
          defaultPosition={toolPosition}
          defaultMood={selectedMood}
          defaultIntensity={intensityValue}
        />
      )}
      
      {activeTool.type === 'link' && activeTool.isOpen && (
        <LinkEmbedder
          isOpen={true}
          onClose={() => setActiveTool({ type: null, isOpen: false })}
          moodBoardId={parseInt(moodBoardId)}
          onLinkCreated={handleNodeCreated}
          defaultPosition={toolPosition}
          defaultMood={selectedMood}
          defaultIntensity={intensityValue}
        />
      )}
    </div>
  );
};

export default MoodCanvas;
