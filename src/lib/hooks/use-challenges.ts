import { useState, useEffect } from 'react';
import { challengesApi } from '../api';
import type { Challenge } from '../pocketbase/types';
import { useToast } from "@/hooks/use-toast";

export function useChallenges(filter = '') {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const result = await challengesApi.list(filter);
        setChallenges(result.items);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load challenges. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadChallenges();
  }, [filter, toast]);

  return { challenges, isLoading };
}

export function useChallenge(id: string) {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadChallenge = async () => {
      try {
        const result = await challengesApi.getById(id);
        setChallenge(result);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load challenge. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadChallenge();
  }, [id, toast]);

  return { challenge, isLoading };
}