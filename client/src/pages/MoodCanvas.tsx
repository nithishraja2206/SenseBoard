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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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
      {/* Global navigation bar */}
      {moodBoard && project && (
        <div className="bg-background/80 backdrop-blur-sm border-b border-border px-6 py-3 z-10 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center mr-6">
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3" 
                     style={{ 
                       background: `linear-gradient(45deg, hsl(var(--${Object.keys(moodSummary)[0] || 'primary'})), hsl(var(--${Object.keys(moodSummary)[1] || 'focused'})))`,
                       opacity: 0.9
                     }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><path d="M14 2v6h6"/></svg>
                </div>
                <div>
                  <h2 className="text-sm font-medium leading-none">{project.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Project Mood: {Object.keys(moodSummary).slice(0, 2).map(mood => 
                      mood.charAt(0).toUpperCase() + mood.slice(1)
                    ).join(' + ')}
                  </p>
                </div>
              </div>
              
              <SimpleBreadcrumb 
                items={[
                  { label: project.name, href: `/project/${moodBoard.projectId}` },
                  { label: moodBoard.name }
                ]}
              />
            </div>
            
            <div className="flex items-center">
              <div className="flex -space-x-3 mr-3">
                <div className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-white font-medium shadow-md cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: "hsl(var(--primary))" }}>
                  A
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-white font-medium shadow-md cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: "hsl(var(--focused))" }}>
                  J
                </div>
                <div className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center text-white font-medium shadow-md cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: "hsl(var(--energetic))" }}>
                  M
                </div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs bg-secondary/50 rounded-full px-2 py-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    Add Team
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Invite Team Members</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email Addresses</label>
                      <input 
                        type="text" 
                        placeholder="Enter email addresses separated by commas"
                        className="w-full p-2 border rounded-md bg-secondary" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Permission Level</label>
                      <select className="w-full p-2 border rounded-md bg-secondary">
                        <option value="editor">Editor (Can add and modify inspirations)</option>
                        <option value="viewer">Viewer (Can only view)</option>
                        <option value="admin">Admin (Full control including user management)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Add a Personal Message (Optional)</label>
                      <textarea 
                        className="w-full h-20 p-2 border rounded-md bg-secondary resize-none"
                        placeholder="Write a personal message to the invitees"
                      ></textarea>
                    </div>
                    
                    <div className="border border-border p-3 rounded-md bg-secondary/30">
                      <h4 className="text-sm font-medium mb-2">Or share this invite link</h4>
                      <div className="flex">
                        <input
                          readOnly
                          className="flex-1 p-2 text-xs bg-background rounded-l-md border border-border"
                          value={`https://senseboard.design/invite/${moodBoard?.projectId}?code=MTIzNDU2Nzg5`}
                        />
                        <Button variant="default" className="rounded-l-none" onClick={() => {
                          toast({
                            title: "Link Copied",
                            description: "Invite link has been copied to clipboard",
                          });
                        }}>
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={() => {
                      toast({
                        title: "Invitations Sent",
                        description: "Team members will receive an email invitation shortly.",
                      });
                    }}>Send Invitations</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
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
