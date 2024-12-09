import { useState, useEffect, useCallback } from 'react';
import { ClientResponseError } from 'pocketbase';
import { pb } from '../pocketbase/client';
import { useToast } from '@/hooks/use-toast';

interface QueryOptions {
  filter?: string;
  sort?: string;
  expand?: string;
  enabled?: boolean;
}

export function useQuery<T>(
  collectionName: string,
  {
    filter,
    sort = '-created',
    expand,
    enabled = true,
  }: QueryOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const records = await pb.collection(collectionName).getList(1, 50, {
        filter,
        sort,
        expand,
        requestKey: signal,
      });

      setData(records.items as T[]);
    } catch (err) {
      if (err instanceof ClientResponseError) {
        if (!signal?.aborted) {
          console.error(`Error fetching ${collectionName}:`, err);
          setError(err);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to load ${collectionName}. Please try again.`,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, filter, sort, expand, enabled, toast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}