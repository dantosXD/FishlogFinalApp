import { useState, useEffect, useCallback } from 'react';
import { Plus, TableIcon, LayoutGrid, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CatchDialog } from '../catches/catch-dialog';
import { CatchFilters } from '../catches/catch-filters';
import { TableView, GridView, TimelineView } from '../catches/catch-views';
import type { DateRange } from 'react-day-picker';
import { isWithinInterval, parseISO } from 'date-fns';
import { catchesApi, groupsApi, ApiError } from '@/lib/api';
import type { Catch, FishingGroup, Location, User } from '@/lib/pocketbase/types'; // Ensure User is imported
import { useToast } from '@/hooks/use-toast';
import { CatchDetailsDialog } from '@/components/catches/catch-details-dialog';

interface RecentCatchesProps {
  user: User; // Changed from userId: string to user: User
  isLoading?: boolean;
}

function getLocationString(location: Location | string): string {
  return typeof location === 'string' ? location : location.name;
}

export function RecentCatches({ user, isLoading: initialLoading }: RecentCatchesProps) {
  const [view, setView] = useState<'table' | 'grid' | 'timeline'>('table');
  const [catches, setCatches] = useState<Catch[]>([]);
  const [groups, setGroups] = useState<FishingGroup[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCatch, setSelectedCatch] = useState<Catch | undefined>();
  const [selectedTab, setSelectedTab] = useState<'details' | 'photos' | 'comments'>('details');
  const [isLoading, setIsLoading] = useState(initialLoading);
  const { toast } = useToast();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const availableSpecies = Array.from(new Set(catches.map((c) => c.species))).sort();
  const availableLocations = Array.from(
    new Set(catches.map((c) => getLocationString(c.location)))
  ).sort();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const listOptions = {
        expand: 'user,sharedWithGroups',
        $cancelKey: `catches-${user.id}`,
      };

      const [catchesResult, groupsResult] = await Promise.all([
        catchesApi.list(
          `user = "${user.id}"`, // Corrected filter syntax
          '-created',
          'user,sharedWithGroups',
          listOptions
        ),
        groupsApi.list(
          '',
          '-created',
          'members,admins',
          {
            expand: 'members,admins',
            $cancelKey: `groups-${user.id}`,
          }
        )
      ]);

      if (catchesResult?.items) {
        setCatches(catchesResult.items);
      }

      if (groupsResult?.items) {
        setGroups(groupsResult.items);
      }
    } catch (error) {
      console.error('Error loading data:', error);

      if (error instanceof ApiError && !error.isAbort) {
        let errorMessage = error.message || 'Failed to load data. Please try again.';
        if (error.details) {
          errorMessage = Object.entries(error.details)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
        }
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMessage,
        });
      } else if (error instanceof DOMException && error.name === 'AbortError') {
        console.log('Fetch aborted');
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user.id, toast]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const loadData = async () => {
      if (!isActive) return;
      await fetchData();
    };

    loadData();

    return () => {
      isActive = false;
      // Cancel any pending requests
      catchesApi.cancelRequest(`catches-${user.id}`);
      groupsApi.cancelRequest(`groups-${user.id}`);
    };
  }, [user, fetchData]);

  const validateFormData = useCallback((data: FormData): boolean => {
    try {
      // Check required fields
      const requiredFields = ['species', 'weight', 'length', 'location', 'date'];
      for (const field of requiredFields) {
        const value = data.get(field);
        if (!value) {
          toast({
            variant: 'destructive',
            title: 'Validation Error',
            description: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
          });
          return false;
        }
      }

      // Check photos
      const photos = data.getAll('photos');
      if (!photos.length) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'At least one photo is required',
        });
        return false;
      }

      // Validate numeric fields
      const weight = parseFloat(data.get('weight') as string);
      const length = parseFloat(data.get('length') as string);
      const weight_oz = parseInt(data.get('weight_oz') as string);

      if (isNaN(weight) || weight <= 0) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Weight must be a positive number',
        });
        return false;
      }

      if (isNaN(length) || length <= 0) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Length must be a positive number',
        });
        return false;
      }

      if (isNaN(weight_oz) || weight_oz < 0 || weight_oz > 15) {
        toast({
          variant: 'destructive',
          title: 'Validation Error',
          description: 'Ounces must be between 0 and 15',
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Form validation error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An error occurred while validating the form',
      });
      return false;
    }
  }, [toast]);

  const handleSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      // Validate form data
      if (!validateFormData(data)) {
        return;
      }

      // Log form data for debugging
      console.log('Submitting catch data:', {
        species: data.get('species'),
        weight: data.get('weight'),
        weight_oz: data.get('weight_oz'),
        length: data.get('length'),
        location: data.get('location'),
        date: data.get('date'),
        photos: data.getAll('photos').length,
        sharedWithGroups: data.get('sharedWithGroups'),
        featurePhotoIndex: data.get('featurePhotoIndex'),
      });

      if (selectedCatch) {
        const updated = await catchesApi.update(selectedCatch.id, data);
        setCatches(prevCatches => 
          prevCatches.map(c => c.id === updated.id ? updated : c)
        );
        toast({
          title: 'Success',
          description: 'Catch updated successfully.',
        });
      } else {
        const created = await catchesApi.create(data);
        setCatches(prevCatches => [created, ...prevCatches]);
        toast({
          title: 'Success',
          description: 'Catch added successfully.',
        });
      }

      setIsDialogOpen(false);
      setSelectedCatch(undefined);

      // Refresh data to ensure we have the latest state
      await fetchData();
    } catch (error) {
      console.error('Error saving catch:', error);

      let errorMessage = 'Failed to save catch. Please try again.';

      if (error instanceof ApiError) {
        if (error.details) {
          errorMessage = Object.entries(error.details)
            .map(([field, errors]) => {
              if (Array.isArray(errors)) {
                return `${field}: ${errors.join(', ')}`;
              }
              return `${field}: ${errors}`;
            })
            .join('\n');
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = useCallback((catch_: Catch) => {
    setSelectedCatch(catch_);
    setIsDialogOpen(true);
  }, []);

  const handleEditSubmit = useCallback(async (data: FormData) => {
    try {
      setIsLoading(true);
      await catchesApi.update(selectedCatch!.id, data);
      await fetchData();
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Catch updated successfully",
      });
    } catch (error) {
      console.error('Error updating catch:', error);
      toast({
        title: "Error",
        description: error instanceof ApiError ? error.message : "Failed to update catch",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [fetchData, toast]);

  const handleViewDetails = (catch_: Catch, defaultTab?: 'details' | 'photos' | 'comments') => {
    setSelectedCatch(catch_);
    if (defaultTab) {
      setSelectedTab(defaultTab);
    } else {
      setSelectedTab('details');
    }
  };

  const handleCloseDialog = () => {
    setSelectedCatch(undefined);
    setSelectedTab('details');
  };

  const filteredCatches = catches.filter((catch_) => {
    try {
      const locationStr = getLocationString(catch_.location);

      // Search filter
      const matchesSearch = !searchQuery || 
        catch_.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
        locationStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (catch_.notes && catch_.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Species filter
      const matchesSpecies = selectedSpecies === 'all' || 
        catch_.species === selectedSpecies;

      // Location filter
      const matchesLocation = selectedLocation === 'all' || 
        locationStr === selectedLocation;

      // Date range filter
      const matchesDateRange = !dateRange?.from || !dateRange?.to || 
        isWithinInterval(parseISO(catch_.date), {
          start: dateRange.from,
          end: dateRange.to,
        });

      return matchesSearch && matchesSpecies && matchesLocation && matchesDateRange;
    } catch (error) {
      console.error('Error filtering catch:', error);
      return false;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Catches</CardTitle>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-12 w-12 bg-muted rounded animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Recent Catches</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-2">
                <Button
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setView('table')}
                >
                  <TableIcon className="h-4 w-4" />
                  <span className="sr-only">Table view</span>
                </Button>
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setView('grid')}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">Grid view</span>
                </Button>
                <Button
                  variant={view === 'timeline' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setView('timeline')}
                >
                  <History className="h-4 w-4" />
                  <span className="sr-only">Timeline view</span>
                </Button>
              </div>
              <Button 
                onClick={() => {
                  setSelectedCatch(undefined);
                  setIsDialogOpen(true);
                }}
                disabled={isLoading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Catch
              </Button>
            </div>
          </div>
          <CatchFilters
            onSearchChange={setSearchQuery}
            onSpeciesChange={setSelectedSpecies}
            onLocationChange={setSelectedLocation}
            onDateRangeChange={setDateRange}
            species={availableSpecies}
            locations={availableLocations}
          />
        </CardHeader>
        <CardContent>
          <div className="min-w-0 overflow-x-auto">
            {filteredCatches.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No catches found matching your filters.
              </div>
            ) : (
              <>
                {view === 'table' && (
                  <TableView 
                    catches={filteredCatches} 
                    onEdit={handleEdit}
                    onViewDetails={handleViewDetails}
                    currentUser={user} 
                    groups={[]} // Changed from currentUserId to currentUser
                  />
                )}
                {view === 'grid' && (
                  <GridView 
                    catches={filteredCatches} 
                    onEdit={handleEdit}
                    onViewDetails={handleViewDetails}
                    currentUser={user} 
                    groups={[]} // Changed from currentUserId to currentUser
                  />
                )}
                {view === 'timeline' && (
                  <TimelineView 
                    catches={filteredCatches} 
                    onEdit={handleEdit}
                    onViewDetails={handleViewDetails}
                    currentUser={user} 
                    groups={[]} // Changed from currentUserId to currentUser
                  />
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
      {selectedCatch && (
        <CatchDetailsDialog
          catch_={selectedCatch}
          open={!!selectedCatch}
          onOpenChange={(open) => !open && handleCloseDialog()}
          defaultTab={selectedTab}
          onEdit={handleEditSubmit}
          groups={[]}
          currentUser={user}
        />
      )}
      <CatchDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        initialData={selectedCatch}
        groups={groups}
        onSubmit={handleSubmit}
      />
    </>
  );
}
