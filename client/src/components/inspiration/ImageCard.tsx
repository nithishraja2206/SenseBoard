import React from 'react';
import { InspirationNode } from '@shared/schema';
import MoodBadge from '@/components/ui/MoodBadge';

interface ImageCardProps {
  node: InspirationNode;
}

const ImageCard: React.FC<ImageCardProps> = ({ node }) => {
  // Get the image URL from the node
  const imageUrl = node.contentUrl || 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=320&h=180';

  return (
    <div>
      <div className="relative">
        <img 
          src={imageUrl} 
          alt={node.title} 
          className="w-full h-40 object-cover"
          onError={(e) => {
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
