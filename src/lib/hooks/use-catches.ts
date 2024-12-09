import { useQuery } from './use-query';
import type { Catch } from '../pocketbase/types';

export function useCatches(options?: {
  filter?: string;
  userId?: string;
}) {
  const baseFilter = options?.userId ? `user = "${options.userId}"` : '';
  const customFilter = options?.filter || '';
  const filter = [baseFilter, customFilter].filter(Boolean).join(' && ');

  return useQuery<Catch>('catches', {
    filter,
    expand: 'user,sharedWithGroups',
    sort: '-created',
  });
}