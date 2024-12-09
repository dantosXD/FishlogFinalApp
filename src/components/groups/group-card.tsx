import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { FishingGroup, User } from '@/lib/pocketbase';
import { useAuth } from '@/lib/auth';
import { pb } from '@/lib/pocketbase';

interface GroupCardProps {
  group: FishingGroup;
  onLeave: (groupId: string) => void;
  onSelect: (group: FishingGroup) => void;
}

interface MemberInfo {
  id: string;
  name: string;
  avatar?: string;
}

export function GroupCard({ group, onLeave, onSelect }: GroupCardProps) {
  const { user } = useAuth();
  const isAdmin = user ? group.admins.includes(user.id) : false;
  const [members, setMembers] = useState<MemberInfo[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadMembers = async () => {
      if (!group.members.length) return;

      try {
        const records = await pb.collection('users').getFullList<User>({
          filter: group.members.map(id => `id = "${id}"`).join(' || '),
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setMembers(records.map(r => ({
            id: r.id,
            name: r.name,
            avatar: r.avatar,
          })));
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        console.error('Failed to load members:', error);
      }
    };

    loadMembers();

    return () => {
      controller.abort();
    };
  }, [group.members]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            {group.avatar ? (
              <AvatarImage
                src={pb.files.getUrl(group, group.avatar)}
                alt={group.name}
              />
            ) : (
              <AvatarFallback>
                <Users className="h-6 w-6" />
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <CardTitle className="text-xl">{group.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAdmin ? (
              <>
                <DropdownMenuItem>Manage Members</DropdownMenuItem>
                <DropdownMenuItem>Edit Group</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Delete Group
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={() => onLeave(group.id)}>
                Leave Group
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
        <div className="flex justify-between items-center">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((member) => (
              <Avatar
                key={member.id}
                className="h-8 w-8 border-2 border-background"
              >
                {member.avatar ? (
                  <AvatarImage src={member.avatar} alt={member.name} />
                ) : (
                  <AvatarFallback>{member.name[0]}</AvatarFallback>
                )}
              </Avatar>
            ))}
            {members.length > 5 && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                +{members.length - 5}
              </div>
            )}
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => onSelect(group)}
          >
            View Group
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}