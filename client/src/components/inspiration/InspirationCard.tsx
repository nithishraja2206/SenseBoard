import React from 'react';
import { InspirationNode } from '@shared/schema';
import { InspirationNodePosition } from '@/types';
import SketchCard from './SketchCard';
import ImageCard from './ImageCard';
import AudioCard from './AudioCard';
import ThoughtCard from './ThoughtCard';
import LinkCard from './LinkCard';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Link } from 'lucide-react';

interface InspirationCardProps {
  node: InspirationNode;
  position: InspirationNodePosition;
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  onNodeClick: () => void;
  onStartConnection: () => void;
  isConnectionMode: boolean;
  isConnectionSource: boolean;
}

const InspirationCard: React.FC<InspirationCardProps> = ({ 
  node, 
  position, 
  isDragging,
  onDragStart,
  onNodeClick,
  onStartConnection,
  isConnectionMode,
  isConnectionSource
}) => {
  const cardStyles: React.CSSProperties = {
    position: 'absolute',
    left: `${position.position.x}px`,
    top: `${position.position.y}px`,
    width: `${position.size.width}px`,
    zIndex: position.zIndex,
    cursor: isDragging ? 'grabbing' : 'grab',
  };
  
  const getCardComponent = () => {
    switch (node.type) {
      case 'sketch':
        return <SketchCard node={node} />;
      case 'image':
        return <ImageCard node={node} />;
      case 'audio':
        return <AudioCard node={node} />;
      case 'thought':
        return <ThoughtCard node={node} />;
      case 'link':
        return <LinkCard node={node} />;
      default:
        return null;
    }
  };
  
  const handleClickCard = (e: React.MouseEvent) => {
    // Only handle click if we're in connection mode
    if (isConnectionMode && !isConnectionSource) {
      e.stopPropagation();
      onNodeClick();
    }
  };

  return (
    <div 
      className={`mood-card card-glow ${isConnectionMode ? 'pointer-events-auto' : ''} ${isConnectionSource ? 'ring-2 ring-primary' : ''}`}
      style={cardStyles}
      onMouseDown={(e) => {
        if (!isConnectionMode) onDragStart(e);
      }}
      onClick={handleClickCard}
    >
      {getCardComponent()}
      
      <div className="flex items-center mt-3 px-4 pb-4">
        <span className="text-xs text-muted-foreground">Intensity</span>
        <div className="ml-2 w-24 h-1 bg-secondary rounded-full">
          <div 
            className="h-full rounded-full" 
            style={{ 
              width: `${node.intensity}%`,
              backgroundColor: 
                node.mood === 'calm' ? 'hsl(var(--calm))' : 
                node.mood === 'energetic' ? 'hsl(var(--energetic))' : 
                'hsl(var(--focused))'
            }}
          ></div>
        </div>
        <div className="ml-auto flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              onStartConnection();
            }}
          >
            <Link className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InspirationCard;
