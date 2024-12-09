import { useState, useEffect } from 'react';
import { pb } from '../pocketbase';
import type { RecordModel } from '../pocketbase';

interface Options {
  filter?: string;
  sort?: string;
  expand?: string;
  fields?: string;
  requestKey?: string;
}

interface ListResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  perPage: number;
  error?: Error;
  isLoading: boolean;
  isError: boolean;
}

export function useList<T extends RecordModel>(
  collection: string,
  page = 1,
  perPage = 50,
  options: Options = {}
): ListResult<T> {
  const [result, setResult] = useState<ListResult<T>>({
    items: [],
    totalItems: 0,
    totalPages: 0,
    page,
    perPage,
    isLoading: true,
    isError: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const resultList = await pb.collection(collection).getList<T>(page, perPage, options);
        setResult({
          items: resultList.items,
          totalItems: resultList.totalItems,
          totalPages: resultList.totalPages,
          page: resultList.page,
          perPage: resultList.perPage,
          isLoading: false,
          isError: false,
        });
      } catch (error) {
        setResult((prev) => ({
          ...prev,
          error: error as Error,
          isLoading: false,
          isError: true,
        }));
      }
    };

    loadData();
  }, [collection, page, perPage, options.requestKey]);

  return result;
}

export function useOne<T extends RecordModel>(
  collection: string,
  id: string,
  options: Options = {}
) {
  const [record, setRecord] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await pb.collection(collection).getOne<T>(id, options);
        setRecord(result);
        setError(null);
      } catch (error) {
        setError(error as Error);
        setRecord(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [collection, id, options.requestKey]);

  return { record, error, isLoading };
}

export function useRealtime<T extends RecordModel>(
  collection: string,
  id: string,
  options: Options = {}
) {
  const [record, setRecord] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;
    let unsubscribe: (() => void) | null = null;

    const loadData = async () => {
      try {
        const result = await pb.collection(collection).getOne<T>(id, options);
        if (isSubscribed) {
          setRecord(result);
          setError(null);
        }
      } catch (error) {
        if (isSubscribed) {
          setError(error as Error);
          setRecord(null);
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    const setupSubscription = async () => {
      try {
        // Subscribe to realtime updates
        unsubscribe = await pb.collection(collection).subscribe<T>(id, (e) => {
          if (!isSubscribed) return;
          
          if (e.action === 'delete') {
            setRecord(null);
          } else {
            setRecord(e.record);
          }
        });
      } catch (error) {
        console.error('Subscription error:', error);
      }
    };

    loadData();
    setupSubscription();

    return () => {
      isSubscribed = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collection, id, options.requestKey]);

  return { record, error, isLoading };
}