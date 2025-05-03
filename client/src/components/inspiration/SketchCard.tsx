import React from 'react';
import { InspirationNode } from '@shared/schema';
import MoodBadge from '@/components/ui/MoodBadge';

interface SketchCardProps {
  node: InspirationNode;
}

const SketchCard: React.FC<SketchCardProps> = ({ node }) => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-medium">{node.title}</h3>
        <MoodBadge mood={node.mood} />
      </div>
      <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
      
      <div className="mt-3 bg-secondary rounded-lg p-3">
        {node.content ? (
          <div dangerouslySetInnerHTML={{ __html: node.content }} />
        ) : (
          <svg width="100%" height="120" viewBox="0 0 240 120" xmlns="http://www.w3.org/2000/svg">
            {/* Simple wireframe sketch */}
            <rect x="20" y="10" width="200" height="30" rx="4" stroke="hsl(var(--calm))" strokeWidth="1.5" fill="none" strokeDasharray="4" />
            <circle cx="35" cy="25" r="8" stroke="hsl(var(--calm))" strokeWidth="1.5" fill="none" />
            <line x1="60" y1="25" x2="160" y2="25" stroke="hsl(var(--calm))" strokeWidth="1.5" />
            
            <rect x="20" y="50" width="95" height="60" rx="4" stroke="hsl(var(--calm))" strokeWidth="1.5" fill="none" />
            <rect x="125" y="50" width="95" height="60" rx="4" stroke="hsl(var(--calm))" strokeWidth="1.5" fill="none" />
            
            <line x1="40" y1="70" x2="95" y2="70" stroke="hsl(var(--calm))" strokeWidth="1.5" />
            <line x1="40" y1="90" x2="80" y2="90" stroke="hsl(var(--calm))" strokeWidth="1.5" />
            
            <line x1="145" y1="70" x2="200" y2="70" stroke="hsl(var(--calm))" strokeWidth="1.5" />
            <line x1="145" y1="90" x2="180" y2="90" stroke="hsl(var(--calm))" strokeWidth="1.5" />
          </svg>
        )}
      </div>
    </div>
  );
};

export default SketchCard;
