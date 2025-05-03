import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Plus, Calendar, ArrowRight } from 'lucide-react';
import { Project, MoodBoard, TeamMood } from '@shared/schema';

interface DashboardProps {
  projectId?: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
});

const moodboardSchema = z.object({
  name: z.string().min(1, "Mood board name is required"),
  description: z.string().optional(),
});

const Dashboard: React.FC<DashboardProps> = ({ projectId }) => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateMoodBoardDialogOpen, setIsCreateMoodBoardDialogOpen] = useState(false);
  
  // Fetch projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json() as Promise<Project[]>;
    },
  });
  
  // Fetch mood boards for selected project
  const { data: moodBoards, isLoading: isLoadingMoodBoards } = useQuery({
    queryKey: ['/api/projects', projectId, 'moodboards'],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/moodboards`);
      if (!res.ok) throw new Error('Failed to fetch mood boards');
      return res.json() as Promise<MoodBoard[]>;
    },
    enabled: !!projectId,
  });
  
  // Create project form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });
  
  // Create moodboard form
  const moodboardForm = useForm<z.infer<typeof moodboardSchema>>({
    resolver: zodResolver(moodboardSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (project: z.infer<typeof formSchema>) => {
      return apiRequest('POST', '/api/projects', project);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: 'Project created',
        description: 'Your new project has been created successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Create mood board mutation
  const createMoodBoardMutation = useMutation({
    mutationFn: (moodBoard: z.infer<typeof moodboardSchema>) => {
      return apiRequest('POST', '/api/moodboards', {
        ...moodBoard,
        projectId: parseInt(projectId!),
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'moodboards'] });
      setIsCreateMoodBoardDialogOpen(false);
      moodboardForm.reset();
      toast({
        title: 'Mood board created',
        description: 'Your new mood board has been created successfully.',
      });
      
      // Navigate to the new mood board
      setLocation(`/moodboard/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create mood board. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Handle create project form submission
  const onSubmitProject = (values: z.infer<typeof formSchema>) => {
    createProjectMutation.mutate(values);
  };
  
  // Handle create mood board form submission
  const onSubmitMoodBoard = (values: z.infer<typeof moodboardSchema>) => {
    if (!projectId) {
      toast({
        title: 'Error',
        description: 'Please select a project first.',
        variant: 'destructive',
      });
      return;
    }
    
    createMoodBoardMutation.mutate(values);
  };
  
  // Get selected project
  const selectedProject = projectId && projects 
    ? projects.find(p => p.id.toString() === projectId) 
    : null;
  
  // Handle navigate to project
  const navigateToProject = (projectId: number) => {
    setLocation(`/project/${projectId}`);
  };
  
  // Handle navigate to mood board
  const navigateToMoodBoard = (moodBoardId: number) => {
    setLocation(`/moodboard/${moodBoardId}`);
  };
  
  return (
    <div className="container mx-auto p-6">
      {!projectId ? (
        <>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">Your Projects</h1>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
          
          {isLoadingProjects ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-52 animate-pulse">
                  <CardContent className="p-6 flex items-center justify-center h-full">
                    <div className="w-full h-full bg-secondary rounded-md"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects?.map((project) => (
                <Card 
                  key={project.id} 
                  className="hover:border-primary/50 transition-colors cursor-pointer card-glow"
                  onClick={() => navigateToProject(project.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-display">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      <span>Open Project</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              <Card 
                className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center h-52"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-center text-muted-foreground">Create a new project</p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                {selectedProject?.name || 'Project Details'}
              </h1>
              <p className="text-muted-foreground mt-1">
                {selectedProject?.description || 'No description'}
              </p>
            </div>
            <Button onClick={() => setIsCreateMoodBoardDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Mood Board
            </Button>
          </div>
          
          <h2 className="text-xl font-display font-semibold mb-4">Mood Boards</h2>
          
          {isLoadingMoodBoards ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2].map((i) => (
                <Card key={i} className="h-40 animate-pulse">
                  <CardContent className="p-6 flex items-center justify-center h-full">
                    <div className="w-full h-full bg-secondary rounded-md"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {moodBoards?.map((moodBoard) => (
                <Card 
                  key={moodBoard.id} 
                  className="hover:border-primary/50 transition-colors cursor-pointer card-glow"
                  onClick={() => navigateToMoodBoard(moodBoard.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl font-display">{moodBoard.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {moodBoard.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      <span>Open Mood Board</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              <Card 
                className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-center h-40"
                onClick={() => setIsCreateMoodBoardDialogOpen(true)}
              >
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-center text-muted-foreground">Create a new mood board</p>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
      
      {/* Create Project Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitProject)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Wellness App Redesign" {...field} />
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
                      <Textarea 
                        placeholder="A brief description of your project"
                        className="resize-none min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Create Mood Board Dialog */}
      <Dialog open={isCreateMoodBoardDialogOpen} onOpenChange={setIsCreateMoodBoardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Mood Board</DialogTitle>
          </DialogHeader>
          <Form {...moodboardForm}>
            <form onSubmit={moodboardForm.handleSubmit(onSubmitMoodBoard)} className="space-y-4">
              <FormField
                control={moodboardForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Visual Inspirations" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={moodboardForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of this mood board"
                        className="resize-none min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createMoodBoardMutation.isPending}>
                  {createMoodBoardMutation.isPending ? 'Creating...' : 'Create Mood Board'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
