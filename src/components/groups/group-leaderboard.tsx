import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
  Fish,
  Scale,
  Ruler,
  MapPin,
  Award,
  SlidersHorizontal,
} from 'lucide-react';
import type { FishingGroup, Catch, RecordModel } from '../../lib/pocketbase';
import { pb } from '../../lib/pocketbase';
import { useToast } from '../../hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

interface GroupLeaderboardProps {
  group: FishingGroup;
  catches: Catch[];
  isLoading: boolean;
}

interface MemberStats {
  member: RecordModel;
  stats: {
    totalCatches: number;
    biggestCatch: number;
    longestCatch: number;
    uniqueLocations: number;
    uniqueSpecies: number;
  };
}

type LeaderboardFilter = 'totalCatches' | 'biggestCatch' | 'longestCatch' | 'uniqueLocations' | 'uniqueSpecies';

const filterLabels: Record<LeaderboardFilter, string> = {
  totalCatches: 'Most Catches',
  biggestCatch: 'Biggest Catch',
  longestCatch: 'Longest Catch',
  uniqueLocations: 'Most Locations',
  uniqueSpecies: 'Most Species',
};

export function GroupLeaderboard({ group, catches, isLoading }: GroupLeaderboardProps) {
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [filter, setFilter] = useState<LeaderboardFilter>('totalCatches');
  const { toast } = useToast();

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const records = await pb.collection('users').getFullList({
          filter: group.members.map(id => `id = "${id}"`).join(' || '),
        });

        const stats = records.map(member => {
          const memberCatches = catches.filter(c => c.user === member.id);

          return {
            member,
            stats: {
              totalCatches: memberCatches.length,
              biggestCatch: Math.max(...memberCatches.map(c => c.weight), 0),
              longestCatch: Math.max(...memberCatches.map(c => c.length), 0),
              uniqueLocations: new Set(memberCatches.map(c => c.location)).size,
              uniqueSpecies: new Set(memberCatches.map(c => c.species)).size,
            },
          };
        }).sort((a, b) => b.stats[filter] - a.stats[filter]);

        setMemberStats(stats);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load member statistics. Please try again.',
        });
      }
    };

    if (!isLoading) {
      loadMembers();
    }
  }, [group.members, catches, isLoading, toast, filter]);

  const getStatValue = (stats: MemberStats['stats'], filter: LeaderboardFilter) => {
    switch (filter) {
      case 'totalCatches':
        return `${stats.totalCatches} catches`;
      case 'biggestCatch':
        return `${stats.biggestCatch} lbs`;
      case 'longestCatch':
        return `${stats.longestCatch} in`;
      case 'uniqueLocations':
        return `${stats.uniqueLocations} locations`;
      case 'uniqueSpecies':
        return `${stats.uniqueSpecies} species`;
    }
  };

  const getStatIcon = (filter: LeaderboardFilter) => {
    switch (filter) {
      case 'totalCatches':
        return Fish;
      case 'biggestCatch':
        return Scale;
      case 'longestCatch':
        return Ruler;
      case 'uniqueLocations':
        return MapPin;
      case 'uniqueSpecies':
        return Award;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center items-end gap-4 h-48">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`relative flex flex-col items-center ${
                i === 1 ? 'h-48' : i === 0 ? 'h-40' : 'h-32'
              }`}
            >
              <div className="flex-1 w-24 bg-muted rounded-t-lg animate-pulse" />
              <div className="w-full bg-card p-4 rounded-b-lg animate-pulse" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-4 rounded-lg border animate-pulse"
            >
              <div className="h-10 w-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-full bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const StatIcon = getStatIcon(filter);

  return (
    <div className="space-y-6 p-4">
      {/* Filter Selection */}
      <div className="flex justify-end px-2">
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as LeaderboardFilter)}
        >
          <SelectTrigger className="w-[180px]">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(filterLabels) as [LeaderboardFilter, string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Top 3 Podium */}
      <div className="flex justify-center items-end gap-6 h-52 px-4">
        {memberStats.slice(0, 3).map((stat, index) => {
          const height = index === 1 ? 'h-52' : index === 0 ? 'h-44' : 'h-36';
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';

          return (
            <div
              key={stat.member.id}
              className={`relative flex flex-col items-center ${height}`}
            >
              <div className="absolute -top-3 text-2xl">{medal}</div>
              <div className="flex-1 w-28 bg-muted rounded-t-lg flex items-end justify-center p-3">
                <Avatar className="h-16 w-16 border-4 border-background">
                  {stat.member.avatar ? (
                    <AvatarImage
                      src={pb.files.getUrl(stat.member, stat.member.avatar)}
                      alt={stat.member.name}
                    />
                  ) : (
                    <AvatarFallback>{stat.member.name[0]}</AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="w-full bg-card p-3 text-center rounded-b-lg shadow-sm">
                <div className="font-medium truncate">{stat.member.name}</div>
                <div className="text-sm text-muted-foreground">
                  {getStatValue(stat.stats, filter)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Stats */}
      <div className="space-y-3">
        {memberStats.map((stat, index) => (
          <div
            key={stat.member.id}
            className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="text-lg font-medium text-muted-foreground min-w-[2rem] text-right">
                #{index + 1}
              </div>
              <Avatar>
                {stat.member.avatar ? (
                  <AvatarImage
                    src={pb.files.getUrl(stat.member, stat.member.avatar)}
                    alt={stat.member.name}
                  />
                ) : (
                  <AvatarFallback>{stat.member.name[0]}</AvatarFallback>
                )}
              </Avatar>
            </div>

            <div className="flex-1 space-y-3">
              <div className="font-medium">{stat.member.name}</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <StatIcon className="h-4 w-4" />
                  <span>{getStatValue(stat.stats, filter)}</span>
                </div>
                {filter !== 'totalCatches' && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Fish className="h-4 w-4" />
                    <span>{stat.stats.totalCatches} catches</span>
                  </div>
                )}
                {filter !== 'biggestCatch' && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Scale className="h-4 w-4" />
                    <span>{stat.stats.biggestCatch} lbs best</span>
                  </div>
                )}
                {filter !== 'uniqueLocations' && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{stat.stats.uniqueLocations} locations</span>
                  </div>
                )}
                {filter !== 'uniqueSpecies' && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Award className="h-4 w-4" />
                    <span>{stat.stats.uniqueSpecies} species</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
