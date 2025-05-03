import React from 'react';
import { Button } from '@/components/ui/button';
import FlowMap from '@/components/ui/FlowMap';
import { InspirationNode, NodeConnection, MoodType } from '@shared/schema';
import { moodColors } from '@/lib/mood-utils';

interface RightPanelProps {
  nodes: InspirationNode[];
  connections: NodeConnection[];
  moodSummary: Record<string, { count: number; intensity: number }>;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
  nodes = [], 
  connections = [], 
  moodSummary = {}
}) => {
  // Calculate percentages for mood bars
  const calculatePercentage = (moodType: string): number => {
    if (!moodSummary[moodType]) return 0;
    
    const totalCount = Object.values(moodSummary).reduce(
      (sum, data) => sum + data.count, 
      0
    );
    
    return totalCount > 0
      ? Math.round((moodSummary[moodType].count / totalCount) * 100)
      : 0;
  };
  
  // Get color for mood type
  const getMoodColor = (moodType: string): string => {
    return moodColors[moodType as MoodType] || '#607D8B';
  };

  return (
    <div className="w-64 glass-panel border-l border-gray-800 flex flex-col">
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">Flow Map</h2>
        
        <div className="mt-3 bg-secondary rounded-lg p-3 h-64">
          <FlowMap nodes={nodes} connections={connections} />
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-800">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">Project Mood</h2>
          <Button variant="link" size="sm" className="text-xs text-primary p-0">
            View History
          </Button>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Calm</span>
            <span>{calculatePercentage('calm')}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full w-full">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${calculatePercentage('calm')}%`,
                backgroundColor: getMoodColor('calm')
              }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground mb-1 mt-3">
            <span>Energetic</span>
            <span>{calculatePercentage('energetic')}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full w-full">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${calculatePercentage('energetic')}%`,
                backgroundColor: getMoodColor('energetic')
              }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground mb-1 mt-3">
            <span>Focused</span>
            <span>{calculatePercentage('focused')}%</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full w-full">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${calculatePercentage('focused')}%`,
                backgroundColor: getMoodColor('focused')
              }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h2 className="font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">AI Assistant</h2>
          <Button variant="link" size="sm" className="text-xs text-primary p-0">
            Configure
          </Button>
        </div>
        
        <div className="mt-3 bg-secondary rounded-lg p-3">
          <div className="text-sm font-medium mb-2">Suggested Connections</div>
          
          <div className="space-y-2">
            <div className="p-2 rounded border border-gray-700 bg-card hover:border-primary/50 cursor-pointer transition duration-200">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded bg-[hsl(var(--focused))]/20 flex items-center justify-center">
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
                    className="text-[hsl(var(--focused))]"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 12h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                    <path d="M12 6v2" />
                    <path d="M12 16v2" />
                  </svg>
                </div>
                <div className="ml-2">
                  <div className="text-xs font-medium">Connect similar mood items</div>
                  <div className="text-xs text-muted-foreground mt-0.5">80% mood compatibility</div>
                </div>
              </div>
            </div>
            
            <div className="p-2 rounded border border-gray-700 bg-card hover:border-primary/50 cursor-pointer transition duration-200">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded bg-[hsl(var(--energetic))]/20 flex items-center justify-center">
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
                    className="text-[hsl(var(--energetic))]"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M16 12h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                    <path d="M12 6v2" />
                    <path d="M12 16v2" />
                  </svg>
                </div>
                <div className="ml-2">
                  <div className="text-xs font-medium">Add new mood board section</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Based on your current flow</div>
                </div>
              </div>
            </div>
          </div>
          
          <Button variant="link" size="sm" className="mt-3 text-xs flex items-center text-primary p-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <path d="m12 2-5.5 9h11L12 2z" />
              <path d="m4.5 13.5 3.5 6h8l3.5-6H4.5z" />
            </svg>
            <span>Generate more suggestions</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
