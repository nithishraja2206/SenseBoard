import { useState, useRef, useEffect, useCallback } from "react";
import { InspirationNode, NodeConnection } from "@shared/schema";
import { DragState, Point, Size, InspirationNodePosition, Connection } from "@/types";
import {
  formatNodePositions,
  formatNodeConnections,
  findNonOverlappingPosition,
  createRippleEffect,
} from "@/lib/canvas-utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function useCanvas(nodes: InspirationNode[], connections: NodeConnection[]) {
  const [nodePositions, setNodePositions] = useState<InspirationNodePosition[]>([]);
  const [nodeConnections, setNodeConnections] = useState<Connection[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    offset: { x: 0, y: 0 },
    nodeId: null,
  });
  const [canvasSize, setCanvasSize] = useState<Size>({ width: 0, height: 0 });
  const [connectionMode, setConnectionMode] = useState<{
    active: boolean;
    sourceNodeId: number | null;
  }>({ active: false, sourceNodeId: null });
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Initialize node positions and connections
  useEffect(() => {
    if (nodes.length > 0) {
      setNodePositions(formatNodePositions(nodes));
    }
    
    if (connections.length > 0) {
      setNodeConnections(formatNodeConnections(connections, nodes));
    }
  }, [nodes, connections]);
  
  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        setCanvasSize({
          width: canvasRef.current.clientWidth,
          height: canvasRef.current.clientHeight,
        });
      }
    };
    
    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
    };
  }, []);
  
  // Start dragging a node
  const startDragging = useCallback((
    e: React.MouseEvent,
    nodeId: number,
    nodePosition: Point
  ) => {
    e.preventDefault();
    
    // Calculate offset between mouse position and node position
    const offset: Point = {
      x: e.clientX - nodePosition.x,
      y: e.clientY - nodePosition.y,
    };
    
    setDragState({
      isDragging: true,
      offset,
      nodeId,
    });
  }, []);
  
  // Handle mouse move during dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || dragState.nodeId === null) return;
    
    const newX = e.clientX - dragState.offset.x;
    const newY = e.clientY - dragState.offset.y;
    
    // Update node position
    setNodePositions((prev) =>
      prev.map((node) =>
        node.id === dragState.nodeId
          ? {
              ...node,
              position: {
                x: Math.max(0, Math.min(canvasSize.width - node.size.width, newX)),
                y: Math.max(0, Math.min(canvasSize.height - node.size.height, newY)),
              },
              zIndex: 10, // Bring to front while dragging
            }
          : node
      )
    );
  }, [dragState, canvasSize]);
  
  // End dragging
  const stopDragging = useCallback(async () => {
    if (!dragState.isDragging || dragState.nodeId === null) return;
    
    // Find the updated node
    const updatedNode = nodePositions.find((node) => node.id === dragState.nodeId);
    if (!updatedNode) return;
    
    try {
      // Update node position in the backend
      await apiRequest("PATCH", `/api/nodes/${updatedNode.id}`, {
        positionX: updatedNode.position.x,
        positionY: updatedNode.position.y,
        zIndex: 1, // Reset z-index
      });
      
      // Reset z-index in the frontend
      setNodePositions((prev) =>
        prev.map((node) =>
          node.id === dragState.nodeId
            ? { ...node, zIndex: 1 }
            : node
        )
      );
    } catch (error) {
      toast({
        title: "Error updating node position",
        description: "Failed to save the node position.",
        variant: "destructive",
      });
    }
    
    // Reset drag state
    setDragState({
      isDragging: false,
      offset: { x: 0, y: 0 },
      nodeId: null,
    });
  }, [dragState, nodePositions, toast]);
  
  // Add event listeners for mouse move and mouse up
  useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopDragging);
    }
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
    };
  }, [dragState.isDragging, handleMouseMove, stopDragging]);
  
  // Create a ripple effect
  const createRipple = useCallback((position: Point) => {
    if (canvasRef.current) {
      createRippleEffect(canvasRef, position);
    }
  }, []);
  
  // Find a new position for a node
  const getNewNodePosition = useCallback((size: Size): Point => {
    return findNonOverlappingPosition(size, nodePositions, canvasSize);
  }, [nodePositions, canvasSize]);
  
  // Enter connection mode
  const startConnectionMode = useCallback((sourceNodeId: number) => {
    setConnectionMode({
      active: true,
      sourceNodeId,
    });
    
    toast({
      title: "Connection Mode Active",
      description: "Click on another node to create a connection.",
    });
  }, [toast]);
  
  // Create a connection between nodes
  const createConnection = useCallback(async (targetNodeId: number) => {
    if (!connectionMode.active || connectionMode.sourceNodeId === null) return;
    if (connectionMode.sourceNodeId === targetNodeId) {
      toast({
        title: "Invalid Connection",
        description: "Cannot connect a node to itself.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if connection already exists
    const existingConnection = nodeConnections.find(
      (conn) =>
        (conn.source === connectionMode.sourceNodeId && conn.target === targetNodeId) ||
        (conn.source === targetNodeId && conn.target === connectionMode.sourceNodeId)
    );
    
    if (existingConnection) {
      toast({
        title: "Connection Exists",
        description: "These nodes are already connected.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create connection in the backend
      const response = await apiRequest("POST", "/api/connections", {
        sourceNodeId: connectionMode.sourceNodeId,
        targetNodeId,
        strength: 50,
      });
      
      const newConnection: Connection = {
        id: response.id,
        source: connectionMode.sourceNodeId,
        target: targetNodeId,
        strength: 50,
      };
      
      // Add connection to state
      setNodeConnections((prev) => [...prev, newConnection]);
      
      // Create ripple effect between nodes
      const sourceNode = nodePositions.find((node) => node.id === connectionMode.sourceNodeId);
      const targetNode = nodePositions.find((node) => node.id === targetNodeId);
      
      if (sourceNode && targetNode) {
        const midPoint: Point = {
          x: (sourceNode.position.x + targetNode.position.x) / 2,
          y: (sourceNode.position.y + targetNode.position.y) / 2,
        };
        
        createRipple(midPoint);
      }
      
      toast({
        title: "Connection Created",
        description: "Nodes connected successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create connection.",
        variant: "destructive",
      });
    }
    
    // Exit connection mode
    setConnectionMode({
      active: false,
      sourceNodeId: null,
    });
  }, [connectionMode, nodeConnections, nodePositions, createRipple, toast]);
  
  // Cancel connection mode
  const cancelConnectionMode = useCallback(() => {
    setConnectionMode({
      active: false,
      sourceNodeId: null,
    });
  }, []);
  
  // Delete a connection
  const deleteConnection = useCallback(async (connectionId: number) => {
    try {
      await apiRequest("DELETE", `/api/connections/${connectionId}`);
      
      setNodeConnections((prev) =>
        prev.filter((conn) => conn.id !== connectionId)
      );
      
      toast({
        title: "Connection Removed",
        description: "Connection deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete connection.",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  return {
    canvasRef,
    nodePositions,
    nodeConnections,
    dragState,
    connectionMode,
    startDragging,
    startConnectionMode,
    createConnection,
    cancelConnectionMode,
    deleteConnection,
    getNewNodePosition,
    createRipple,
  };
}
