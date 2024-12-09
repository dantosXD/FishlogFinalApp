import { useState, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import type { DateRange } from 'react-day-picker';

interface CatchFiltersProps {
  onSearchChange: (value: string) => void;
  onSpeciesChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onDateRangeChange: (range: DateRange | undefined) => void;
  species: string[];
  locations: string[];
}

export function CatchFilters({
  onSearchChange,
  onSpeciesChange,
  onLocationChange,
  onDateRangeChange,
  species,
  locations,
}: CatchFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchChange(value);
  }, [onSearchChange]);

  const handleSpeciesChange = useCallback((value: string) => {
    onSpeciesChange(value);
  }, [onSpeciesChange]);

  const handleLocationChange = useCallback((value: string) => {
    onLocationChange(value);
  }, [onLocationChange]);

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    onDateRangeChange(range);
  }, [onDateRangeChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search catches..."
          className="pl-8"
          value={searchValue}
          onChange={handleSearchChange}
        />
      </div>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="shrink-0">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="species-select">Species</Label>
              <Select onValueChange={handleSpeciesChange}>
                <SelectTrigger id="species-select">
                  <SelectValue placeholder="All species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All species</SelectItem>
                  {species.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-select">Location</Label>
              <Select onValueChange={handleLocationChange}>
                <SelectTrigger id="location-select">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locations.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date Range</Label>
              <DatePickerWithRange onSelect={handleDateRangeChange} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}