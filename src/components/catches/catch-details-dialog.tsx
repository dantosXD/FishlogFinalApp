import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CatchForm } from './catch-form';
import { ImageDialog } from '@/components/ui/image-dialog';
import { CatchComments } from './catch-comment';
import { Scale, Ruler, MapPin, Calendar, Edit2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { pb } from '@/lib/pocketbase';
import type { Catch, FishingGroup, User } from '@/lib/pocketbase/types';

interface CatchDetailsDialogProps {
  catch_: Catch;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (data: FormData) => Promise<void>;
  groups: FishingGroup[];
  currentUser: User;
  defaultTab?: 'details' | 'photos' | 'comments';
}

export function CatchDetailsDialog({
  catch_,
  open,
  onOpenChange,
  onEdit,
  groups,
  currentUser,
  defaultTab = 'details',
}: CatchDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const user = catch_.expand?.user;

  const featureImage = catch_.photos[catch_.featurePhotoIndex ?? 0] || catch_.photos[0];

  const handleEdit = async (data: FormData) => {
    try {
      await onEdit(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error editing catch:', error);
    }
  };

  if (isEditing) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Catch</DialogTitle>
          </DialogHeader>
          <CatchForm
            initialData={catch_}
            groups={groups}
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
        <div className="relative">
          <ImageDialog
            image={pb.files.getUrl(catch_, featureImage)}
            alt={`${catch_.species} catch`}
            trigger={
              <img
                src={pb.files.getUrl(catch_, featureImage)}
                alt={`${catch_.species} catch`}
                className="w-full h-[300px] object-cover"
              />
            }
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/90 to-background/0">
            <div className="flex items-center gap-4">
              {user && (
                <Avatar>
                  {user.avatar ? (
                    <AvatarImage
                      src={pb.files.getUrl(user, user.avatar)}
                      alt={user.name}
                    />
                  ) : (
                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                  )}
                </Avatar>
              )}
              <div>
                <DialogTitle className="text-2xl text-white">{catch_.species}</DialogTitle>
                <p className="text-sm text-white/80">
                  by {user?.name || 'Unknown'} on{' '}
                  {format(new Date(catch_.date), 'PPP')}
                </p>
              </div>
            </div>
          </div>
          {catch_.user === currentUser.id && (
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit catch</span>
            </Button>
          )}
        </div>

        <div className="p-6">
          <Tabs defaultValue={defaultTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="photos">Photos</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4 pr-4">
              <TabsContent value="details" className="mt-0">
                <div className="grid gap-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Scale className="h-4 w-4" />
                      <span className="text-foreground font-medium">
                        {catch_.weight} lbs
                        {catch_.weight_oz && ` ${catch_.weight_oz} oz`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ruler className="h-4 w-4" />
                      <span className="text-foreground font-medium">
                        {catch_.length}"
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-foreground font-medium">
                        {typeof catch_.location === 'string'
                          ? catch_.location
                          : catch_.location?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-foreground font-medium">
                        {format(new Date(catch_.date), 'PPP')}
                      </span>
                    </div>
                  </div>

                  {catch_.notes && (
                    <div className="prose prose-sm max-w-none">
                      <h4 className="text-sm font-medium mb-2">Notes</h4>
                      <p className="text-muted-foreground">{catch_.notes}</p>
                    </div>
                  )}

                  {catch_.expand?.sharedWithGroups && catch_.expand.sharedWithGroups.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Shared with Groups</h4>
                      <div className="flex flex-wrap gap-2">
                        {catch_.expand.sharedWithGroups.map((group) => (
                          <Badge key={group.id} variant="secondary">
                            {group.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {catch_.weather && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Weather Conditions</h4>
                      <div className="text-sm text-muted-foreground">
                        {catch_.weather.temperature}°F, {catch_.weather.conditions}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="photos" className="mt-0">
                <div className="grid gap-4 sm:grid-cols-2">
                  {catch_.photos.map((photo, index) => (
                    <ImageDialog
                      key={index}
                      image={pb.files.getUrl(catch_, photo)}
                      alt={`${catch_.species} catch photo ${index + 1}`}
                      trigger={
                        <div className="relative aspect-square group cursor-pointer">
                          <img
                            src={pb.files.getUrl(catch_, photo)}
                            alt={`${catch_.species} catch photo ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg transition-opacity group-hover:opacity-90"
                          />
                          {index === catch_.featurePhotoIndex && (
                            <Badge
                              variant="secondary"
                              className="absolute top-2 left-2"
                            >
                              Featured
                            </Badge>
                          )}
                        </div>
                      }
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="mt-0">
                <CatchComments
                  catchId={catch_.id}
                  currentUser={currentUser}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}