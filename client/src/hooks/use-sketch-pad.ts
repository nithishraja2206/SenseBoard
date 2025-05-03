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
    if (canvas) return;
    
    canvasRef.current = canvasElement;
    containerRef.current = container;
    
    const fabricCanvas = new Canvas(canvasElement, {
      isDrawingMode: true,
      width: container.offsetWidth,
      height: container.offsetHeight,
      backgroundColor: 'rgba(30, 30, 30, 0.9)',
    });
    
    // Setup brush
    fabricCanvas.freeDrawingBrush = new PencilBrush(fabricCanvas);
    fabricCanvas.freeDrawingBrush.color = state.color;
    fabricCanvas.freeDrawingBrush.width = state.brushSize;
    
    // Save initial state to history
    saveToHistory(fabricCanvas);
    
    // Handle window resize
    const resizeCanvas = () => {
      if (containerRef.current && fabricCanvas) {
        fabricCanvas.setWidth(containerRef.current.offsetWidth);
        fabricCanvas.setHeight(containerRef.current.offsetHeight);
        fabricCanvas.renderAll();
      }
    };
    
    window.addEventListener('resize', resizeCanvas);
    
    // Set state and return cleanup
    setCanvas(fabricCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      fabricCanvas.dispose();
      setCanvas(null);
    };
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
    
    setState(prev => ({ ...prev, mode }));
    
    switch (mode) {
      case 'draw':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = state.color;
        canvas.freeDrawingBrush.width = state.brushSize;
        break;
      case 'select':
        canvas.isDrawingMode = false;
        break;
      case 'erase':
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = 'rgba(30, 30, 30, 0.9)'; // Match background
        canvas.freeDrawingBrush.width = state.brushSize * 2;
        break;
    }
  };
  
  // Set brush color
  const setColor = (color: SketchPadColor) => {
    if (!canvas) return;
    
    setState(prev => ({ ...prev, color }));
    
    if (state.mode === 'draw') {
      canvas.freeDrawingBrush.color = color;
    }
  };
  
  // Set brush size
  const setBrushSize = (size: number) => {
    if (!canvas) return;
    
    setState(prev => ({ ...prev, brushSize: size }));
    
    const brushWidth = state.mode === 'erase' ? size * 2 : size;
    canvas.freeDrawingBrush.width = brushWidth;
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
