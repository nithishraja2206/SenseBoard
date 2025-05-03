import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InspirationNode, NodeConnection, MoodBoard, Project } from '@shared/schema';
import { moodColors } from '@/lib/mood-utils';
import { ChevronLeft } from 'lucide-react';
import SimpleBreadcrumb from '@/components/ui/Breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FlowMapViewProps {
  moodBoardId: string;
}

const FlowMapView: React.FC<FlowMapViewProps> = ({ moodBoardId }) => {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Fetch mood board data
  const { data: moodBoard, isLoading: isLoadingMoodBoard } = useQuery({
    queryKey: ['/api/moodboards', moodBoardId],
    queryFn: async () => {
      const res = await fetch(`/api/moodboards/${moodBoardId}`);
      if (!res.ok) throw new Error('Failed to fetch mood board');
      return res.json() as Promise<MoodBoard>;
    },
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
  
  // Grouped nodes by mood
  const nodesByMood = React.useMemo(() => {
    const grouped: Record<string, InspirationNode[]> = {};
    
    nodes.forEach(node => {
      if (!grouped[node.mood]) {
        grouped[node.mood] = [];
      }
      grouped[node.mood].push(node);
    });
    
    return grouped;
  }, [nodes]);
  
  // Node connections visualization
  const nodeConnections = React.useMemo(() => {
    const connectionMap: Record<number, number[]> = {};
    
    connections.forEach(connection => {
      if (!connectionMap[connection.sourceNodeId]) {
        connectionMap[connection.sourceNodeId] = [];
      }
      connectionMap[connection.sourceNodeId].push(connection.targetNodeId);
    });
    
    return connectionMap;
  }, [connections]);
  
  // Navigate back to mood canvas
  const handleBackToCanvas = () => {
    setLocation(`/moodboard/${moodBoardId}`);
  };
  
  // Loading state
  if (isLoadingMoodBoard || isLoadingNodes || isLoadingConnections) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flow map...</p>
        </div>
      </div>
    );
  }
  
  // Fetch project data
  const { data: project } = useQuery({
    queryKey: ['/api/projects', moodBoard?.projectId],
    queryFn: async () => {
      if (!moodBoard?.projectId) return null;
      const res = await fetch(`/api/projects/${moodBoard.projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      return res.json() as Promise<Project>;
    },
    enabled: !!moodBoard?.projectId,
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Breadcrumb navigation */}
      <div className="bg-background/60 backdrop-blur-sm border-b border-border px-6 py-2 z-10">
        <div className="flex justify-between items-center">
          <SimpleBreadcrumb 
            items={[
              { label: project?.name || `Project #${moodBoard?.projectId}`, href: `/project/${moodBoard?.projectId}` },
              { label: moodBoard?.name || 'Mood Board', href: `/moodboard/${moodBoardId}` },
              { label: 'Flow Map' }
            ]}
          />
          <div className="flex items-center">
            <div className="flex -space-x-3 mr-3">
              <div className="w-8 h-8 rounded-full border-2 border-background bg-primary flex items-center justify-center text-white font-medium shadow-md cursor-pointer hover:scale-110 transition-transform">
                A
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-background bg-focused flex items-center justify-center text-white font-medium shadow-md cursor-pointer hover:scale-110 transition-transform">
                J
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-background bg-energetic flex items-center justify-center text-white font-medium shadow-md cursor-pointer hover:scale-110 transition-transform">
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
      
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={handleBackToCanvas} className="mr-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Canvas
          </Button>
          
          <div>
            <h1 className="text-2xl font-display font-bold">{moodBoard?.name} Flow Map</h1>
            <p className="text-sm text-muted-foreground">{moodBoard?.description}</p>
          </div>
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-[600px] overflow-hidden">
              <CardHeader className="pb-0">
                <CardTitle>Flow Map Visualization</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <div className="relative w-full h-full">
                  {/* Central node representing the core */}
                  <div 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full primary-gradient flex items-center justify-center z-10"
                  >
                    <span className="text-white font-display font-bold">Mood Core</span>
                  </div>
                  
                  {/* SVG for connection lines */}
                  <svg className="absolute inset-0 w-full h-full">
                    {/* Draw connections from core to mood groups */}
                    {Object.keys(nodesByMood).map((mood, index) => {
                      const angle = (2 * Math.PI / Object.keys(nodesByMood).length) * index;
                      const x1 = 50;
                      const y1 = 50;
                      const x2 = 50 + 30 * Math.cos(angle);
                      const y2 = 50 + 30 * Math.sin(angle);
                      
                      return (
                        <line 
                          key={`core-to-${mood}`}
                          x1={`${x1}%`} 
                          y1={`${y1}%`} 
                          x2={`${x2}%`} 
                          y2={`${y2}%`}
                          stroke={moodColors[mood as keyof typeof moodColors] || '#7B68EE'}
                          strokeWidth="3"
                          strokeOpacity="0.6"
                          className="node-connection"
                        />
                      );
                    })}
                    
                    {/* Draw connections between connected nodes */}
                    {Object.entries(nodeConnections).map(([sourceIdStr, targetIds]) => {
                      const sourceId = parseInt(sourceIdStr);
                      const sourceNode = nodes.find(n => n.id === sourceId);
                      if (!sourceNode) return null;
                      
                      return targetIds.map(targetId => {
                        const targetNode = nodes.find(n => n.id === targetId);
                        if (!targetNode) return null;
                        
                        // Calculate positions (simplified)
                        const sourceMoodIndex = Object.keys(nodesByMood).indexOf(sourceNode.mood);
                        const targetMoodIndex = Object.keys(nodesByMood).indexOf(targetNode.mood);
                        const sourceMoodAngle = (2 * Math.PI / Object.keys(nodesByMood).length) * sourceMoodIndex;
                        const targetMoodAngle = (2 * Math.PI / Object.keys(nodesByMood).length) * targetMoodIndex;
                        
                        const sourceIndex = nodesByMood[sourceNode.mood].indexOf(sourceNode);
                        const targetIndex = nodesByMood[targetNode.mood].indexOf(targetNode);
                        
                        const sourceAngleOffset = 0.2 * (sourceIndex - nodesByMood[sourceNode.mood].length / 2);
                        const targetAngleOffset = 0.2 * (targetIndex - nodesByMood[targetNode.mood].length / 2);
                        
                        const sourceX = 50 + 35 * Math.cos(sourceMoodAngle + sourceAngleOffset);
                        const sourceY = 50 + 35 * Math.sin(sourceMoodAngle + sourceAngleOffset);
                        const targetX = 50 + 35 * Math.cos(targetMoodAngle + targetAngleOffset);
                        const targetY = 50 + 35 * Math.sin(targetMoodAngle + targetAngleOffset);
                        
                        return (
                          <line 
                            key={`conn-${sourceId}-${targetId}`}
                            x1={`${sourceX}%`} 
                            y1={`${sourceY}%`} 
                            x2={`${targetX}%`} 
                            y2={`${targetY}%`}
                            stroke="#4169E1"
                            strokeWidth="1.5"
                            strokeOpacity="0.4"
                            strokeDasharray="4"
                          />
                        );
                      });
                    })}
                  </svg>
                  
                  {/* Render mood group nodes */}
                  {Object.entries(nodesByMood).map(([mood, moodNodes], moodIndex) => {
                    const angle = (2 * Math.PI / Object.keys(nodesByMood).length) * moodIndex;
                    const centerX = 50 + 30 * Math.cos(angle);
                    const centerY = 50 + 30 * Math.sin(angle);
                    
                    return (
                      <div 
                        key={`mood-${mood}`}
                        className="absolute w-20 h-20 rounded-full flex items-center justify-center"
                        style={{
                          left: `${centerX}%`,
                          top: `${centerY}%`,
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: moodColors[mood as keyof typeof moodColors] || '#7B68EE',
                          opacity: 0.8,
                        }}
                      >
                        <span className="text-white font-medium text-sm">
                          {mood.charAt(0).toUpperCase() + mood.slice(1)}
                          <br />
                          {moodNodes.length} items
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Render individual nodes */}
                  {Object.entries(nodesByMood).map(([mood, moodNodes], moodIndex) => {
                    const moodAngle = (2 * Math.PI / Object.keys(nodesByMood).length) * moodIndex;
                    
                    return moodNodes.map((node, nodeIndex) => {
                      const angleOffset = 0.2 * (nodeIndex - moodNodes.length / 2);
                      const distance = 40 + (nodeIndex % 2) * 5; // Vary distance slightly
                      const nodeX = 50 + distance * Math.cos(moodAngle + angleOffset);
                      const nodeY = 50 + distance * Math.sin(moodAngle + angleOffset);
                      
                      return (
                        <div 
                          key={`node-${node.id}`}
                          className="absolute w-12 h-12 rounded-full flex items-center justify-center text-xs bg-card border border-border shadow-md"
                          style={{
                            left: `${nodeX}%`,
                            top: `${nodeY}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          title={node.title}
                        >
                          {node.type === 'image' && '🖼️'}
                          {node.type === 'audio' && '🔊'}
                          {node.type === 'sketch' && '✏️'}
                          {node.type === 'thought' && '💭'}
                          {node.type === 'link' && '🔗'}
                        </div>
                      );
                    });
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Flow Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Composition</h3>
                  <div className="space-y-2">
                    {Object.entries(nodesByMood).map(([mood, moodNodes]) => (
                      <div key={`summary-${mood}`} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: moodColors[mood as keyof typeof moodColors] || '#7B68EE' }}
                          ></div>
                          <span className="text-sm">{mood.charAt(0).toUpperCase() + mood.slice(1)}</span>
                        </div>
                        <span className="text-sm font-medium">{moodNodes.length} items</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Connections</h3>
                  <div className="text-sm text-center p-4 bg-secondary rounded-md">
                    <div className="text-3xl font-display font-bold mb-1">{connections.length}</div>
                    <p className="text-muted-foreground">Total Connections</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Node Types</h3>
                  <div className="grid grid-cols-5 gap-2 text-xs text-center">
                    {['image', 'audio', 'sketch', 'thought', 'link'].map(type => {
                      const count = nodes.filter(n => n.type === type).length;
                      return (
                        <div key={`type-${type}`} className="p-2 bg-secondary rounded-md">
                          <div className="mb-1">
                            {type === 'image' && '🖼️'}
                            {type === 'audio' && '🔊'}
                            {type === 'sketch' && '✏️'}
                            {type === 'thought' && '💭'}
                            {type === 'link' && '🔗'}
                          </div>
                          <div className="font-medium">{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
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
                      className="mr-2"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download as PNG
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
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
                      className="mr-2"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                    Export as PDF
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
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
                      className="mr-2"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="3" y1="9" x2="21" y2="9" />
                      <line x1="3" y1="15" x2="21" y2="15" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                      <line x1="15" y1="3" x2="15" y2="21" />
                    </svg>
                    Share Flow Map
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowMapView;