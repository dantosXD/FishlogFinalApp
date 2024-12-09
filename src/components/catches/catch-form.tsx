import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Upload, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { Catch, FishingGroup } from '@/lib/pocketbase/types';
import { useToast } from '@/hooks/use-toast';
import { pb } from '@/lib/pocketbase';

// Updated to 25MB
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const formSchema = z.object({
  species: z.string().min(1, 'Species is required'),
  weight: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Weight must be a positive number',
  }),
  weight_oz: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) < 16, {
    message: 'Ounces must be between 0 and 15',
  }),
  length: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Length must be a positive number',
  }),
  location: z.string().min(1, 'Location is required'),
  date: z.date({
    required_error: 'Date is required',
  }),
  notes: z.string().optional(),
  sharedWithGroups: z.array(z.string()).default([]),
  photos: z.array(z.any()).min(1, 'At least one photo is required'),
  featurePhotoIndex: z.number(),
});

interface CatchFormProps {
  initialData?: Catch;
  groups: FishingGroup[];
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

export function CatchForm({ initialData, groups, onSubmit, onCancel }: CatchFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<string[]>(initialData?.photos || []);
  const [selectedFeaturePhoto, setSelectedFeaturePhoto] = useState<number>(
    initialData?.featurePhotoIndex || 0
  );
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      species: initialData?.species || '',
      weight: initialData?.weight?.toString() || '',
      weight_oz: initialData?.weight_oz?.toString() || '0',
      length: initialData?.length?.toString() || '',
      location: typeof initialData?.location === 'string' 
        ? initialData.location 
        : initialData?.location?.name || '',
      date: initialData ? new Date(initialData.date) : new Date(),
      notes: initialData?.notes || '',
      sharedWithGroups: initialData?.sharedWithGroups || [],
      photos: [],
      featurePhotoIndex: initialData?.featurePhotoIndex || 0,
    },
  });

  const validateFile = useCallback((file: File): boolean => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload only JPEG, PNG, or WebP images.',
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: `Maximum file size is 25MB.`,
      });
      return false;
    }

    return true;
  }, [toast]);

  const processFiles = useCallback(async (files: FileList) => {
    const validFiles = Array.from(files).filter(validateFile);
    if (validFiles.length > 0) {
      const updatedPhotos = [...uploadedPhotos, ...validFiles];
      setUploadedPhotos(updatedPhotos);
      form.setValue('photos', updatedPhotos, { shouldValidate: true });
      
      if (!form.getValues('featurePhotoIndex') && updatedPhotos.length > 0) {
        form.setValue('featurePhotoIndex', 0, { shouldValidate: true });
        setSelectedFeaturePhoto(0);
      }
    }
  }, [uploadedPhotos, form, validateFile]);

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processFiles(files);
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (!files) return;
    await processFiles(files);
  }, [processFiles]);

  const removePhoto = useCallback((index: number) => {
    const updatedPhotos = uploadedPhotos.filter((_, i) => i !== index);
    setUploadedPhotos(updatedPhotos);
    form.setValue('photos', updatedPhotos, { shouldValidate: true });
    
    if (selectedFeaturePhoto === index) {
      const newFeatureIndex = updatedPhotos.length > 0 ? 0 : -1;
      setSelectedFeaturePhoto(newFeatureIndex);
      form.setValue('featurePhotoIndex', newFeatureIndex, { shouldValidate: true });
    } else if (selectedFeaturePhoto > index) {
      const newIndex = selectedFeaturePhoto - 1;
      setSelectedFeaturePhoto(newIndex);
      form.setValue('featurePhotoIndex', newIndex, { shouldValidate: true });
    }
  }, [uploadedPhotos, selectedFeaturePhoto, form]);

  const renderExistingPhotos = () => {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
        {existingPhotos.map((photo, index) => (
          <div key={photo} className="relative group">
            <img
              src={pb.files.getUrl(initialData!, photo)}
              alt={`Catch photo ${index + 1}`}
              className={cn(
                "w-full aspect-square object-cover rounded-lg",
                selectedFeaturePhoto === index && "ring-2 ring-primary"
              )}
              onClick={() => setSelectedFeaturePhoto(index)}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  const updatedPhotos = existingPhotos.filter((_, i) => i !== index);
                  setExistingPhotos(updatedPhotos);
                  if (selectedFeaturePhoto === index) {
                    setSelectedFeaturePhoto(updatedPhotos.length > 0 ? 0 : -1);
                  } else if (selectedFeaturePhoto > index) {
                    setSelectedFeaturePhoto(selectedFeaturePhoto - 1);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Remove photo</span>
              </Button>
            </div>
            {selectedFeaturePhoto === index && (
              <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                Feature Photo
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);

      if (uploadedPhotos.length === 0 && existingPhotos.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Photos required',
          description: 'Please upload at least one photo of your catch.',
        });
        return;
      }

      const formData = new FormData();

      // Append basic fields
      formData.append('species', values.species);
      formData.append('weight', values.weight);
      formData.append('weight_oz', values.weight_oz);
      formData.append('length', values.length);
      formData.append('location', values.location);
      formData.append('date', values.date.toISOString());
      formData.append('featurePhotoIndex', selectedFeaturePhoto.toString());

      if (values.notes) {
        formData.append('notes', values.notes);
      }

      if (values.sharedWithGroups && values.sharedWithGroups.length > 0) {
        formData.append('sharedWithGroups', JSON.stringify(values.sharedWithGroups));
      }

      // Append existing photos
      existingPhotos.forEach((photo) => {
        formData.append('existingPhotos', photo);
      });

      // Append new photos
      uploadedPhotos.forEach((photo) => {
        formData.append('photos', photo);
      });

      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting catch:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save catch. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        species: initialData.species || '',
        weight: initialData.weight?.toString() || '',
        weight_oz: initialData.weight_oz?.toString() || '0',
        length: initialData.length?.toString() || '',
        location: typeof initialData.location === 'string' 
          ? initialData.location 
          : initialData.location?.name || '',
        date: new Date(initialData.date),
        notes: initialData.notes || '',
        sharedWithGroups: initialData.sharedWithGroups || [],
        photos: [],
        featurePhotoIndex: initialData.featurePhotoIndex || 0,
      });
      setSelectedFeaturePhoto(initialData.featurePhotoIndex || 0);
      setUploadedPhotos([]);
      setExistingPhotos(initialData.photos || []);
    }
  }, [initialData, form]);

  // Cleanup URLs when component unmounts or photos change
  useEffect(() => {
    const urls: string[] = [];
    uploadedPhotos.forEach(photo => {
      const url = URL.createObjectURL(photo);
      urls.push(url);
    });

    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [uploadedPhotos]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="photos"
              render={() => (
                <FormItem>
                  <FormLabel>Photos</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {existingPhotos.length > 0 && renderExistingPhotos()}
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-lg p-6 sm:p-8 transition-colors",
                          isDragging ? "border-primary bg-primary/5" : "border-muted",
                          "hover:border-primary hover:bg-primary/5"
                        )}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center justify-center gap-2 text-center">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div className="flex flex-col gap-1">
                            <label
                              htmlFor="photo-upload"
                              className="text-sm font-medium text-primary hover:underline cursor-pointer"
                            >
                              Click to upload
                            </label>
                            <p className="text-sm text-muted-foreground">
                              or drag and drop your photos here
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Max file size: 25MB. Supported formats: JPEG, PNG, WebP
                          </p>
                          <Input
                            id="photo-upload"
                            type="file"
                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </div>
                      </div>
                      {uploadedPhotos.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {uploadedPhotos.map((photo, index) => (
                            <div key={index} className="relative group aspect-square">
                              <img
                                src={URL.createObjectURL(photo)}
                                alt={`Catch photo ${index + 1}`}
                                className={cn(
                                  "w-full h-full object-cover rounded-lg transition-all",
                                  selectedFeaturePhoto === index && "ring-2 ring-primary",
                                  "group-hover:brightness-50"
                                )}
                              />
                              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="flex flex-col gap-2 p-2">
                                  <Button
                                    type="button"
                                    variant={selectedFeaturePhoto === index ? "secondary" : "outline"}
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => {
                                      setSelectedFeaturePhoto(index);
                                      form.setValue('featurePhotoIndex', index);
                                    }}
                                  >
                                    {selectedFeaturePhoto === index ? '★ Featured' : 'Set as Feature'}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="w-full text-xs"
                                    onClick={() => removePhoto(index)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload photos of your catch. Select one as the feature image.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Species</FormLabel>
                <FormControl>
                  <Input placeholder="Bass, Trout, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (lbs)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      min="0"
                      {...field} 
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value >= 0) {
                          field.onChange(e);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="weight_oz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ounces</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="15" 
                      step="1" 
                      {...field}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 0 && value < 16) {
                          field.onChange(e);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (inches)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    min="0"
                    {...field}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0) {
                        field.onChange(e);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input 
                    type="datetime-local" 
                    {...field}
                    value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''}
                    onChange={(e) => {
                      field.onChange(new Date(e.target.value));
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sharedWithGroups"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Share with Groups</FormLabel>
                <FormControl>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                    {groups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={field.value?.includes(group.id)}
                          onCheckedChange={(checked) => {
                            const newValue = checked
                              ? [...(field.value || []), group.id]
                              : field.value?.filter((id) => id !== group.id) || [];
                            field.onChange(newValue);
                          }}
                        />
                        <label
                          htmlFor={`group-${group.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {group.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormDescription>
                  Share this catch with your fishing groups
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any additional notes..."
                    className="min-h-[100px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !form.formState.isValid || (uploadedPhotos.length === 0 && existingPhotos.length === 0)} 
            className="sm:w-auto w-full"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? 'Update' : 'Add'} Catch
          </Button>
        </div>
      </form>
    </Form>
  );
}