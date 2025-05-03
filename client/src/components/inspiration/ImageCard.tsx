import React, { useState, useEffect } from 'react';
import { InspirationNode } from '@shared/schema';
import MoodBadge from '@/components/ui/MoodBadge';

interface ImageCardProps {
  node: InspirationNode;
}

const ImageCard: React.FC<ImageCardProps> = ({ node }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  
  // Parse content for backward compatibility
  useEffect(() => {
    try {
      // Try to get image URL from contentUrl first (new format)
      if (node.contentUrl) {
        // Handle different URL formats
        if (node.contentUrl.startsWith('http')) {
          setImageUrl(node.contentUrl);
        } else {
          // For relative paths like /uploads/..., make sure they're proper
          setImageUrl(`${window.location.origin}${node.contentUrl}`);
        }
      } 
      // Fallback to checking content (old format)
      else if (node.content) {
        const contentObj = JSON.parse(node.content);
        if (contentObj && contentObj.imageUrl) {
          setImageUrl(contentObj.imageUrl);
        }
      }
    } catch (error) {
      console.error("Error parsing image URL:", error);
    }
  }, [node]);

  return (
    <div>
      <div className="relative">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={node.title} 
            className="w-full h-40 object-cover"
            onError={(e) => {
              console.error("Failed to load image:", imageUrl);
              // Fallback to a gradient if image fails to load
              const target = e.target as HTMLImageElement;
              target.style.height = '140px';
              target.style.background = 'linear-gradient(135deg, rgba(123, 104, 238, 0.4), rgba(65, 105, 225, 0.6))';
              target.style.display = 'flex';
              target.style.alignItems = 'center';
              target.style.justifyContent = 'center';
              target.alt = 'Image could not be loaded';
            }}
          />
        ) : (
          <div 
            className="w-full h-40 flex items-center justify-center bg-gradient-to-br from-purple-400/30 to-blue-500/40"
          >
            Image could not be loaded
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
