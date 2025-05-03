import React, { useState, useEffect } from 'react';
import { InspirationNode } from '@shared/schema';
import MoodBadge from '@/components/ui/MoodBadge';
import { Link } from 'lucide-react';

interface LinkCardProps {
  node: InspirationNode;
}

const LinkCard: React.FC<LinkCardProps> = ({ node }) => {
  const [domain, setDomain] = useState<string>('');
  
  useEffect(() => {
    // Extract domain from URL if available
    if (node.contentUrl) {
      try {
        // Try to parse the URL, check if it has protocol
        let urlString = node.contentUrl;
        if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
          urlString = 'https://' + urlString;
        }
        
        const url = new URL(urlString);
        setDomain(url.hostname.replace('www.', ''));
      } catch (error) {
        console.error("Invalid URL:", error);
        // Fallback - just display the raw contentUrl
        setDomain(node.contentUrl);
      }
    }
  }, [node.contentUrl]);
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-medium">{node.title}</h3>
        <MoodBadge mood={node.mood} />
      </div>
      
      <div className="mt-3 p-3 bg-secondary rounded-lg">
        <div className="flex items-start">
          <div className={`w-10 h-10 flex items-center justify-center rounded bg-[hsl(var(--${node.mood}))]/20`}>
            <Link className={`text-[hsl(var(--${node.mood}))] text-lg`} />
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium">{node.description || 'Website Link'}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{domain || 'external link'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkCard;
