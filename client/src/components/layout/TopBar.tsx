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

const TopBar: React.FC = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  
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
        {/* Current Mood Selector */}
        {projectId && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground mr-1">Your Mood:</span>
            <Button 
              variant="ghost" 
              onClick={() => {
                if (projectId) {
                  createTeamMoodMutation.mutate({
                    projectId,
                    mood: "calm",
                    intensity: 85
                  });
                  toast({
                    title: "Mood Updated",
                    description: "You're feeling calm now.",
                  });
                }
              }} 
              className={`w-5 h-5 p-0 rounded-full bg-[hsl(var(--calm))] hover:ring-2 hover:ring-white ${teamAura.dominantMood === 'calm' ? 'ring-2 ring-white' : ''}`} 
              title="Calm"
            />
            <Button 
              variant="ghost" 
              onClick={() => {
                if (projectId) {
                  createTeamMoodMutation.mutate({
                    projectId,
                    mood: "energetic",
                    intensity: 85
                  });
                  toast({
                    title: "Mood Updated",
                    description: "You're feeling energetic now.",
                  });
                }
              }} 
              className={`w-5 h-5 p-0 rounded-full bg-[hsl(var(--energetic))] hover:ring-2 hover:ring-white ${teamAura.dominantMood === 'energetic' ? 'ring-2 ring-white' : ''}`} 
              title="Energetic"
            />
            <Button 
              variant="ghost" 
              onClick={() => {
                if (projectId) {
                  createTeamMoodMutation.mutate({
                    projectId,
                    mood: "focused",
                    intensity: 85
                  });
                  toast({
                    title: "Mood Updated",
                    description: "You're feeling focused now.",
                  });
                }
              }} 
              className={`w-5 h-5 p-0 rounded-full bg-[hsl(var(--focused))] hover:ring-2 hover:ring-white ${teamAura.dominantMood === 'focused' ? 'ring-2 ring-white' : ''}`}
              title="Focused"
            />
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
                  <DialogTitle>Set Your Current Mood</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 my-4">
                  {["calm", "energetic", "focused", "playful", "serious"].map((mood) => (
                    <Button 
                      key={mood}
                      variant="outline"
                      onClick={() => {
                        if (projectId) {
                          createTeamMoodMutation.mutate({
                            projectId,
                            mood: mood as MoodType,
                            intensity: 85
                          });
                        }
                      }}
                      className="flex flex-col items-center p-3 h-auto gap-2"
                    >
                      <div 
                        className={`w-10 h-10 rounded-full`}
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
                    <label className="text-sm font-medium">Mood Notes (Optional)</label>
                    <textarea 
                      className="w-full h-20 p-2 border rounded-md bg-secondary resize-none"
                      placeholder="What's influencing your mood today?"
                    ></textarea>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={() => {
                    toast({
                      title: "Mood Updated",
                      description: "Your team can now see your current mood state.",
                    });
                  }}>Save Mood</Button>
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
        
        <Button 
          className="flex items-center space-x-1 primary-gradient px-3 py-1.5 rounded-lg text-sm font-medium"
          onClick={handleNewInspiration}
        >
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
            className="mr-1"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span>New Inspiration</span>
        </Button>
        
        {projectId ? (
          <div className="flex items-center">
            <div className="flex -space-x-2 mr-2">
              <div className="w-8 h-8 rounded-full border-2 border-background bg-primary flex items-center justify-center text-white">
                A
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-background bg-focused flex items-center justify-center text-white">
                J
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-background bg-energetic flex items-center justify-center text-white">
                M
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs bg-secondary/50 rounded-full px-2 py-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                  Add Team Member
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
                        value={`https://senseboard.design/invite/${projectId}?code=MTIzNDU2Nzg5`}
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
                  <Button variant="outline" onClick={() => {
                    // Close dialog
                  }}>Cancel</Button>
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
        ) : (
          <div className="w-8 h-8 rounded-full border-2 border-background bg-primary flex items-center justify-center text-white">
            A
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
