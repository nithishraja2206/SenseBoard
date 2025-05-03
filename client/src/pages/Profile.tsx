import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Project } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Clock, Mail, Users, Briefcase } from 'lucide-react';

interface ProfileProps {}

const Profile: React.FC<ProfileProps> = () => {
  // Fetch user profile data
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['/api/users', 1], // Hardcoded user ID for demo
    queryFn: async () => {
      // Simulated user data since we don't have a real endpoint
      return {
        id: 1,
        username: 'Design Lead',
        name: 'Alex Johnson',
        email: 'alex.johnson@example.com',
        role: 'Creative Director',
        avatarUrl: null,
        biography: 'Experienced creative director with 8+ years in UX/UI design focused on wellness and travel applications.',
        createdAt: new Date('2023-01-15'),
      } as User;
    },
  });

  // Fetch user's projects
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['/api/projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      return res.json() as Promise<Project[]>;
    },
  });

  if (isLoadingUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="mb-6">
        <Breadcrumb 
          items={[
            { label: 'Profile' }
          ]}
        />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* User Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Profile</CardTitle>
              <Button variant="outline" size="sm">Edit</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={user?.avatarUrl || ''} alt={user?.name || 'User'} />
                <AvatarFallback className="text-xl font-semibold bg-primary/20">
                  {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{user?.name}</h3>
              <p className="text-muted-foreground">{user?.role}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{user?.email}</span>
              </div>
              
              <div className="flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">{projects.length} Active Projects</span>
              </div>
              
              <div className="flex items-center">
                <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">
                  Joined {new Date(user?.createdAt || '').toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-2">About</h4>
              <p className="text-sm text-muted-foreground">{user?.biography}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Projects & Activity */}
        <div className="md:col-span-2 space-y-6">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Your Projects</CardTitle>
              <CardDescription>Projects you're currently working on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoadingProjects ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Loading projects...</p>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No projects found</p>
                  </div>
                ) : (
                  projects.map(project => (
                    <Link key={project.id} href={`/project/${project.id}`}>
                      <a className="block group">
                        <div className="flex items-center p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                          <div className="flex-1">
                            <h3 className="font-medium group-hover:text-primary transition-colors">{project.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                          </div>
                          <div className="flex items-center">
                            <div className="flex -space-x-2 mr-3">
                              {[...Array(3)].map((_, i) => (
                                <Avatar key={i} className="border-2 border-background w-6 h-6">
                                  <AvatarFallback className="text-xs">
                                    {String.fromCharCode(65 + i)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest actions and contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-2 border-primary pl-4 pb-4 relative">
                  <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1"></div>
                  <p className="font-medium">Added new sketch to "Visual Language &amp; Styling"</p>
                  <p className="text-sm text-muted-foreground">1 hour ago</p>
                </div>
                
                <div className="border-l-2 border-accent pl-4 pb-4 relative">
                  <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1"></div>
                  <p className="font-medium">Updated team mood to "Focused"</p>
                  <p className="text-sm text-muted-foreground">3 hours ago</p>
                </div>
                
                <div className="border-l-2 border-accent pl-4 pb-4 relative">
                  <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1"></div>
                  <p className="font-medium">Invited 2 new team members to "Serenity Wellness App"</p>
                  <p className="text-sm text-muted-foreground">Yesterday</p>
                </div>
                
                <div className="border-l-2 border-accent pl-4 relative">
                  <div className="absolute w-3 h-3 bg-accent rounded-full -left-[7px] top-1"></div>
                  <p className="font-medium">Created new moodboard "Color Palette Options"</p>
                  <p className="text-sm text-muted-foreground">2 days ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;