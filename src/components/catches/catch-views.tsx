import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageDialog } from '@/components/ui/image-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Scale, Ruler, MapPin, Calendar, MessageCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { Catch, Location, User, FishingGroup } from '@/lib/pocketbase/types';
import { pb } from '@/lib/pocketbase';

interface CatchViewProps {
  catches: Catch[];
  onEdit: (catch_: Catch) => void;
  currentUser: User;
  groups: FishingGroup[];
  onViewDetails?: (catch_: Catch, defaultTab?: 'details' | 'photos' | 'comments') => void;
}

interface CatchActionsProps {
  catch_: Catch;
  currentUser: User;
  onEdit: (catch_: Catch) => void;
  onViewDetails?: (catch_: Catch, defaultTab?: 'details' | 'photos' | 'comments') => void;
  groups: FishingGroup[];
}

function CatchActions({ catch_, currentUser, onEdit, onViewDetails }: CatchActionsProps) {
  if (!catch_ || !currentUser) {
    return null;
  }

  return (
    <div className="flex gap-1">
      {onViewDetails && (
        <>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onViewDetails(catch_)}
            title="View details"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onViewDetails(catch_, 'comments')}
            title="View comments"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </>
      )}
      {catch_.user && catch_.user === currentUser.id && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onEdit(catch_)}
          title="Edit catch"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function getLocationDisplay(location: Location | string): string {
  try {
    if (typeof location === 'string') {
      return location;
    }
    return location.name || 'Unknown location';
  } catch (error) {
    console.error('Error getting location display:', error);
    return 'Unknown location';
  }
}

function getFeatureImage(catch_: Catch): string {
  try {
    if (!catch_ || !catch_.photos || catch_.photos.length === 0) {
      return '';
    }
    const featurePhoto = catch_.photos[catch_.featurePhotoIndex ?? 0] || catch_.photos[0];
    return pb.files.getUrl(catch_, featurePhoto);
  } catch (error) {
    console.error('Error getting feature image:', error);
    return '';
  }
}

export function TableView({ catches, onEdit, currentUser, groups, onViewDetails }: CatchViewProps) {
  if (!catches || !currentUser) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Photo</TableHead>
            <TableHead>Species</TableHead>
            <TableHead>Weight</TableHead>
            <TableHead>Length</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {catches.map((catch_) => (
            <TableRow key={catch_.id}>
              <TableCell>
                <ImageDialog
                  image={getFeatureImage(catch_)}
                  alt={`${catch_.species} catch`}
                  trigger={
                    <div className="relative w-16 h-16 rounded-md overflow-hidden">
                      <img
                        src={getFeatureImage(catch_)}
                        alt={`${catch_.species} catch`}
                        className="w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    </div>
                  }
                />
              </TableCell>
              <TableCell className="font-medium">{catch_.species}</TableCell>
              <TableCell>
                {catch_.weight} lbs
                {catch_.weight_oz ? ` ${catch_.weight_oz} oz` : ''}
              </TableCell>
              <TableCell>{catch_.length}"</TableCell>
              <TableCell>{getLocationDisplay(catch_.location)}</TableCell>
              <TableCell>{format(new Date(catch_.date), 'PP')}</TableCell>
              <TableCell>
                <CatchActions
                  catch_={catch_}
                  currentUser={currentUser}
                  onEdit={onEdit}
                  onViewDetails={onViewDetails}
                  groups={groups}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function GridView({ catches, onEdit, currentUser, groups, onViewDetails }: CatchViewProps) {
  if (!catches || !currentUser) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {catches.map((catch_) => (
        <Card key={catch_.id}>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={getFeatureImage(catch_)}
                alt={`${catch_.species} catch`}
                className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              />
              <div className="absolute top-2 right-2">
                <CatchActions
                  catch_={catch_}
                  currentUser={currentUser}
                  onEdit={onEdit}
                  onViewDetails={onViewDetails}
                  groups={groups}
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{catch_.species}</h3>
                <time className="text-sm text-muted-foreground">
                  {format(new Date(catch_.date), 'PP')}
                </time>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Scale className="h-4 w-4" />
                  <span>
                    {catch_.weight} lbs
                    {catch_.weight_oz ? ` ${catch_.weight_oz} oz` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Ruler className="h-4 w-4" />
                  <span>{catch_.length}"</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <MapPin className="h-4 w-4" />
                  <span>{getLocationDisplay(catch_.location)}</span>
                </div>
              </div>
              {catch_.notes && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {catch_.notes}
                </p>
              )}
              {catch_.sharedWithGroups && catch_.sharedWithGroups.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Shared with {catch_.sharedWithGroups.length} group
                  {catch_.sharedWithGroups.length === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TimelineView({ catches, onEdit, currentUser, groups, onViewDetails }: CatchViewProps) {
  if (!catches || !currentUser) {
    return null;
  }

  return (
    <div className="relative space-y-12 before:absolute before:inset-0 before:ml-6 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
      {catches.map((catch_) => (
        <div key={catch_.id} className="relative flex items-start gap-6">
          <div className="absolute left-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-background bg-muted shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary" />
            </div>
          </div>
          <Card className="ml-12 flex-1">
            <CardContent className="relative p-6">
              <div className="absolute top-6 right-6">
                <CatchActions
                  catch_={catch_}
                  currentUser={currentUser}
                  onEdit={onEdit}
                  onViewDetails={onViewDetails}
                  groups={groups}
                />
              </div>
              <div className="mb-4">
                <time className="text-sm font-medium text-muted-foreground">
                  {format(new Date(catch_.date), 'PPPP')}
                </time>
                <h3 className="mt-2 text-xl font-semibold">{catch_.species}</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                <div className="space-y-4">
                  <ImageDialog
                    image={getFeatureImage(catch_)}
                    alt={`${catch_.species} catch`}
                    trigger={
                      <img
                        src={getFeatureImage(catch_)}
                        alt={`${catch_.species} catch`}
                        className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    }
                  />
                  {catch_.photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {catch_.photos.map((photo, index) => (
                        <ImageDialog
                          key={index}
                          image={pb.files.getUrl(catch_, photo)}
                          alt={`${catch_.species} catch photo ${index + 1}`}
                          trigger={
                            <img
                              src={pb.files.getUrl(catch_, photo)}
                              alt={`${catch_.species} catch thumbnail ${index + 1}`}
                              className={cn(
                                "h-16 w-16 object-cover rounded cursor-pointer hover:opacity-90 transition-opacity",
                                index === catch_.featurePhotoIndex && "ring-2 ring-primary"
                              )}
                            />
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Scale className="h-4 w-4" />
                      <span className="text-foreground font-medium">
                        {catch_.weight} lbs
                        {catch_.weight_oz ? ` ${catch_.weight_oz} oz` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Ruler className="h-4 w-4" />
                      <span className="text-foreground font-medium">{catch_.length}"</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-foreground font-medium">
                        {getLocationDisplay(catch_.location)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-foreground font-medium">
                        {format(new Date(catch_.date), 'PP')}
                      </span>
                    </div>
                  </div>
                  {catch_.notes && (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground">{catch_.notes}</p>
                    </div>
                  )}
                  {catch_.sharedWithGroups && catch_.sharedWithGroups.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Shared with {catch_.sharedWithGroups.length} group
                        {catch_.sharedWithGroups.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}