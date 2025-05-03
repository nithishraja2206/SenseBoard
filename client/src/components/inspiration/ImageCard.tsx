import React from 'react';
import { InspirationNode } from '@shared/schema';
import MoodBadge from '@/components/ui/MoodBadge';

interface ImageCardProps {
  node: InspirationNode;
}

const ImageCard: React.FC<ImageCardProps> = ({ node }) => {
  // Get the image URL from the node and ensure it has the correct path
  const imageUrl = node.contentUrl || '';
  
  // Properly form the URL by prefixing with the base URL if it's a relative path
  const formattedImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `${window.location.origin}${imageUrl}`;

  return (
    <div>
      <div className="relative">
        <img 
          src={formattedImageUrl} 
          alt={node.title} 
          className="w-full h-40 object-cover"
          onError={(e) => {
            console.error("Failed to load image:", formattedImageUrl);
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
