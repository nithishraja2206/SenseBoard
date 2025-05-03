import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import MoodSelector from '@/components/ui/MoodSelector';
import IntensitySlider from '@/components/ui/IntensitySlider';
import { MoodType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'lucide-react';

interface LinkEmbedderProps {
  isOpen: boolean;
  onClose: () => void;
  moodBoardId: number;
  onLinkCreated?: (nodeId: number) => void;
  defaultPosition?: { x: number; y: number };
  defaultMood?: MoodType;
  defaultIntensity?: number;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().url("Please enter a valid URL"),
  mood: z.string(),
  intensity: z.number().min(0).max(100),
});

const LinkEmbedder: React.FC<LinkEmbedderProps> = ({
  isOpen,
  onClose,
  moodBoardId,
  onLinkCreated,
  defaultPosition = { x: 100, y: 100 },
  defaultMood = 'calm',
  defaultIntensity = 60,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      url: '',
      mood: defaultMood,
      intensity: defaultIntensity,
    },
  });
  
  // Try to extract domain from URL to suggest title/description
  const handleUrlBlur = (url: string) => {
    if (!url || !form.getValues('url')) return;
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // If title is empty, suggest a title based on domain
      if (!form.getValues('title')) {
        form.setValue('title', `Link to ${domain}`);
      }
      
      // If description is empty, suggest the full URL
      if (!form.getValues('description')) {
        form.setValue('description', `Reference from ${domain}`);
      }
    } catch (error) {
      // Invalid URL, don't suggest anything
    }
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const response = await apiRequest("POST", "/api/nodes", {
        moodBoardId,
        type: "link",
        title: values.title,
        description: values.description || "",
        contentUrl: values.url,
        positionX: defaultPosition.x,
        positionY: defaultPosition.y,
        mood: values.mood,
        intensity: values.intensity,
        tags: [], // Add tags support later
      });
      
      toast({
        title: "Success!",
        description: "Link has been added to your mood board",
      });
      
      // Call the callback if provided
      if (onLinkCreated) {
        onLinkCreated(response.id);
      }
      
      onClose();
    } catch (error) {
      console.error("Error creating link:", error);
      toast({
        title: "Error",
        description: "Failed to save link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Link</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com" 
                      {...field} 
                      onBlur={() => handleUrlBlur(field.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Design Reference" {...field} />
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
                    <Input placeholder="Wellness UI Trends 2023" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
            
            <div className="flex items-center p-3 bg-secondary rounded-lg">
              <div className="w-10 h-10 flex items-center justify-center rounded bg-[hsl(var(--calm))]/20">
                <Link className="text-[hsl(var(--calm))] text-lg" />
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium">{form.watch('title') || 'Link Preview'}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {form.watch('url') ? new URL(form.watch('url')).hostname.replace('www.', '') : 'example.com'}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Link'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LinkEmbedder;
