import { pb } from '../pocketbase';
import type { Comment } from '../pocketbase/types';

export const commentsApi = {
  async list(catchId: string, page = 1, perPage = 50) {
    try {
      const resultList = await pb.collection('comments').getList(page, perPage, {
        filter: `catch = "${catchId}"`,
        sort: '-created',
        expand: 'user',
      });

      return {
        items: resultList.items as Comment[],
        totalItems: resultList.totalItems,
        totalPages: resultList.totalPages,
        page: resultList.page,
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  async create(data: Partial<Comment>) {
    try {
      const record = await pb.collection('comments').create(data);
      return record as Comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  async update(id: string, data: Partial<Comment>) {
    try {
      const record = await pb.collection('comments').update(id, data);
      return record as Comment;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      await pb.collection('comments').delete(id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },
};