import React, { useRef, useEffect, useState } from 'react';

interface SimpleCanvasProps {
  width?: number;
  height?: number;
  color?: string;
  brushSize?: number;
  mode?: 'draw' | 'erase';
  className?: string;
  onDrawEnd?: (svgContent: string) => void;
}

interface Point {
  x: number;
  y: number;
}

const SimpleCanvas: React.FC<SimpleCanvasProps> = ({
  width = 400,
  height = 300,
  color = '#4FC3F7',
  brushSize = 3,
  mode = 'draw',
  className = '',
  onDrawEnd
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size with proper scaling for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Get context and scale it
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.scale(dpr, dpr);
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.fillStyle = 'rgba(30, 30, 30, 0.9)';
    
    // Fill background
    context.fillRect(0, 0, width, height);
    
    contextRef.current = context;
    
    console.log('Simple canvas initialized:', width, height);
  }, [width, height]);
  
  // Update brush style when color or size changes
  useEffect(() => {
    if (!contextRef.current) return;
    
    contextRef.current.strokeStyle = mode === 'erase' ? 'rgba(30, 30, 30, 0.9)' : color;
    contextRef.current.lineWidth = mode === 'erase' ? brushSize * 2 : brushSize;
    
    console.log('Brush updated:', { color, size: brushSize, mode });
  }, [color, brushSize, mode]);
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas || !contextRef.current) return;
    
    setIsDrawing(true);
    
    // Get cursor position
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Begin path at cursor position
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    
    // Track points for SVG export
    setPoints([{ x, y }]);
    
    console.log('Drawing started at:', x, y);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing || !contextRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get cursor position
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Draw line to cursor position
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    
    // Track points for SVG export
    setPoints(prevPoints => [...prevPoints, { x, y }]);
  };
  
  const endDrawing = () => {
    if (!isDrawing || !contextRef.current) return;
    
    contextRef.current.closePath();
    setIsDrawing(false);
    
    // Create SVG content
    if (onDrawEnd && points.length > 1) {
      const svgContent = generateSVG();
      onDrawEnd(svgContent);
    }
    
    console.log('Drawing ended, points:', points.length);
  };
  
  const generateSVG = (): string => {
    if (points.length < 2) return '';
    
    // Create path from points
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    
    // Create SVG content
    const strokeWidth = mode === 'erase' ? brushSize * 2 : brushSize;
    const strokeColor = mode === 'erase' ? 'rgba(30, 30, 30, 0.9)' : color;
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="rgba(30, 30, 30, 0.9)" />
        <path d="${d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" />
      </svg>
    `;
    
    return svg;
  };
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    
    if (!canvas || !context) return;
    
    context.fillStyle = 'rgba(30, 30, 30, 0.9)';
    context.fillRect(0, 0, width, height);
    setPoints([]);
    
    console.log('Canvas cleared');
  };
  
  return (
    <canvas
      ref={canvasRef}
      className={`touch-none ${className}`}
      style={{ 
        cursor: 'crosshair',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none'
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={endDrawing}
      onMouseLeave={endDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={endDrawing}
    />
  );
};

export default SimpleCanvas;