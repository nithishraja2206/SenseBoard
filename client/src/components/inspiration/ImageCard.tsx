import React, { useState, useEffect } from 'react';
import { InspirationNode } from '@shared/schema';
import MoodBadge from '@/components/ui/MoodBadge';
import { Image as ImageIcon } from 'lucide-react';

interface ImageCardProps {
  node: InspirationNode;
}

const ImageCard: React.FC<ImageCardProps> = ({ node }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);
  
  // Parse content for backward compatibility and reset state when node changes
  useEffect(() => {
    // Reset states when node changes to ensure image refreshes
    setImageLoaded(false);
    setImageError(false);
    
    try {
      console.log("Node data:", node);
      
      // Try to get image URL from contentUrl first (new format)
      if (node.contentUrl) {
        console.log("Node has contentUrl:", node.contentUrl);
        
        // Handle different URL formats
        if (node.contentUrl.startsWith('http')) {
          setImageUrl(node.contentUrl);
          console.log("Using external URL:", node.contentUrl);
        } else {
          // For relative paths like /uploads/..., make sure they're proper
          // Add cache-busting timestamp to ensure the image is always refreshed
          const timestamp = new Date().getTime();
          const fullUrl = `${window.location.origin}${node.contentUrl}?t=${timestamp}`;
          setImageUrl(fullUrl);
          console.log("Using local URL with cache-busting:", fullUrl);
        }
      } 
      // Fallback to checking content (old format)
      else if (node.content) {
        try {
          const contentObj = JSON.parse(node.content);
          if (contentObj && contentObj.imageUrl) {
            // Add cache-busting timestamp
            const timestamp = new Date().getTime();
            const imageUrlWithTimestamp = `${contentObj.imageUrl}?t=${timestamp}`;
            setImageUrl(imageUrlWithTimestamp);
            console.log("Using imageUrl from content with cache-busting:", imageUrlWithTimestamp);
          }
        } catch (e) {
          console.error("Error parsing content JSON:", e);
        }
      }
    } catch (error) {
      console.error("Error processing image URL:", error);
      setImageError(true);
    }
  }, [node.contentUrl, node.content, node.title, node.description, node.mood]);

  // Test if the image URL works by preloading it
  useEffect(() => {
    if (!imageUrl) {
      setImageError(true);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      console.log("Image loaded successfully:", imageUrl);
      setImageLoaded(true);
      setImageError(false);
    };
    img.onerror = () => {
      console.error("Failed to load image:", imageUrl);
      setImageError(true);
      setImageLoaded(false);
    };
    img.src = imageUrl;
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  return (
    <div>
      <div className="relative">
        {!imageError && imageLoaded ? (
          <img 
            src={imageUrl} 
            alt={node.title} 
            className="w-full h-40 object-cover rounded-t-md"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-40 flex flex-col items-center justify-center bg-gradient-to-br from-purple-400/30 to-blue-500/40 rounded-t-md">
            <ImageIcon className="w-10 h-10 mb-2 text-white/60" />
            <span className="text-sm text-white/80">Image could not be loaded</span>
            <span className="text-xs text-white/60 mt-1">{imageUrl ? 'URL not accessible' : 'No image URL available'}</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <MoodBadge mood={node.mood} />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display font-medium">{node.title}</h3>
        {node.description && (
          <p className="text-sm text-muted-foreground mt-1">{node.description}</p>
        )}
      </div>
    </div>
  );
};

export default ImageCard;
