import React, { useMemo } from 'react';
import { InspirationNode, NodeConnection } from '@shared/schema';
import { moodColors } from '@/lib/mood-utils';

interface FlowMapProps {
  nodes: InspirationNode[];
  connections: NodeConnection[];
}

const FlowMap: React.FC<FlowMapProps> = ({ nodes, connections }) => {
  // Group nodes by mood for visualization
  const nodesByMood = useMemo(() => {
    const groupedNodes: Record<string, InspirationNode[]> = {};
    
    nodes.forEach(node => {
      if (!groupedNodes[node.mood]) {
        groupedNodes[node.mood] = [];
      }
      groupedNodes[node.mood].push(node);
    });
    
    return groupedNodes;
  }, [nodes]);
  
  // Calculate node positions in a radial layout
  const nodePositions = useMemo(() => {
    const positions: Record<number, { x: number, y: number }> = {};
    
    // Center node (represents the core/project)
    const centerX = 110;
    const centerY = 110;
    
    // Create positions in a radial layout
    if (nodes.length > 0) {
      // Count mooods for distributing nodes
      const moodCounts = Object.keys(nodesByMood).length;
      
      let nodeIndex = 0;
      Object.entries(nodesByMood).forEach(([mood, moodNodes], moodIndex) => {
        const angleOffset = (2 * Math.PI / moodCounts) * moodIndex;
        
        moodNodes.forEach((node, i) => {
          // Distribute nodes within each mood sector
          const angleWithinSector = (Math.PI / 4) * (i % 3 - 1);
          const angle = angleOffset + angleWithinSector;
          
          // Distance from center varies with each node
          const radius = 60 + (i % 3 === 1 ? 0 : 15);
          
          positions[node.id] = {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
          };
          
          nodeIndex++;
        });
      });
    }
    
    return positions;
  }, [nodes, nodesByMood]);
  
  // Extract connections for visualization
  const connectionLines = useMemo(() => {
    return connections.map(conn => {
      const sourcePos = nodePositions[conn.sourceNodeId];
      const targetPos = nodePositions[conn.targetNodeId];
      
      if (!sourcePos || !targetPos) return null;
      
      return {
        id: conn.id,
        sourceX: sourcePos.x,
        sourceY: sourcePos.y,
        targetX: targetPos.x,
        targetY: targetPos.y,
        strength: conn.strength || 50,
      };
    }).filter(Boolean);
  }, [connections, nodePositions]);
  
  // Get the main node color based on node type
  const getNodeColor = (node: InspirationNode) => {
    return moodColors[node.mood as keyof typeof moodColors] || '#7B68EE';
  };

  return (
    <svg width="100%" height="100%" viewBox="0 0 220 220">
      {/* Central node */}
      <circle cx="110" cy="110" r="20" fill="url(#centralGradient)" />
      <text x="110" y="115" textAnchor="middle" fill="white" fontSize="10">Core</text>
      
      {/* Connection lines */}
      {connectionLines.map(line => line && (
        <line
          key={`flow-connection-${line.id}`}
          x1={line.sourceX}
          y1={line.sourceY}
          x2={line.targetX}
          y2={line.targetY}
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeOpacity={(line.strength / 100) * 0.4 + 0.2}
        />
      ))}
      
      {/* Nodes */}
      {nodes.map(node => {
        const position = nodePositions[node.id];
        if (!position) return null;
        
        const color = getNodeColor(node);
        
        return (
          <circle
            key={`flow-node-${node.id}`}
            cx={position.x}
            cy={position.y}
            r="8"
            fill={color}
          />
        );
      })}
      
      {/* Gradients */}
      <defs>
        <radialGradient id="centralGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--secondary))' }} />
        </radialGradient>
      </defs>
    </svg>
  );
};

export default FlowMap;
