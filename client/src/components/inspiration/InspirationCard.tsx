import React, { useState } from 'react';
import { InspirationNode, MoodType } from '@shared/schema';
import { InspirationNodePosition } from '@/types';
import SketchCard from './SketchCard';
import ImageCard from './ImageCard';
import AudioCard from './AudioCard';
import ThoughtCard from './ThoughtCard';
import LinkCard from './LinkCard';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Link, Edit, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MoodSelector from '@/components/ui/MoodSelector';
import IntensitySlider from '@/components/ui/IntensitySlider';
import SimpleImageUploader from '@/components/tools/SimpleImageUploader';

interface InspirationCardProps {
  node: InspirationNode;
  position: InspirationNodePosition;
  isDragging: boolean;
  onDragStart: (e: React.MouseEvent) => void;
  onNodeClick: () => void;
  onStartConnection: () => void;
  isConnectionMode: boolean;
  isConnectionSource: boolean;
}

const InspirationCard: React.FC<InspirationCardProps> = ({ 
  node, 
  position, 
  isDragging,
  onDragStart,
  onNodeClick,
  onStartConnection,
  isConnectionMode,
  isConnectionSource
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [description, setDescription] = useState(node.description || '');
  const [selectedMood, setSelectedMood] = useState<MoodType>(node.mood as MoodType);
  const [intensityValue, setIntensityValue] = useState(node.intensity);
  
  // Update node mutation
  const updateNodeMutation = useMutation({
    mutationFn: (updatedNode: Partial<InspirationNode>) => {
      return apiRequest('PATCH', `/api/nodes/${node.id}`, updatedNode);
    },
    onSuccess: (data) => {
      // Invalidate and immediately refetch the queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/moodboards', node.moodBoardId, 'nodes'] });
      queryClient.refetchQueries({ 
        queryKey: ['/api/moodboards', node.moodBoardId, 'nodes'],
        exact: false,
        type: 'active', // Only refetch active queries
      });
      
      // Force refresh all queries related to this moodboard
      setTimeout(() => {
        queryClient.resetQueries({ queryKey: ['/api/moodboards', node.moodBoardId, 'nodes'] });
      }, 100);
      
      // Update local state of the node
      if (data) {
        // Update form fields with new data
        setTitle(data.title);
        setDescription(data.description || '');
        setSelectedMood(data.mood as MoodType);
        setIntensityValue(data.intensity);
      }
      
      // Show success toast
      toast({
        title: 'Node Updated',
        description: 'Your inspiration node has been updated.',
      });
      
      // Close dialog
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update the node. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to update node:', error);
    }
  });
  
  // Delete node mutation
  const deleteNodeMutation = useMutation({
    mutationFn: () => {
      return apiRequest('DELETE', `/api/nodes/${node.id}`);
    },
    onSuccess: () => {
      // Invalidate and immediately refetch queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/moodboards', node.moodBoardId, 'nodes'] });
      queryClient.refetchQueries({ 
        queryKey: ['/api/moodboards', node.moodBoardId, 'nodes'],
        exact: false,
        type: 'active', // Only refetch active queries
      });
      
      // Force refresh all queries related to this moodboard
      setTimeout(() => {
        queryClient.resetQueries({ queryKey: ['/api/moodboards', node.moodBoardId, 'nodes'] });
      }, 100);
      
      // Show success toast
      toast({
        title: 'Node Deleted',
        description: 'Your inspiration node has been removed.',
      });
      
      // Close dialog
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete the node. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete node:', error);
    }
  });
  
  const handleEditSave = () => {
    updateNodeMutation.mutate({
      title,
      description,
      mood: selectedMood,
      intensity: intensityValue,
    });
  };
  
  const handleDelete = () => {
    deleteNodeMutation.mutate();
  };
  
  const cardStyles: React.CSSProperties = {
    position: 'absolute',
    left: `${position.position.x}px`,
    top: `${position.position.y}px`,
    width: `${position.size.width}px`,
    zIndex: position.zIndex,
    cursor: isDragging ? 'grabbing' : 'grab',
  };
  
  const getCardComponent = () => {
    switch (node.type) {
      case 'sketch':
        return <SketchCard node={node} />;
      case 'image':
        return <ImageCard node={node} />;
      case 'audio':
        return <AudioCard node={node} />;
      case 'thought':
        return <ThoughtCard node={node} />;
      case 'link':
        return <LinkCard node={node} />;
      default:
        return null;
    }
  };
  
  const handleClickCard = (e: React.MouseEvent) => {
    // Only handle click if we're in connection mode
    if (isConnectionMode && !isConnectionSource) {
      e.stopPropagation();
      onNodeClick();
    }
  };

  return (
    <>
      <div 
        className={`mood-card card-glow ${isConnectionMode ? 'pointer-events-auto' : ''} ${isConnectionSource ? 'ring-2 ring-primary' : ''}`}
        style={cardStyles}
        onMouseDown={(e) => {
          if (!isConnectionMode) onDragStart(e);
        }}
        onClick={handleClickCard}
      >
        {getCardComponent()}
        
        <div className="flex items-center mt-3 px-4 pb-4">
          <span className="text-xs text-muted-foreground">Intensity</span>
          <div className="ml-2 w-24 h-1 bg-secondary rounded-full">
            <div 
              className="h-full rounded-full" 
              style={{ 
                width: `${node.intensity}%`,
                backgroundColor: 
                  node.mood === 'calm' ? 'hsl(var(--calm))' : 
                  node.mood === 'energetic' ? 'hsl(var(--energetic))' : 
                  'hsl(var(--focused))'
              }}
            ></div>
          </div>
          <div className="ml-auto flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onStartConnection();
              }}
            >
              <Link className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setIsEditDialogOpen(true);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleteDialogOpen(true);
                  }}>
                    <Trash className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Edit {node.type.charAt(0).toUpperCase() + node.type.slice(1)}</DialogTitle>
            <DialogDescription>
              Update the details of this inspiration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Give your inspiration a title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={description || ''} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe this inspiration"
                rows={3}
              />
            </div>
            
            {/* Image upload option for image nodes */}
            {node.type === 'image' && (
              <div className="space-y-2">
                <Label>Update Image</Label>
                <div className="flex flex-col gap-2">
                  <SimpleImageUploader 
                    onImageUploaded={(imageUrl: string) => {
                      // Update form state with the new URL
                      updateNodeMutation.mutate({
                        title,
                        description,
                        mood: selectedMood,
                        intensity: intensityValue,
                        contentUrl: imageUrl,
                      });
                      toast({
                        title: 'Image Updated',
                        description: 'The image has been updated successfully.',
                      });
                      // Close the dialog after successful update
                      setTimeout(() => {
                        setIsEditDialogOpen(false);
                      }, 1000);
                    }}
                  />
                  {node.contentUrl && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Current image: {node.contentUrl.split('/').pop() || node.contentUrl}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Mood</Label>
              <MoodSelector 
                selectedMood={selectedMood} 
                onChange={setSelectedMood} 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Intensity</Label>
              <IntensitySlider
                value={intensityValue}
                onChange={setIntensityValue}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={updateNodeMutation.isPending}>
              {updateNodeMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">Delete Inspiration</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this inspiration? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteNodeMutation.isPending}>
              {deleteNodeMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InspirationCard;
