import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { LayoutGrid, Table as TableIcon, History, Plus } from 'lucide-react';
import type { Catch, FishingGroup } from '@/lib/pocketbase/types';
import { useAuth } from '@/lib/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState, useMemo } from 'react';
import { TableView, GridView, TimelineView } from '@/components/catches/catch-views';
import { CatchFilters } from '../catches/catch-filters';
import { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { CatchDialog } from '../catches/catch-dialog';
import { catchesApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CatchDetailsDialog } from '../catches/catch-details-dialog';

interface GroupCatchesProps {
  catches: Catch[];
  isLoading: boolean;
  group: FishingGroup;
  onAddComment?: (catchId: string) => Promise<void>;
}

export function GroupCatches({ catches, isLoading, group }: GroupCatchesProps) {
  const { user: currentUser } = useAuth();
  const [view, setView] = useState<'table' | 'grid' | 'timeline'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [catchToEdit, setCatchToEdit] = useState<Catch | null>(null);
  const [selectedCatch, setSelectedCatch] = useState<Catch | null>(null);
  const [selectedTab, setSelectedTab] = useState<'details' | 'photos' | 'comments'>('details');
  const { toast } = useToast();

  const availableSpecies = useMemo(() => 
    Array.from(new Set(catches.map((c) => c.species))).sort(),
    [catches]
  );

  const availableLocations = useMemo(() => 
    Array.from(new Set(catches.map((c) => 
      typeof c.location === 'string' ? c.location : c.location?.name
    ))).sort(),
    [catches]
  );

  const filteredCatches = useMemo(() => {
    return catches.filter((catch_) => {
      // Search query filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        catch_.species.toLowerCase().includes(searchLower) ||
        (catch_.notes?.toLowerCase().includes(searchLower)) ||
        (typeof catch_.location === 'string' 
          ? catch_.location.toLowerCase().includes(searchLower)
          : catch_.location?.name.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Species filter
      if (selectedSpecies !== 'all' && catch_.species !== selectedSpecies) {
        return false;
      }

      // Location filter
      if (selectedLocation !== 'all') {
        const catchLocation = typeof catch_.location === 'string' 
          ? catch_.location 
          : catch_.location?.name;
        if (catchLocation !== selectedLocation) {
          return false;
        }
      }

      // Date range filter
      if (dateRange?.from) {
        const catchDate = new Date(catch_.date);
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        
        if (catchDate < fromDate) {
          return false;
        }

        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          if (catchDate > toDate) {
            return false;
          }
        }
      }

      return true;
    });
  }, [catches, searchQuery, selectedSpecies, selectedLocation, dateRange]);

  const handleViewDetails = (catch_: Catch, defaultTab?: 'details' | 'photos' | 'comments') => {
    setSelectedCatch(catch_);
    if (defaultTab) {
      setSelectedTab(defaultTab);
    }
  };

  const handleSubmit = async (data: FormData) => {
    try {
      // Pre-select the current group
      data.append('sharedWithGroups', group.id);
      
      if (catchToEdit) {
        // Update existing catch
        await catchesApi.update(catchToEdit.id, data);
        toast({
          title: "Success",
          description: "Catch updated successfully",
        });
        setCatchToEdit(null);
      } else {
        // Create new catch
        await catchesApi.create(data);
        toast({
          title: "Success",
          description: "Catch added successfully",
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving catch:', error);
      toast({
        title: "Error",
        description: catchToEdit ? "Failed to update catch" : "Failed to create catch",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (catch_: Catch) => {
    setCatchToEdit(catch_);
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-[200px]" />
        </div>
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="w-full aspect-video rounded-lg" />
                <div className="space-y-3">
                  <Skeleton className="h-5 w-36" />
                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-8 p-4">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row flex-1 gap-4 items-start sm:items-center w-full sm:w-auto">
          <CatchFilters
            onSearchChange={setSearchQuery}
            onSpeciesChange={setSelectedSpecies}
            onLocationChange={setSelectedLocation}
            onDateRangeChange={setDateRange}
            species={availableSpecies}
            locations={availableLocations}
          />
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Catch
          </Button>
        </div>
        <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as typeof view)} className="self-end sm:self-auto">
          <ToggleGroupItem value="table" aria-label="Table view" className="px-3">
            <TableIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view" className="px-3">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="timeline" aria-label="Timeline view" className="px-3">
            <History className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="min-h-[300px]">
        {view === 'table' && (
          <TableView
            catches={filteredCatches}
            currentUser={currentUser}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            groups={[group]}
          />
        )}

        {view === 'grid' && (
          <GridView
            catches={filteredCatches}
            currentUser={currentUser}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            groups={[group]}
          />
        )}

        {view === 'timeline' && (
          <TimelineView
            catches={filteredCatches}
            currentUser={currentUser}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            groups={[group]}
          />
        )}
      </div>

      <CatchDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setCatchToEdit(null);
          }
        }}
        groups={[group]}
        onSubmit={handleSubmit}
        initialData={catchToEdit || undefined}
      />

      {selectedCatch && (
        <CatchDetailsDialog
          catch_={selectedCatch}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCatch(null);
              setSelectedTab('details');
            }
          }}
          onEdit={handleSubmit}
          groups={[group]}
          currentUser={currentUser}
          defaultTab={selectedTab}
        />
      )}
    </div>
  );
}