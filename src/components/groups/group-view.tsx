import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupCatches } from './group-catches';
import { GroupLeaderboard } from './group-leaderboard';
import { catchesApi } from '@/lib/api/catches';
import type { FishingGroup, Catch } from '@/lib/pocketbase';
import { useToast } from '@/hooks/use-toast';

interface GroupViewProps {
  group: FishingGroup;
  onBack: () => void;
}

export function GroupView({ group, onBack }: GroupViewProps) {
  const [catches, setCatches] = useState<Catch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadCatches = async () => {
      try {
        const result = await catchesApi.list(`sharedWithGroups ~ "${group.id}"`);
        setCatches(result.items);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load catches. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCatches();
  }, [group.id, toast]);

  const handleAddComment = async (catchId: string) => {
    try {
      const result = await catchesApi.list(`id = "${catchId}"`);
      if (result.items.length > 0) {
        const updatedCatch = result.items[0];
        setCatches(prevCatches =>
          prevCatches.map(c => c.id === updatedCatch.id ? updatedCatch : c)
        );
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update catch. Please try again.',
      });
    }
  };

  return (
    <div className="container py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-3xl font-bold">{group.name}</h1>
      </div>

      <Tabs defaultValue="catches" className="space-y-6">
        <TabsList>
          <TabsTrigger value="catches">Catches</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="catches">
          <GroupCatches
            catches={catches}
            isLoading={isLoading}
            onAddComment={handleAddComment}
            group={group}
          />
        </TabsContent>

        <TabsContent value="leaderboard">
          <GroupLeaderboard 
            group={group}
            catches={catches}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
