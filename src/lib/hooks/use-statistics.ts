import { useState, useEffect } from 'react';
import { statisticsService } from '../services';
import { useToast } from "@/hooks/use-toast";

interface CatchStatistics {
  totalCatches: number;
  locations: number;
  biggestCatch: {
    weight: number;
    species: string;
    date: string;
  };
  longestCatch: {
    length: number;
    species: string;
    date: string;
  };
}

interface GroupMemberStats {
  totalCatches: number;
  biggestCatch: number;
  longestCatch: number;
  uniqueLocations: Set<string>;
  uniqueSpecies: Set<string>;
}

type GroupStatistics = Map<string, GroupMemberStats>;

export function useUserStatistics(userId: string | null) {
  const [stats, setStats] = useState<CatchStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadStats = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await statisticsService.getUserStatistics(userId);
        setStats(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load statistics. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [userId, toast]);

  return { stats, isLoading };
}

export function useGroupStatistics(groupId: string | null) {
  const [stats, setStats] = useState<GroupStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadStats = async () => {
      if (!groupId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await statisticsService.getGroupStatistics(groupId);
        setStats(data);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load group statistics. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [groupId, toast]);

  return { stats, isLoading };
}