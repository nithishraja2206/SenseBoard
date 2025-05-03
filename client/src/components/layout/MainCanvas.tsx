import React, { useRef, useEffect } from 'react';
import InspirationCard from '@/components/inspiration/InspirationCard';
import ConnectionLines from '@/components/ui/ConnectionLines';
import { Button } from '@/components/ui/button';
import { useCanvas } from '@/hooks/use-canvas';
import { InspirationNode, NodeConnection } from '@shared/schema';
import { Point } from '@/types';

interface MainCanvasProps {
  nodes: InspirationNode[];
  connections: NodeConnection[];
  onAddInspiration: () => void;
}

const MainCanvas: React.FC<MainCanvasProps> = ({ 
  nodes, 
  connections, 
  onAddInspiration 
}) => {
  const {
    canvasRef,
    nodePositions,
    nodeConnections,
    dragState,
    connectionMode,
    startDragging,
    startConnectionMode,
    createConnection,
    cancelConnectionMode,
    createRipple,
  } = useCanvas(nodes, connections);
  
  // Create random ripples occasionally
  useEffect(() => {
    const createRandomRipple = () => {
      if (!canvasRef.current) return;
      
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const x = Math.random() * canvasRect.width;
      const y = Math.random() * canvasRect.height;
      
      createRipple({ x, y });
    };
    
    const interval = setInterval(createRandomRipple, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, [createRipple]);
  
  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent) => {
    // If in connection mode, cancel it when clicking on the canvas
    if (connectionMode.active) {
      cancelConnectionMode();
    }
  };
  
  // Handle node click - used for creating connections
  const handleNodeClick = (nodeId: number) => {
    if (connectionMode.active && connectionMode.sourceNodeId !== null) {
      createConnection(nodeId);
    }
  };

  return (
    <div 
      ref={canvasRef}
      className="flex-1 relative overflow-hidden" 
      onClick={handleCanvasClick}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-background opacity-90"></div>
      <div className="absolute top-10 left-1/4 w-64 h-64 rounded-full bg-primary/10 filter blur-3xl"></div>
      <div className="absolute bottom-20 right-1/3 w-80 h-80 rounded-full bg-accent/10 filter blur-3xl"></div>
      
      {/* Connection lines between nodes */}
      <ConnectionLines 
        nodePositions={nodePositions} 
        connections={nodeConnections} 
      />
      
      {/* Canvas content with inspiration cards */}
      <div className="absolute inset-0 p-5 overflow-auto">
        {nodes.map((node) => {
          const position = nodePositions.find(p => p.id === node.id);
          
          if (!position) return null;
          
          return (
            <InspirationCard
              key={node.id}
              node={node}
              position={position}
              isDragging={dragState.isDragging && dragState.nodeId === node.id}
              onDragStart={(e) => startDragging(e, node.id, position.position)}
              onNodeClick={() => handleNodeClick(node.id)}
              onStartConnection={() => startConnectionMode(node.id)}
              isConnectionMode={connectionMode.active}
              isConnectionSource={connectionMode.sourceNodeId === node.id}
            />
          );
        })}
        
        {/* Floating Add Button - higher z-index to stay on top of inspiration cards */}
        <Button 
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 primary-gradient shadow-lg px-4 py-2 rounded-full text-white font-medium flex items-center z-50"
          onClick={onAddInspiration}
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
            className="mr-2"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          <span>Add Inspiration</span>
        </Button>
      </div>
    </div>
  );
};

export default MainCanvas;
