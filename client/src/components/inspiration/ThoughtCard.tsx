import React from 'react';
import { InspirationNode } from '@shared/schema';
import MoodBadge from '@/components/ui/MoodBadge';

interface ThoughtCardProps {
  node: InspirationNode;
}

const ThoughtCard: React.FC<ThoughtCardProps> = ({ node }) => {
  // Parse additional data from content if available
  let source = '';
  let date = '';
  
  try {
    if (node.content) {
      const contentData = JSON.parse(node.content);
      source = contentData.source || '';
      date = contentData.date || '';
    }
  } catch (error) {
    // If content is not valid JSON, use it as is
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-medium">{node.title}</h3>
        <MoodBadge mood={node.mood} />
      </div>
      
      <div className="mt-3 p-3 bg-secondary rounded-lg">
        <p className="text-sm italic">
          "{node.description || 'The app should feel like a natural extension of the user\'s mental state - responding to their needs before they even realize what they need.'}"
        </p>
        {(source || date) && (
          <div className="mt-2 text-xs text-muted-foreground">
            {source && <span>From {source}</span>}
            {source && date && <span>, </span>}
            {date && <span>{date}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThoughtCard;
