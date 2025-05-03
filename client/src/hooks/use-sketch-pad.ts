import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

// TypeScript namespace for fabric.js
declare namespace fabric {
  interface IObjectOptions {
    selectable?: boolean;
    hasControls?: boolean;
    hasBorders?: boolean;
    lockMovementX?: boolean;
    lockMovementY?: boolean;
    hoverCursor?: string;
    [key: string]: any;
  }
  
  interface ICanvasOptions {
    isDrawingMode?: boolean;
    selection?: boolean;
    width?: number;
    height?: number;
    backgroundColor?: string;
    renderOnAddRemove?: boolean;
    skipTargetFind?: boolean;
    fireRightClick?: boolean;
    fireMiddleClick?: boolean;
    stopContextMenu?: boolean;
    [key: string]: any;
  }
  
  interface FreeDrawingBrush {
    color: string;
    width: number;
    shadow?: any;
    strokeLineCap?: string;
    strokeLineJoin?: string;
  }
  
  interface Canvas {
    isDrawingMode: boolean;
    selection: boolean;
    backgroundColor: string;
    freeDrawingBrush: FreeDrawingBrush;
    setWidth(width: number): void;
    setHeight(height: number): void;
    clear(): void;
    renderAll(): void;
    dispose(): void;
    toJSON(propertiesToInclude?: string[]): any;
    loadFromJSON(json: any, callback?: Function): void;
    toSVG(options?: any): string;
    toDataURL(options?: any): string;
    on(event: string, handler: Function): void;
    off(event: string, handler: Function): void;
  }
  
  interface PencilBrush extends FreeDrawingBrush {}
  
  class PencilBrush {
    constructor(canvas: Canvas);
  }
  
  class Canvas {
    constructor(element: HTMLCanvasElement, options?: ICanvasOptions);
  }
}

type SketchPadMode = 'draw' | 'select' | 'erase';
type SketchPadColor = string;

interface SketchPadState {
  mode: SketchPadMode;
  color: SketchPadColor;
  brushSize: number;
  canUndo: boolean;
  canRedo: boolean;
}

// Global reference to the fabric module
declare const fabric: any;

export function useSketchPad() {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
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
    console.log("Initializing canvas...");
    
    if (canvas) {
      console.log("Disposing existing canvas");
      canvas.dispose();
    }
    
    canvasRef.current = canvasElement;
    containerRef.current = container;
    
    // Set canvas dimensions explicitly
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    console.log(`Setting canvas dimensions: ${width}x${height}`);
    
    canvasElement.width = width;
    canvasElement.height = height;
    
    try {
      // Make sure fabric is loaded
      if (typeof fabric === 'undefined') {
        console.error("Fabric.js is not loaded");
        throw new Error("Fabric.js is not loaded");
      }
      
      console.log("Creating FabricJS canvas instance");
      // Create a new fabric.js canvas instance with fixed parameters
      const fabricCanvas = new fabric.Canvas(canvasElement, {
        isDrawingMode: true,
        width: width,
        height: height,
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        renderOnAddRemove: true,
        selection: false,
        fireRightClick: false,
        fireMiddleClick: false,
        stopContextMenu: true,
      });
      
      // Setup brush
      console.log("Setting up brush");
      if (!fabricCanvas.freeDrawingBrush) {
        console.log("Creating new PencilBrush");
        fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
      }
      
      fabricCanvas.freeDrawingBrush.color = state.color;
      fabricCanvas.freeDrawingBrush.width = state.brushSize;
      
      // Save initial state to history
      saveToHistory(fabricCanvas);
      
      // Handle mouse events
      console.log("Setting up mouse events");
      fabricCanvas.on('mouse:down', function(options: any) {
        console.log('Mouse down event fired');
      });
      
      fabricCanvas.on('mouse:move', function(options: any) {
        // Only log occasionally to avoid console spam
        if (Math.random() < 0.01) { 
          console.log('Mouse move event fired');
        }
      });
      
      fabricCanvas.on('path:created', function(options: any) {
        console.log('Path created event fired');
      });
      
      // Handle window resize
      const resizeCanvas = () => {
        if (containerRef.current && fabricCanvas) {
          const width = containerRef.current.offsetWidth;
          const height = containerRef.current.offsetHeight;
          
          console.log(`Resizing canvas to: ${width}x${height}`);
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
      console.log("Canvas initialization complete");
      setCanvas(fabricCanvas);
      
      // Return cleanup function
      return () => {
        console.log("Running canvas cleanup");
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
  const saveToHistory = (canvas: fabric.Canvas) => {
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
