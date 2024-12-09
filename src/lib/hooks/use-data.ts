import { useState, useEffect } from 'react';
import { pb } from '../pocketbase';
import { useToast } from '@/hooks/use-toast';
import type { RecordModel } from 'pocketbase';

interface ListOptions {
  filter?: string;
  sort?: string;
  expand?: string;
  requestKey?: string;
}

export function useData<T extends RecordModel>(
  collectionName: string,
  options: {
    filter?: string;
    sort?: string;
    expand?: string;
    initialData?: T[];
  } = {}
) {
  const [data, setData] = useState<T[]>(options.initialData || []);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);

        const listOptions: ListOptions = {
          filter: options.filter || '',
          sort: options.sort || '-created',
          expand: options.expand || '',
          requestKey: abortController.signal.toString(),
        };

        const records = await pb.collection(collectionName).getList<T>(1, 50, listOptions);
        setData(records.items);
      } catch (err) {
        // Type guard for Error
        if (err instanceof Error) {
          // Only set error if the request wasn't aborted
          if (err.name !== 'AbortError') {
            console.error(`Error loading ${collectionName}:`, err);
            setError(err);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: `Failed to load ${collectionName}. Please try again.`,
            });
          }
        } else {
          console.error(`Unknown error loading ${collectionName}:`, err);
          setError(new Error('An unknown error occurred'));
          toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to load ${collectionName}. Please try again.`,
          });
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    return () => {
      abortController.abort();
    };
  }, [collectionName, options.filter, options.sort, options.expand, toast]);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const listOptions: ListOptions = {
        filter: options.filter || '',
        sort: options.sort || '-created',
        expand: options.expand || '',
      };

      const records = await pb.collection(collectionName).getList<T>(1, 50, listOptions);
      setData(records.items);
    } catch (err) {
      if (err instanceof Error) {
        console.error(`Error refreshing ${collectionName}:`, err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to refresh ${collectionName}. Please try again.`,
        });
      } else {
        console.error(`Unknown error refreshing ${collectionName}:`, err);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to refresh ${collectionName}. Please try again.`,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    refresh,
  };
}