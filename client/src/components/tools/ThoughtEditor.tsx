import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import MoodSelector from '@/components/ui/MoodSelector';
import IntensitySlider from '@/components/ui/IntensitySlider';
import { MoodType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ThoughtEditorProps {
  isOpen: boolean;
  onClose: () => void;
  moodBoardId: number;
  onThoughtCreated?: (nodeId: number) => void;
  defaultPosition?: { x: number; y: number };
  defaultMood?: MoodType;
  defaultIntensity?: number;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  text: z.string().min(1, "Thought text is required"),
  source: z.string().optional(),
  date: z.string().optional(),
  mood: z.string(),
  intensity: z.number().min(0).max(100),
});

const ThoughtEditor: React.FC<ThoughtEditorProps> = ({
  isOpen,
  onClose,
  moodBoardId,
  onThoughtCreated,
  defaultPosition = { x: 100, y: 100 },
  defaultMood = 'focused',
  defaultIntensity = 70,
}) => {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      text: '',
      source: '',
      date: '',
      mood: defaultMood,
      intensity: defaultIntensity,
    },
  });
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Store additional metadata as JSON in content field
      const contentData = {
        source: values.source,
        date: values.date,
      };
      
      const response = await apiRequest("POST", "/api/nodes", {
        moodBoardId,
        type: "thought",
        title: values.title,
        description: values.text,
        content: JSON.stringify(contentData),
        positionX: defaultPosition.x,
        positionY: defaultPosition.y,
        mood: values.mood,
        intensity: values.intensity,
        tags: [], // Add tags support later
      });
      
      toast({
        title: "Success!",
        description: "Thought has been added to your mood board",
      });
      
      // Call the callback if provided
      if (onThoughtCreated) {
        onThoughtCreated(response.id);
      }
      
      onClose();
    } catch (error) {
      console.error("Error creating thought:", error);
      toast({
        title: "Error",
        description: "Failed to save thought. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Thought</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Core Insight" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thought</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="The app should feel like a natural extension of the user's mental state..." 
                      className="min-h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="User interviews" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="06/12" {...field} />
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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Thought</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ThoughtEditor;
