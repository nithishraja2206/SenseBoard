import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InspirationNode, NodeConnection, MoodBoard } from '@shared/schema';
import { moodColors } from '@/lib/mood-utils';
import { ChevronLeft } from 'lucide-react';

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
  
  return (
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
                    <path d="M12 3v12" />
                    <path d="m8 11 4 4 4-4" />
                    <path d="M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" />
                  </svg>
                  Download as PDF
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
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m2 12 20 0" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  Share Flow Map
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
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                  Export Project Package
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlowMapView;
