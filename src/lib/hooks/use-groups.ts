import { useQuery } from './use-query';
import type { Group } from '../pocketbase/types';

export function useGroups(options?: {
  filter?: string;
  userId?: string;
}) {
  const baseFilter = options?.userId ? `members ~ "${options.userId}"` : '';
  const customFilter = options?.filter || '';
  const filter = [baseFilter, customFilter].filter(Boolean).join(' && ');

  return useQuery<Group>('fishing_groups', {
    filter,
    expand: 'members,admins',
    sort: '-created',
  });
}