import { useState, useRef, useEffect } from 'react';
import * as fabricjs from 'fabric';
const { Canvas, PencilBrush } = fabricjs;
import { useToast } from '@/hooks/use-toast';

type SketchPadMode = 'draw' | 'select' | 'erase';
type SketchPadColor = string;

interface SketchPadState {
  mode: SketchPadMode;
  color: SketchPadColor;
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
}

export function useSketchPad() {
  const [canvas, setCanvas] = useState<fabricjs.Canvas | null>(null);
  const [state, setState] = useState<SketchPadState>({
    mode: 'draw',
    color: '#4FC3F7', // Calm color as default
    brushSize: 3,
    canUndo: false,
    canRedo: false,
  });
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  
  const { toast } = useToast();
  
  // Initialize canvas
  const initCanvas = (canvasElement: HTMLCanvasElement, container: HTMLDivElement) => {
    if (canvas) {
      canvas.dispose();
    }
    
    canvasRef.current = canvasElement;
    containerRef.current = container;
    
    // Set canvas dimensions explicitly
    canvasElement.width = container.offsetWidth;
    canvasElement.height = container.offsetHeight;
    
    try {
      const fabricCanvas = new Canvas(canvasElement, {
        isDrawingMode: true,
        width: container.offsetWidth,
        height: container.offsetHeight,
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        renderOnAddRemove: true,
        selection: false,
      });
      
      // Setup brush
      const brush = new PencilBrush(fabricCanvas);
      brush.color = state.color;
      brush.width = state.brushSize;
      fabricCanvas.freeDrawingBrush = brush;
      
      // Save initial state to history
      saveToHistory(fabricCanvas);
      
      // Handle window resize
      const resizeCanvas = () => {
        if (containerRef.current && fabricCanvas) {
          const width = containerRef.current.offsetWidth;
          const height = containerRef.current.offsetHeight;
          
          fabricCanvas.setWidth(width);
          fabricCanvas.setHeight(height);
          canvasElement.width = width;
          canvasElement.height = height;
          fabricCanvas.renderAll();
        }
      };
      
      // Call resize once to ensure proper dimensions
      resizeCanvas();
      
      window.addEventListener('resize', resizeCanvas);
      
      // Set state and return cleanup
      setCanvas(fabricCanvas);
      
      return () => {
        window.removeEventListener('resize', resizeCanvas);
        fabricCanvas.dispose();
        setCanvas(null);
      };
    } catch (error) {
      console.error("Error initializing canvas:", error);
      toast({
        title: "Error",
        description: "Failed to initialize drawing canvas. Please try again.",
        variant: "destructive",
      });
      return () => {};
    }
  };
  
  // Save current canvas state to history
  const saveToHistory = (canvas: fabricjs.Canvas) => {
    if (!canvas) return;
    
    const json = JSON.stringify(canvas.toJSON());
    
    // If we're not at the end of the history, truncate it
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
    
    setState(prev => ({
      ...prev,
      canUndo: historyIndexRef.current > 0,
      canRedo: historyIndexRef.current < historyRef.current.length - 1,
    }));
  };
  
  // Set drawing mode
  const setMode = (mode: SketchPadMode) => {
    if (!canvas) return;
    
    // Update state first
    setState(prev => ({ ...prev, mode }));
    
    // Then apply the changes based on the new mode
    switch (mode) {
      case 'draw':
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = state.color;
          canvas.freeDrawingBrush.width = state.brushSize;
        }
        break;
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        break;
      case 'erase':
        canvas.isDrawingMode = true;
        if (canvas.freeDrawingBrush) {
          canvas.freeDrawingBrush.color = 'rgba(30, 30, 30, 0.9)'; // Match background
          canvas.freeDrawingBrush.width = state.brushSize * 2;
        }
        break;
    }
    
    // Force a render to ensure changes are visible
    canvas.renderAll();
  };
  
  // Set brush color
  const setColor = (color: SketchPadColor) => {
    if (!canvas || !canvas.freeDrawingBrush) return;
    
    // Update state with the new color
    setState(prev => ({ ...prev, color }));
    
    // Apply the color if we're in draw mode
    const currentMode = state.mode;
    if (currentMode === 'draw') {
      canvas.freeDrawingBrush.color = color;
      canvas.renderAll();
    }
  };
  
  // Set brush size
  const setBrushSize = (size: number) => {
    if (!canvas || !canvas.freeDrawingBrush) return;
    
    setState(prev => ({ ...prev, brushSize: size }));
    
    // Get current mode from state to determine brush width
    const currentMode = state.mode;
    const brushWidth = currentMode === 'erase' ? size * 2 : size;
    
    canvas.freeDrawingBrush.width = brushWidth;
    canvas.renderAll();
  };
  
  // Clear canvas
  const clearCanvas = () => {
    if (!canvas) return;
    
    canvas.clear();
    canvas.backgroundColor = 'rgba(30, 30, 30, 0.9)';
    saveToHistory(canvas);
  };
  
  // Undo
  const undo = () => {
    if (!canvas || !state.canUndo) return;
    
    historyIndexRef.current--;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      setState(prev => ({
        ...prev,
        canUndo: historyIndexRef.current > 0,
        canRedo: true,
      }));
    });
  };
  
  // Redo
  const redo = () => {
    if (!canvas || !state.canRedo) return;
    
    historyIndexRef.current++;
    const json = historyRef.current[historyIndexRef.current];
    canvas.loadFromJSON(json, () => {
      canvas.renderAll();
      setState(prev => ({
        ...prev,
        canUndo: true,
        canRedo: historyIndexRef.current < historyRef.current.length - 1,
      }));
    });
  };
  
  // Export canvas as SVG
  const exportAsSVG = (): string => {
    if (!canvas) return '';
    
    const svg = canvas.toSVG();
    return svg;
  };
  
  // Export canvas as data URL
  const exportAsDataURL = (): string => {
    if (!canvas) return '';
    
    return canvas.toDataURL({
      format: 'png',
      quality: 0.8,
      multiplier: 1.0
    });
  };
  
  // Add object change handler to save history
  useEffect(() => {
    if (!canvas) return;
    
    const handleObjectModified = () => {
      saveToHistory(canvas);
    };
    
    canvas.on('object:modified', handleObjectModified);
    canvas.on('path:created', handleObjectModified);
    
    return () => {
      canvas.off('object:modified', handleObjectModified);
      canvas.off('path:created', handleObjectModified);
    };
  }, [canvas]);
  
  return {
    state,
    initCanvas,
    setMode,
    setColor,
    setBrushSize,
    clearCanvas,
    undo,
    redo,
    exportAsSVG,
    exportAsDataURL,
  };
}
