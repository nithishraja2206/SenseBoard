import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
}

const SimpleImageUploader: React.FC<SimpleImageUploaderProps> = ({
  onImageUploaded
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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
    
    setImageFile(file);
    handleUpload(file);
  };
  
  // Handle upload
  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true);
      
      // Upload image
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const uploadData = await uploadResponse.json();
      
      // Call callback with the image URL
      onImageUploaded(uploadData.imageUrl);
      
      toast({
        title: "Success!",
        description: "Image has been uploaded",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Create a reference to the file input element
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Function to trigger file input click
  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        type="button" 
        disabled={isUploading}
        onClick={handleButtonClick}
      >
        <Upload className="h-4 w-4 mr-2" />
        {isUploading ? 'Uploading...' : 'Upload New Image'}
      </Button>
      <input 
        ref={fileInputRef}
        type="file" 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange}
      />
    </div>
  );
};

export default SimpleImageUploader;