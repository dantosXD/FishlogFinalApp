import { useState, useEffect, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { commentsApi } from '@/lib/api';
import type { Comment, User } from '@/lib/pocketbase/types';
import { useToast } from '@/hooks/use-toast';
import { pb } from '@/lib/pocketbase';
import { Loader2 } from 'lucide-react';

interface CatchCommentsProps {
  catchId: string;
  currentUser: User;
}

export function CatchComments({
  catchId,
  currentUser,
}: CatchCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const loadComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await commentsApi.list(`catch = "${catchId}"`, '-created', 'user');
      if (result.items) {
        setComments(result.items);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load comments. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [catchId, toast]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('content', newComment.trim());
      formData.append('catch', catchId);
      formData.append('user', currentUser.id);

      const comment = await commentsApi.create(formData);
      
      // Reload comments to get the complete comment with user expansion
      await loadComments();
      
      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment added successfully.',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Comments</h4>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-4 w-full bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Comments</h4>
      <div className="space-y-4">
        {comments.map((comment) => {
          const user = comment.expand?.user;
          if (!user) return null;
          
          return (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                {user.avatar ? (
                  <AvatarImage
                    src={pb.files.getUrl(user, user.avatar)}
                    alt={user.name}
                  />
                ) : (
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created), 'PP')}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {comment.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px]"
          disabled={isSubmitting}
        />
        <Button 
          type="submit" 
          className="self-end"
          disabled={!newComment.trim() || isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Post Comment
        </Button>
      </form>
    </div>
  );
}