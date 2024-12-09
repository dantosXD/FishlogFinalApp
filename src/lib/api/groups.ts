import { pb } from '../pocketbase';
import type { FishingGroup } from '../pocketbase/types';

// Renamed ListOptions to GroupListOptions to avoid export conflicts
export interface GroupListOptions {
  filter?: string;
  sort?: string;
  expand?: string;
  requestKey?: AbortSignal;
  [key: string]: any;
}

export const groupsApi = {
  async list(filter = '', sort = '-created', expand = 'members,admins') {
    try {
      const resultList = await pb.collection('fishing_groups').getList<FishingGroup>(1, 50, {
        filter,
        sort,
        expand,
      });

      return {
        items: resultList.items,
        totalItems: resultList.totalItems,
        totalPages: resultList.totalPages,
        page: resultList.page,
      };
    } catch (error) {
      console.error('Error fetching groups:', error);
      throw error;
    }
  },

  async create(data: FormData) {
    try {
      const record = await pb.collection('fishing_groups').create<FishingGroup>(data);
      return record;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  },

  async update(id: string, data: FormData) {
    try {
      const record = await pb.collection('fishing_groups').update<FishingGroup>(id, data);
      return record;
    } catch (error) {
      console.error('Error updating group:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await pb.collection('fishing_groups').delete(id);
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
  },
};
