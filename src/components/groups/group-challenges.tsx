import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { challengesApi } from '@/lib/api';
import type { Challenge, FishingGroup } from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';

interface GroupChallengesProps {
  group: FishingGroup;
}

export function GroupChallenges({ group }: GroupChallengesProps) {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadChallenges = async () => {
      try {
        const result = await challengesApi.list(`group = "${group.id}"`);
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
  }, [group.id, toast]);

  const getParticipantProgress = (challenge: Challenge, userId: string) => {
    return challenge.participants?.includes(userId) ? 0 : 0; // TODO: Implement progress tracking
  };

  const getProgressPercentage = (challenge: Challenge, progress: number) => {
    if (challenge.type === 'species_variety' && challenge.target?.count) {
      return (progress / challenge.target.count) * 100;
    }
    // For biggest catch challenges, show relative progress
    const maxProgress = Math.max(...(challenge.participants || []).map(id => 
      getParticipantProgress(challenge, id)
    ));
    return maxProgress > 0 ? (progress / maxProgress) * 100 : 0;
  };

  const getLeader = (challenge: Challenge) => {
    if (!challenge.expand?.participants?.length) return null;
    const participantsWithProgress = challenge.expand.participants.map(participant => ({
      participant,
      progress: getParticipantProgress(challenge, participant.id),
    }));
    return participantsWithProgress.sort((a, b) => b.progress - a.progress)[0]?.participant;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="h-6 w-3/4 bg-muted rounded-md animate-pulse" />
                    <div className="h-4 w-full max-w-[500px] bg-muted rounded-md animate-pulse" />
                  </div>
                  <div className="h-5 w-5 bg-muted rounded-md animate-pulse ml-4" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
                  <div className="h-4 w-32 bg-muted rounded-md animate-pulse" />
                </div>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="flex justify-between">
                        <div className="h-4 w-24 bg-muted rounded-md animate-pulse" />
                        <div className="h-4 w-16 bg-muted rounded-md animate-pulse" />
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        <Target className="h-12 w-12 text-muted-foreground/50" />
        <div>
          <p className="text-lg font-medium text-muted-foreground">No active challenges</p>
          <p className="text-sm text-muted-foreground/75">Create a new challenge to compete with your group members!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {challenges.map(challenge => {
        const leader = getLeader(challenge);
        
        return (
          <Card key={challenge.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <h3 className="text-lg font-semibold tracking-tight">{challenge.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {challenge.description}
                  </p>
                </div>
                <Target className="h-5 w-5 text-muted-foreground shrink-0 ml-4" />
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {format(new Date(challenge.startDate), 'MMM d')} -{' '}
                    {format(new Date(challenge.endDate), 'MMM d, yyyy')}
                  </span>
                </div>
                {leader && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 shrink-0 text-yellow-500" />
                    <span className="font-medium">{leader.name} is leading!</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {challenge.expand?.participants?.map(participant => {
                  const progress = getParticipantProgress(challenge, participant.id);
                  const percentage = getProgressPercentage(challenge, progress);

                  return (
                    <div key={participant.id} className="space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{participant.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {challenge.type === 'species_variety' && challenge.target?.count
                            ? `${progress}/${challenge.target.count} species`
                            : `${progress.toFixed(1)} lbs`}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>

              <div>
                <Button variant="outline" className="w-full hover:bg-muted/50">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}