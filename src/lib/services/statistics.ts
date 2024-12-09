import { pb } from '../pocketbase';
import type { Catch } from '../pocketbase';

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

export const statisticsService = {
  async getUserStatistics(userId: string): Promise<CatchStatistics> {
    try {
      const catches = await pb.collection('catches').getFullList<Catch>({
        filter: `user = "${userId}"`,
        sort: '-created',
      });

      const uniqueLocations = new Set(catches.map(c => c.location));
      const biggestCatch = catches.reduce((max, curr) => 
        curr.weight > (max?.weight || 0) ? curr : max
      , catches[0]);
      const longestCatch = catches.reduce((max, curr) => 
        curr.length > (max?.length || 0) ? curr : max
      , catches[0]);

      return {
        totalCatches: catches.length,
        locations: uniqueLocations.size,
        biggestCatch: biggestCatch ? {
          weight: biggestCatch.weight,
          species: biggestCatch.species,
          date: biggestCatch.date,
        } : {
          weight: 0,
          species: 'N/A',
          date: new Date().toISOString(),
        },
        longestCatch: longestCatch ? {
          length: longestCatch.length,
          species: longestCatch.species,
          date: longestCatch.date,
        } : {
          length: 0,
          species: 'N/A',
          date: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  },

  async getGroupStatistics(groupId: string) {
    try {
      const catches = await pb.collection('catches').getFullList<Catch>({
        filter: `sharedWithGroups ?= "${groupId}"`,
        expand: 'user',
        sort: '-created',
      });

      const memberStats = new Map<string, {
        totalCatches: number;
        biggestCatch: number;
        longestCatch: number;
        uniqueLocations: Set<string>;
        uniqueSpecies: Set<string>;
      }>();

      catches.forEach(catch_ => {
        const userId = catch_.user;
        const stats = memberStats.get(userId) || {
          totalCatches: 0,
          biggestCatch: 0,
          longestCatch: 0,
          uniqueLocations: new Set<string>(),
          uniqueSpecies: new Set<string>(),
        };

        stats.totalCatches++;
        stats.biggestCatch = Math.max(stats.biggestCatch, catch_.weight);
        stats.longestCatch = Math.max(stats.longestCatch, catch_.length);
        stats.uniqueLocations.add(catch_.location);
        stats.uniqueSpecies.add(catch_.species);

        memberStats.set(userId, stats);
      });

      return memberStats;
    } catch (error) {
      console.error('Error fetching group statistics:', error);
      throw error;
    }
  },
};