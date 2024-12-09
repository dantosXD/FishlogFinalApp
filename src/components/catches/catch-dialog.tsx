import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CatchForm } from './catch-form';
import type { Catch, FishingGroup } from '@/lib/pocketbase/types';
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface CatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Catch;
  groups: FishingGroup[];
  onSubmit: (data: FormData) => Promise<void>;
}

export function CatchDialog({
  open,
  onOpenChange,
  initialData,
  groups,
  onSubmit,
}: CatchDialogProps) {
  const { toast } = useToast();

  const handleSubmit = useCallback(async (data: FormData) => {
    try {
      // Log the form data being passed to onSubmit
      console.log('CatchDialog - Submitting form data:', {
        species: data.get('species'),
        weight: data.get('weight'),
        weight_oz: data.get('weight_oz'),
        length: data.get('length'),
        location: data.get('location'),
        date: data.get('date'),
        photos: data.getAll('photos').length,
        sharedWithGroups: data.get('sharedWithGroups'),
      });

      // Validate required fields
      const requiredFields = ['species', 'weight', 'length', 'location', 'date'];
      for (const field of requiredFields) {
        if (!data.get(field)) {
          throw new Error(`${field} is required`);
        }
      }

      // Validate photos
      const photos = data.getAll('photos');
      if (photos.length === 0) {
        throw new Error('At least one photo is required');
      }

      await onSubmit(data);
      onOpenChange(false);
    } catch (error) {
      console.error('Error in CatchDialog submission:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save catch. Please try again.',
      });
    }
  }, [onSubmit, onOpenChange, toast]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit' : 'Add'} Catch</DialogTitle>
        </DialogHeader>
        <CatchForm
          initialData={initialData}
          groups={groups}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}