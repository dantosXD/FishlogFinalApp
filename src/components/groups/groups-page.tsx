import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupCard } from './group-card';
import { CreateGroupDialog } from './create-group-dialog';
import { GroupView } from './group-view';
import { useGroups } from '@/lib/hooks/use-groups';
import { useAuth } from '@/lib/auth-context'; // Updated import path
import { Skeleton } from '@/components/ui/skeleton';
import type { FishingGroup } from '@/lib/pocketbase/types';
import { groupsApi } from '@/lib/api/groups'; // Ensure groupsApi is imported

export function GroupsPage() {
  const { user } = useAuth();
  const { data: groups, isLoading } = useGroups(); // Ensure 'data' is aliased as 'groups'
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<FishingGroup | null>(null);

  const handleCreateGroup = async (newGroup: Omit<FishingGroup, 'id' | 'created'>) => {
    try {
      const formData = new FormData();
      formData.append('name', newGroup.name);
      formData.append('description', newGroup.description || '');

      // Append members and admins individually for array fields
      if (user?.id) {
        formData.append('members', user.id);
        formData.append('admins', user.id);
      } else {
        throw new Error('User is not authenticated.');
      }

      // Create the group using the API
      await groupsApi.create(formData);

      // Refresh the groups list after creation
      // The useGroups hook will automatically refetch
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error creating group:', error);
      // Optionally, display a toast or error message to the user
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      // Implement the logic to leave the group
      // This might involve removing the user from the group's members
      // Example:
      // await groupsApi.update(groupId, { removeMembers: [user.id] });
      console.log('Leave group:', groupId);
    } catch (error) {
      console.error('Error leaving group:', error);
      // Optionally, display a toast or error message to the user
    }
  };

  const handleUpdateGroup = async (updatedGroup: FishingGroup) => {
    try {
      setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error('Error updating group:', error);
      // Optionally, display a toast or error message to the user
    }
  };

  if (selectedGroup) {
    return (
      <GroupView
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
        onUpdateGroup={handleUpdateGroup}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Groups</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {groups && groups.length > 0 ? (
          groups.map((group: FishingGroup) => (
            <GroupCard
              key={group.id}
              group={group}
              onLeave={handleLeaveGroup}
              onSelect={setSelectedGroup}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No groups found. Create a new group to get started!
          </div>
        )}
      </div>

      <CreateGroupDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleCreateGroup}
      />
    </div>
  );
}
