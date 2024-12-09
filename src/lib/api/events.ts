import { pb } from '../pocketbase';
import type { Event } from '../pocketbase/types';

export const eventsApi = {
  async list(filter = '', page = 1, perPage = 50) {
    try {
      const resultList = await pb.collection('events').getList(page, perPage, {
        sort: '-created',
        filter,
        expand: 'group,participants,creator',
      });

      return {
        items: resultList.items as Event[],
        totalItems: resultList.totalItems,
        totalPages: resultList.totalPages,
        page: resultList.page,
      };
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  async getById(id: string) {
    try {
      const record = await pb.collection('events').getOne(id, {
        expand: 'group,participants,creator',
      });
      return record as Event;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw error;
    }
  },

  async create(data: Partial<Event>) {
    try {
      const record = await pb.collection('events').create(data);
      return record as Event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Event>) {
    try {
      const record = await pb.collection('events').update(id, data);
      return record as Event;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await pb.collection('events').delete(id);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },
};