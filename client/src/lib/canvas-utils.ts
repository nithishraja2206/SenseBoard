import { Point, Size, InspirationNodePosition, Connection } from "@/types";
import { InspirationNode, NodeConnection } from "@shared/schema";

// Calculate connection points between two nodes
export function calculateConnectionPoints(
  sourceNode: InspirationNodePosition,
  targetNode: InspirationNodePosition
): { start: Point; end: Point } {
  // Get center points of each node
  const sourceCenter: Point = {
    x: sourceNode.position.x + sourceNode.size.width / 2,
    y: sourceNode.position.y + sourceNode.size.height / 2,
  };
  
  const targetCenter: Point = {
    x: targetNode.position.x + targetNode.size.width / 2,
    y: targetNode.position.y + targetNode.size.height / 2,
  };
  
  return {
    start: sourceCenter,
    end: targetCenter,
  };
}

// Convert backend node connections to frontend format
export function formatNodeConnections(
  connections: NodeConnection[],
  nodes: InspirationNode[]
): Connection[] {
  return connections.map((connection) => ({
    id: connection.id,
    source: connection.sourceNodeId,
    target: connection.targetNodeId,
    strength: connection.strength || 50,
  }));
}

// Format node positions from backend nodes
export function formatNodePositions(nodes: InspirationNode[]): InspirationNodePosition[] {
  return nodes.map((node) => ({
    id: node.id,
    position: {
      x: node.positionX,
      y: node.positionY,
    },
    size: {
      width: node.width || 320,
      height: node.height || 200,
    },
    zIndex: node.zIndex || 1,
  }));
}

// Calculate distance between two points
export function calculateDistance(point1: Point, point2: Point): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

// Check if two nodes are overlapping
export function areNodesOverlapping(
  node1: InspirationNodePosition,
  node2: InspirationNodePosition
): boolean {
  return (
    node1.position.x < node2.position.x + node2.size.width &&
    node1.position.x + node1.size.width > node2.position.x &&
    node1.position.y < node2.position.y + node2.size.height &&
    node1.position.y + node1.size.height > node2.position.y
  );
}

// Find a non-overlapping position for a new node
export function findNonOverlappingPosition(
  newNodeSize: Size,
  existingNodes: InspirationNodePosition[],
  canvasSize: Size,
  startPosition?: Point
): Point {
  const initialPosition: Point = startPosition || {
    x: Math.random() * (canvasSize.width - newNodeSize.width - 100) + 50,
    y: Math.random() * (canvasSize.height - newNodeSize.height - 100) + 50,
  };
  
  const virtualNode: InspirationNodePosition = {
    id: -1,
    position: initialPosition,
    size: newNodeSize,
    zIndex: 1,
  };
  
  // Check if the initial position overlaps with any existing node
  const hasOverlap = existingNodes.some((node) =>
    areNodesOverlapping(virtualNode, node)
  );
  
  if (!hasOverlap) {
    return initialPosition;
  }
  
  // Try to find a non-overlapping position with spiral algorithm
  const spiralStep = 50;
  const maxAttempts = 20;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const angle = 0.5 * attempt;
    const distance = spiralStep * attempt;
    
    const newPosition: Point = {
      x: initialPosition.x + distance * Math.cos(angle),
      y: initialPosition.y + distance * Math.sin(angle),
    };
    
    // Make sure it's within canvas bounds
    newPosition.x = Math.max(0, Math.min(canvasSize.width - newNodeSize.width, newPosition.x));
    newPosition.y = Math.max(0, Math.min(canvasSize.height - newNodeSize.height, newPosition.y));
    
    virtualNode.position = newPosition;
    
    const stillOverlapping = existingNodes.some((node) =>
      areNodesOverlapping(virtualNode, node)
    );
    
    if (!stillOverlapping) {
      return newPosition;
    }
  }
  
  // If we couldn't find a non-overlapping position, return the initial position
  return initialPosition;
}

// Create ripple effect at a specific position
export function createRippleEffect(
  canvasRef: React.RefObject<HTMLDivElement>,
  position: Point
): void {
  if (!canvasRef.current) return;
  
  const ripple = document.createElement("div");
  ripple.classList.add("mood-ripple");
  ripple.style.left = `${position.x}px`;
  ripple.style.top = `${position.y}px`;
  ripple.style.width = "50px";
  ripple.style.height = "50px";
  
  canvasRef.current.appendChild(ripple);
  
  // Remove the element after animation completes
  setTimeout(() => {
    if (ripple && ripple.parentNode) {
      ripple.parentNode.removeChild(ripple);
    }
  }, 2000);
}
