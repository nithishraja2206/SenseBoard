import React from 'react';
import { InspirationNodePosition, Connection } from '@/types';
import { calculateConnectionPoints } from '@/lib/canvas-utils';

interface ConnectionLinesProps {
  nodePositions: InspirationNodePosition[];
  connections: Connection[];
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ 
  nodePositions, 
  connections 
}) => {
  if (!nodePositions.length || !connections.length) {
    return null;
  }

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {connections.map((connection) => {
        const sourceNode = nodePositions.find(
          (node) => node.id === connection.source
        );
        const targetNode = nodePositions.find(
          (node) => node.id === connection.target
        );
        
        if (!sourceNode || !targetNode) {
          return null;
        }
        
        const { start, end } = calculateConnectionPoints(sourceNode, targetNode);
        
        // Use opacity based on connection strength
        const opacity = (connection.strength / 100) * 0.6 + 0.2;
        
        return (
          <line
            key={`connection-${connection.id}`}
            x1={start.x}
            y1={start.y}
            x2={end.x}
            y2={end.y}
            className="node-connection"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeOpacity={opacity}
          />
        );
      })}
    </svg>
  );
};

export default ConnectionLines;
