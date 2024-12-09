import { useQuery } from './use-query';
import type { Event } from '../pocketbase/types';

export function useEvents(options?: {
  date?: string;
  groupId?: string;
}) {
  const conditions = [];
  
  if (options?.date) {
    conditions.push(`date = "${options.date}"`);
  }
  
  if (options?.groupId) {
    conditions.push(`group = "${options.groupId}"`);
  }

  return useQuery<Event>('events', {
    filter: conditions.length > 0 ? conditions.join(' && ') : undefined,
    expand: 'participants,creator,group',
    sort: 'date',
  });
}