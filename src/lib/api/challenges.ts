import { pb } from '../pocketbase';
import type { Challenge } from '../pocketbase/types';

export const challengesApi = {
  async list(filter = '', page = 1, perPage = 50) {
    try {
      const resultList = await pb.collection('challenges').getList(page, perPage, {
        sort: '-created',
        filter,
        expand: 'group,participants,winner',
      });

      return {
        items: resultList.items as Challenge[],
        totalItems: resultList.totalItems,
        totalPages: resultList.totalPages,
        page: resultList.page,
      };
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }
  },

  async getById(id: string) {
    try {
      const record = await pb.collection('challenges').getOne(id, {
        expand: 'group,participants,winner',
      });
      return record as Challenge;
    } catch (error) {
      console.error('Error fetching challenge:', error);
      throw error;
    }
  },

  async create(data: Partial<Challenge>) {
    try {
      const record = await pb.collection('challenges').create(data);
      return record as Challenge;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Challenge>) {
    try {
      const record = await pb.collection('challenges').update(id, data);
      return record as Challenge;
    } catch (error) {
      console.error('Error updating challenge:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await pb.collection('challenges').delete(id);
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw error;
    }
  },
};