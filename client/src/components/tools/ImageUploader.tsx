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
import { Upload, Image } from 'lucide-react';

interface ImageUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  moodBoardId: number;
  onImageCreated?: (nodeId: number) => void;
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

const ImageUploader: React.FC<ImageUploaderProps> = ({
  isOpen,
  onClose,
  moodBoardId,
  onImageCreated,
  defaultPosition = { x: 100, y: 100 },
  defaultMood = 'calm',
  defaultIntensity = 50,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      mood: defaultMood,
      intensity: defaultIntensity,
    },
  });
  
  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setImageFile(file);
    setPreviewUrl(url);
  };
  
  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!imageFile) {
      toast({
        title: "No image selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Upload image first
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const uploadData = await uploadResponse.json();
      
      // Create node with the image URL
      const response = await apiRequest("POST", "/api/nodes", {
        moodBoardId,
        type: "image",
        title: values.title,
        description: values.description || "",
        contentUrl: uploadData.imageUrl,
        positionX: defaultPosition.x,
        positionY: defaultPosition.y,
        mood: values.mood,
        intensity: values.intensity,
        tags: [], // Add tags support later
      });
      
      toast({
        title: "Success!",
        description: "Image has been added to your mood board",
      });
      
      // Call the callback if provided
      if (onImageCreated) {
        onImageCreated(response.id);
      }
      
      // Clean up preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      onClose();
    } catch (error) {
      console.error("Error creating image node:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Clean up preview URL when component unmounts or dialog closes
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Image</DialogTitle>
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
                    <Input placeholder="Mountain Tranquility" {...field} />
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
                    <Input placeholder="Visual inspiration for main landing screen" {...field} />
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
            
            <div className="border rounded-md p-4">
              {previewUrl ? (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setPreviewUrl(null);
                      setImageFile(null);
                    }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 bg-secondary/50 rounded-md">
                  <Image className="h-10 w-10 text-muted-foreground mb-2" />
                  <label className="cursor-pointer">
                    <span className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium flex items-center">
                      <Upload className="h-4 w-4 mr-1" />
                      Select Image
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    JPG, PNG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={!imageFile || isUploading}>
                {isUploading ? 'Uploading...' : 'Save Image'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploader;
