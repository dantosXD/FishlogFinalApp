import { pb } from '../pocketbase';
import type { Catch } from '../pocketbase/types';

export class ApiError extends Error {
  constructor(
    message: string, 
    public originalError?: unknown,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
    
    if (originalError && typeof originalError === 'object' && 'data' in originalError) {
      this.details = (originalError as any).data;
      if (this.details) {
        const firstError = Object.values(this.details)[0]?.[0];
        if (firstError) {
          this.message = `${message}: ${firstError}`;
        }
      }
    }
  }
}

export const catchesApi = {
  async list(
    filter = '',
    sort = '-created',
    expand = 'user,sharedWithGroups'
  ) {
    try {
      return await pb.collection('catches').getList<Catch>(1, 50, {
        filter,
        sort,
        expand
      });
    } catch (error) {
      console.error('Error fetching catches:', error);
      throw new ApiError('Failed to fetch catches', error);
    }
  },

  async create(data: FormData) {
    try {
      // Ensure user is set
      const authData = pb.authStore.model;
      if (!authData?.id) {
        throw new ApiError('User must be authenticated to create a catch');
      }

      // Create a new FormData instance to avoid modifying the original
      const formData = new FormData();

      // Add user ID
      formData.append('user', authData.id);

      // Copy over all fields except photos
      for (const [key, value] of data.entries()) {
        if (key !== 'photos') {
          formData.append(key, value);
        }
      }

      // Special handling for sharedWithGroups
      const sharedWithGroups = data.get('sharedWithGroups');
      if (sharedWithGroups) {
        try {
          const groups = JSON.parse(sharedWithGroups as string);
          if (Array.isArray(groups)) {
            formData.set('sharedWithGroups', JSON.stringify(groups));
          }
        } catch (e) {
          console.warn('Invalid sharedWithGroups format, removing field:', e);
        }
      }

      // Handle photos separately to ensure proper file upload
      const photos = data.getAll('photos');
      photos.forEach((photo) => {
        if (photo instanceof File) {
          formData.append('photos', photo);
        }
      });

      // Ensure feature photo index is set
      if (!formData.has('featurePhotoIndex')) {
        formData.set('featurePhotoIndex', '0');
      }

      // Log the form data being sent (for debugging)
      console.log('Creating catch with data:', {
        user: formData.get('user'),
        species: formData.get('species'),
        weight: formData.get('weight'),
        weight_oz: formData.get('weight_oz'),
        length: formData.get('length'),
        location: formData.get('location'),
        date: formData.get('date'),
        photos: photos.length,
        sharedWithGroups: formData.get('sharedWithGroups'),
        featurePhotoIndex: formData.get('featurePhotoIndex'),
      });

      const record = await pb.collection('catches').create<Catch>(formData);
      return record;
    } catch (error) {
      console.error('Create catch error details:', error);
      throw new ApiError('Failed to create catch', error);
    }
  },

  async update(id: string, data: FormData) {
    try {
      // Create a new FormData instance to avoid modifying the original
      const formData = new FormData();

      // Copy over all fields except photos
      for (const [key, value] of data.entries()) {
        if (key !== 'photos') {
          formData.append(key, value);
        }
      }

      // Special handling for sharedWithGroups
      const sharedWithGroups = data.get('sharedWithGroups');
      if (sharedWithGroups) {
        try {
          const groups = JSON.parse(sharedWithGroups as string);
          if (Array.isArray(groups)) {
            formData.set('sharedWithGroups', JSON.stringify(groups));
          }
        } catch (e) {
          console.warn('Invalid sharedWithGroups format, removing field:', e);
        }
      }

      // Handle photos separately to ensure proper file upload
      const photos = data.getAll('photos');
      photos.forEach((photo) => {
        if (photo instanceof File) {
          formData.append('photos', photo);
        }
      });

      const record = await pb.collection('catches').update<Catch>(id, formData);
      return record;
    } catch (error) {
      console.error('Update catch error details:', error);
      throw new ApiError('Failed to update catch', error);
    }
  },

  async delete(id: string) {
    try {
      await pb.collection('catches').delete(id);
    } catch (error) {
      console.error('Delete catch error details:', error);
      throw new ApiError('Failed to delete catch', error);
    }
  },
};