import { pb } from '../pocketbase';
import PocketBase from 'pocketbase';

type Record = PocketBase.Record;

export const filesService = {
  async uploadFiles(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    try {
      const result = await pb.collection('files').create(formData);
      return result.files.map((file: string) => file);
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  },

  getFileUrl(record: Record, filename: string): string {
    return pb.files.getUrl(record, filename);
  },

  getThumbUrl(record: Record, filename: string, thumb = '100x100'): string {
    return pb.files.getUrl(record, filename, { thumb });
  },

  async deleteFile(record: Record, filename: string): Promise<void> {
    try {
      await pb.collection(record.collectionName).update(record.id, {
        [filename]: null,
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  },
};