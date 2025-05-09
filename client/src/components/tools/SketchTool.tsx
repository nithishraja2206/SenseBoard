import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Undo, Redo, Eraser, Pencil, MousePointer, Trash } from 'lucide-react';
import MoodSelector from '@/components/ui/MoodSelector';
import IntensitySlider from '@/components/ui/IntensitySlider';
import SimpleCanvas from '@/components/ui/simple-canvas';
import { MoodType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SketchToolProps {
  isOpen: boolean;
  onClose: () => void;
  moodBoardId: number;
  onSketchCreated?: (nodeId: number) => void;
  defaultPosition?: { x: number; y: number };
  defaultMood?: MoodType;
  defaultIntensity?: number;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  mood: z.string(),
  intensity: z.number().min(0).max(100),
});

const SketchTool: React.FC<SketchToolProps> = ({
  isOpen,
  onClose,
  moodBoardId,
  onSketchCreated,
  defaultPosition = { x: 100, y: 100 },
  defaultMood = 'calm',
  defaultIntensity = 50,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // State for canvas controls
  const [canvasState, setCanvasState] = useState({
    mode: 'draw' as 'draw' | 'erase' | 'select',
    color: '#4FC3F7',
    brushSize: 3
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      mood: defaultMood,
      intensity: defaultIntensity,
    },
  });
  
  // Handle color selection
  const handleColorChange = (color: string) => {
    setCanvasState(prev => ({ ...prev, color }));
  };
  
  // Keep track of the current SVG content
  const [currentSvgContent, setCurrentSvgContent] = useState<string>('');
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Check if we have SVG content
      if (!currentSvgContent) {
        toast({
          title: "Error",
          description: "Please draw something first",
          variant: "destructive",
        });
        return;
      }
      
      // Create node with the SVG content
      const response = await apiRequest("POST", "/api/nodes", {
        moodBoardId,
        type: "sketch",
        title: values.title,
        description: values.description || "",
        content: currentSvgContent,
        positionX: defaultPosition.x,
        positionY: defaultPosition.y,
        mood: values.mood,
        intensity: values.intensity,
        tags: [], // Add tags support later
      });
      
      toast({
        title: "Success!",
        description: "Sketch has been added to your mood board",
      });
      
      // Call the callback if provided
      if (onSketchCreated && response && 'id' in response) {
        onSketchCreated(response.id as number);
      }
      
      onClose();
    } catch (error) {
      console.error("Error creating sketch:", error);
      toast({
        title: "Error",
        description: "Failed to save sketch. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Sketch</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Flow Concept" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Initial navigation sketch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mood</FormLabel>
                    <FormControl>
                      <MoodSelector 
                        value={field.value as MoodType} 
                        onChange={(mood) => field.onChange(mood)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="intensity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intensity</FormLabel>
                    <FormControl>
                      <IntensitySlider 
                        value={field.value} 
                        onChange={(value) => field.onChange(value)} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="border rounded-md p-1">
              <div className="flex items-center justify-between mb-2 border-b pb-2">
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant={canvasState.mode === 'draw' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setCanvasState(prev => ({ ...prev, mode: 'draw' }))}
                    className="h-8 w-8"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={canvasState.mode === 'erase' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setCanvasState(prev => ({ ...prev, mode: 'erase' }))}
                    className="h-8 w-8"
                  >
                    <Eraser className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={canvasState.mode === 'select' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => setCanvasState(prev => ({ ...prev, mode: 'select' }))}
                    className="h-8 w-8"
                  >
                    <MousePointer className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Undo className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Redo className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between mb-2">
                <div className="flex space-x-1">
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-full ${canvasState.color === '#4FC3F7' ? 'ring-2 ring-primary' : ''}`}
                    style={{ backgroundColor: '#4FC3F7' }}
                    onClick={() => handleColorChange('#4FC3F7')}
                  />
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-full ${canvasState.color === '#FF9800' ? 'ring-2 ring-primary' : ''}`}
                    style={{ backgroundColor: '#FF9800' }}
                    onClick={() => handleColorChange('#FF9800')}
                  />
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-full ${canvasState.color === '#7E57C2' ? 'ring-2 ring-primary' : ''}`}
                    style={{ backgroundColor: '#7E57C2' }}
                    onClick={() => handleColorChange('#7E57C2')}
                  />
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-full ${canvasState.color === '#F06292' ? 'ring-2 ring-primary' : ''}`}
                    style={{ backgroundColor: '#F06292' }}
                    onClick={() => handleColorChange('#F06292')}
                  />
                  <button
                    type="button"
                    className={`w-6 h-6 rounded-full ${canvasState.color === '#66BB6A' ? 'ring-2 ring-primary' : ''}`}
                    style={{ backgroundColor: '#66BB6A' }}
                    onClick={() => handleColorChange('#66BB6A')}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-muted-foreground">Brush Size</div>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={canvasState.brushSize}
                    onChange={(e) => setCanvasState(prev => ({ ...prev, brushSize: parseInt(e.target.value) }))}
                    className="w-24"
                  />
                </div>
              </div>
              
              <div ref={containerRef} className="w-full h-64 relative overflow-hidden rounded-md border bg-[rgba(30,30,30,0.9)]">
                <SimpleCanvas 
                  width={containerRef.current?.offsetWidth || 600}
                  height={300}
                  color={canvasState.color}
                  brushSize={canvasState.brushSize}
                  mode={canvasState.mode === 'erase' ? 'erase' : 'draw'}
                  className="absolute inset-0 w-full h-full" 
                  onDrawEnd={(svgContent) => {
                    console.log("Drawing completed, SVG content available");
                    setCurrentSvgContent(svgContent);
                  }}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Sketch</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SketchTool;