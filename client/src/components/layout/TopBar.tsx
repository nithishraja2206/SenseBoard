import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { calculateTeamAura } from '@/lib/mood-utils';
import { MoodType } from '@shared/schema';
import { TeamAuraData } from '@/types';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { apiRequest, queryClient } from '@/lib/queryClient';

// Define the notification type
interface Notification {
  title: string;
  description: string;
  time: string;
  initials: string;
  color: string;
  read: boolean;
}

const TopBar: React.FC = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  
  // Sample notifications data
  const notifications: Notification[] = [
    {
      title: "Jamie shared a new audio clip",
      description: "In 'Interaction & Flow' mood board",
      time: "5 minutes ago",
      initials: "J",
      color: "bg-focused",
      read: false
    },
    {
      title: "Maria updated project details",
      description: "Changes to 'Serenity Wellness App' description",
      time: "25 minutes ago",
      initials: "M",
      color: "bg-energetic",
      read: false
    },
    {
      title: "New team mood data",
      description: "Team is currently feeling energetic",
      time: "1 hour ago",
      initials: "S",
      color: "bg-primary",
      read: true
    },
    {
      title: "Alex commented on your sketch",
      description: "Left feedback on 'Initial UI Concept'",
      time: "3 hours ago",
      initials: "A",
      color: "bg-calm",
      read: true
    }
  ];
  
  // Create a team mood mutation
  const createTeamMoodMutation = useMutation({
    mutationFn: (data: { projectId: number, mood: MoodType, intensity: number }) => {
      return apiRequest('POST', '/api/moods', {
        projectId: data.projectId,
        userId: 1, // Default user for demo
        mood: data.mood,
        intensity: data.intensity,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', variables.projectId, 'mood-summary'] });
    },
  });
  
  // Extract project ID from location if available
  const projectIdMatch = location.match(/\/project\/(\d+)/);
  const projectId = projectIdMatch ? parseInt(projectIdMatch[1]) : null;
  
  // Fetch project data if we have a project ID
  const { data: project } = useQuery({
    queryKey: ['/api/projects', projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json();
    },
    enabled: !!projectId,
  });
  
  // Fetch team mood summary if we have a project ID
  const { data: moodSummary } = useQuery({
    queryKey: ['/api/projects', projectId, 'mood-summary'],
    queryFn: async () => {
      if (!projectId) return null;
      const res = await fetch(`/api/projects/${projectId}/mood-summary`);
      if (!res.ok) throw new Error('Failed to fetch mood summary');
      return res.json();
    },
    enabled: !!projectId,
  });
  
  // Calculate team aura from mood summary
  const teamAura: TeamAuraData = moodSummary 
    ? calculateTeamAura(moodSummary)
    : { dominantMood: 'energetic' as MoodType, alignment: 50, description: 'Team mood not set' };
  
  // Extract mood board ID from location if available
  const moodBoardIdMatch = location.match(/\/moodboard\/(\d+)/);
  const moodBoardId = moodBoardIdMatch ? parseInt(moodBoardIdMatch[1]) : null;
  
  // Fetch mood boards for the current project
  const { data: moodBoards } = useQuery({
    queryKey: ['/api/projects', projectId, 'moodboards'],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await fetch(`/api/projects/${projectId}/moodboards`);
      if (!res.ok) throw new Error('Failed to fetch mood boards');
      return res.json();
    },
    enabled: !!projectId && !moodBoardId, // Only fetch if we're on a project page but not a moodboard page
  });
  
  // Handle new inspiration button click
  const handleNewInspiration = () => {
    if (!projectId) {
      toast({
        title: "No Project Selected",
        description: "Please select a project first to add inspiration.",
        variant: "destructive",
      });
      return;
    }
    
    // If we're already on a mood board page, just add the parameter
    if (moodBoardId) {
      window.history.pushState({}, '', `${location}?newInspiration=true`);
      window.dispatchEvent(new Event('popstate')); // Trigger a URL change event
      return;
    }
    
    // If we have mood boards for this project, redirect to the first one
    if (moodBoards && moodBoards.length > 0) {
      window.location.href = `/moodboard/${moodBoards[0].id}?newInspiration=true`;
      return;
    }
    
    // If no mood boards, go to project page
    window.location.href = `/project/${projectId}`;
  };
  
  return (
    <header className="glass-panel border-b border-gray-800 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link href="/">
          <h1 className="font-display text-xl font-bold bg-clip-text text-transparent primary-gradient cursor-pointer">
            SenseBoard
          </h1>
        </Link>
        
        {project && (
          <div className="flex items-center space-x-2 ml-8">
            <span className="text-sm text-muted-foreground">Project:</span>
            <span className="font-medium">{project.name}</span>
          </div>
        )}
        
        {/* Live emotion tracker */}
        {projectId && (
          <div className="flex items-center px-3 py-1.5 rounded-full bg-secondary ml-6">
            <div 
              className={`w-4 h-4 rounded-full animate-pulse mr-2`}
              style={{ backgroundColor: teamAura.dominantMood === 'calm' ? 'hsl(var(--calm))' : 
                       teamAura.dominantMood === 'energetic' ? 'hsl(var(--energetic))' : 
                       'hsl(var(--focused))' }}
            />
            <span className="text-sm">{teamAura.dominantMood.charAt(0).toUpperCase() + teamAura.dominantMood.slice(1)}</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-5">
        {/* Project Mood Selector - Only displayed when in a project */}
        {projectId && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground mr-1">Project Mood:</span>
            <div className="flex -space-x-1">
              <Button 
                variant="ghost" 
                onClick={() => {
                  createTeamMoodMutation.mutate({
                    projectId,
                    mood: "calm",
                    intensity: 85
                  });
                  toast({
                    title: "Project Mood Updated",
                    description: "Project mood set to Calm.",
                  });
                }} 
                className={`w-5 h-5 p-0 rounded-full bg-[hsl(var(--calm))] hover:ring-2 hover:ring-white ${moodSummary && moodSummary.calm && moodSummary.calm.count > 0 ? 'ring-2 ring-white' : ''}`} 
                title="Calm"
              />
              <Button 
                variant="ghost" 
                onClick={() => {
                  createTeamMoodMutation.mutate({
                    projectId,
                    mood: "energetic",
                    intensity: 85
                  });
                  toast({
                    title: "Project Mood Updated",
                    description: "Project mood set to Energetic.",
                  });
                }} 
                className={`w-5 h-5 p-0 rounded-full bg-[hsl(var(--energetic))] hover:ring-2 hover:ring-white ${moodSummary && moodSummary.energetic && moodSummary.energetic.count > 0 ? 'ring-2 ring-white' : ''}`} 
                title="Energetic"
              />
              <Button 
                variant="ghost" 
                onClick={() => {
                  createTeamMoodMutation.mutate({
                    projectId,
                    mood: "focused",
                    intensity: 85
                  });
                  toast({
                    title: "Project Mood Updated",
                    description: "Project mood set to Focused.",
                  });
                }} 
                className={`w-5 h-5 p-0 rounded-full bg-[hsl(var(--focused))] hover:ring-2 hover:ring-white ${moodSummary && moodSummary.focused && moodSummary.focused.count > 0 ? 'ring-2 ring-white' : ''}`}
                title="Focused"
              />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="w-5 h-5 p-0 rounded-full bg-surface flex items-center justify-center hover:bg-secondary" title="More mood options">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="M12 5v14" />
                  </svg>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Set Project Mood</DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    Define the emotional goals for this project. Select multiple moods to create a nuanced emotion profile.
                  </p>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 my-4">
                  {["calm", "energetic", "focused", "playful", "serious"].map((mood) => (
                    <Button 
                      key={mood}
                      variant="outline"
                      onClick={() => {
                        createTeamMoodMutation.mutate({
                          projectId,
                          mood: mood as MoodType,
                          intensity: 85
                        });
                        toast({
                          title: "Project Mood Updated",
                          description: `Project mood updated with ${mood}.`,
                        });
                      }}
                      className={`flex flex-col items-center p-3 h-auto gap-2 ${moodSummary && moodSummary[mood as keyof typeof moodSummary]?.count > 0 ? 'border-primary' : ''}`}
                    >
                      <div 
                        className={`w-10 h-10 rounded-full ${moodSummary && moodSummary[mood as keyof typeof moodSummary]?.count > 0 ? 'ring-2 ring-primary' : ''}`}
                        style={{ 
                          backgroundColor: mood === 'calm' ? 'hsl(var(--calm))' : 
                                        mood === 'energetic' ? 'hsl(var(--energetic))' : 
                                        mood === 'focused' ? 'hsl(var(--focused))' :
                                        mood === 'playful' ? 'hsl(346, 84%, 61%)' :
                                        'hsl(220, 9%, 46%)'
                        }}
                      />
                      <span className="capitalize">{mood}</span>
                    </Button>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intensity</label>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <span>Subtle</span>
                      <span></span>
                      <span>Medium</span>
                      <span></span>
                      <span>Strong</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="85"
                      step="5"
                      className="w-full" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Mood Notes</label>
                    <textarea 
                      className="w-full h-20 p-2 border rounded-md bg-secondary resize-none"
                      placeholder="Describe the emotional goals for this project..."
                    ></textarea>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => {
                    toast({
                      title: "Project Mood Updated",
                      description: "The emotional profile for this project has been updated.",
                    });
                  }}>Save Project Mood</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        
        <div className="relative">
          <Input 
            type="text" 
            placeholder="Search inspirations..." 
            className="bg-secondary text-sm rounded-lg py-2 pl-9 pr-4 w-52"
          />
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="absolute left-3 top-3 text-muted-foreground"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary"></span>
          </Button>
          
          {isNotificationOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-card rounded-lg shadow-lg border border-border z-50">
              <div className="p-3 border-b border-border">
                <h3 className="font-medium">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification, index) => (
                  <div 
                    key={index} 
                    className="p-3 hover:bg-secondary border-b border-border last:border-0 cursor-pointer"
                  >
                    <div className="flex items-start">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notification.color} text-white mr-3 flex-shrink-0`}>
                        {notification.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs">View all notifications</Button>
              </div>
            </div>
          )}
        </div>
        
        <Link href="/profile">
          <div className="w-8 h-8 rounded-full border-2 border-background bg-primary flex items-center justify-center text-white cursor-pointer hover:ring-2 hover:ring-primary-foreground">
            A
          </div>
        </Link>
      </div>
    </header>
  );
};

export default TopBar;
