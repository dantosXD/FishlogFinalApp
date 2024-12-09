import PocketBase from 'pocketbase';
import type {
  Catch,
  FishingGroup,
  Event,
  Challenge,
  Comment,
  User
} from './pocketbase/types';

const pb = new PocketBase('https://pocketbase.sustainablegrowthlabs.com');

// Store for cancellation controllers
const cancelControllers = new Map<string, AbortController>();

export class ApiError extends Error {
  public readonly isAbort: boolean;
  public readonly details: Record<string, string[]> = {}; // Initialized as empty object

  constructor(
    message: string, 
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.isAbort = this.isAbortError(originalError);

    if (originalError && typeof originalError === 'object' && 'data' in originalError) {
      const data = (originalError as any).data;
      if (data && typeof data.errors === 'object') {
        this.details = data.errors;
        const firstError = Object.values(this.details)[0]?.[0];
        if (firstError) {
          this.message = `${message}: ${firstError}`;
        }
      }
    }
  }

  private isAbortError(error: unknown): boolean {
    if (!error) return false;

    if (error instanceof Error && error.name === 'AbortError') {
      return true;
    }

    if (typeof error === 'object' && error !== null) {
      const err = error as any;
      return err.isAbort === true || err.code === 20 || err.name === 'AbortError';
    }

    return false;
  }
}

export interface ListResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  page: number;
}

export interface ListOptions {
  filter?: string;
  sort?: string;
  expand?: string;
  $cancelKey?: string;
  [key: string]: any;
}

export interface BaseApi<T> {
  list: (filter?: string, sort?: string, expand?: string, options?: ListOptions) => Promise<ListResponse<T>>;
  create: (data: FormData) => Promise<T>;
  update: (id: string, data: FormData) => Promise<T>;
  delete: (id: string) => Promise<void>;
  cancelRequest: (key: string) => void;
}

export const catchesApi: BaseApi<Catch> = {
  async list(
    filter = '',
    sort = '-created',
    expand = 'user,sharedWithGroups',
    options?: ListOptions
  ): Promise<ListResponse<Catch>> {
    try {
      const { signal, ...restOptions } = options || {};

      const result = await pb.collection('catches').getList<Catch>(1, 50, {
        filter,
        sort,
        expand,
        ...restOptions
      });

      return result;
    } catch (error) {
      throw new ApiError('Failed to fetch catches', error);
    }
  },

  async create(data: FormData): Promise<Catch> {
    try {
      const authData = pb.authStore.model;
      if (!authData?.id) {
        throw new ApiError('User must be authenticated to create a catch');
      }

      // Create a new FormData instance to avoid modifying the original
      const formData = new FormData();
      
      // Add user ID
      formData.append('user', authData.id);

      // Copy all fields except photos and sharedWithGroups
      for (const [key, value] of data.entries()) {
        if (key !== 'photos' && key !== 'sharedWithGroups') {
          formData.append(key, value);
        }
      }

      // Handle photos separately
      const photos = data.getAll('photos');
      photos.forEach((photo) => {
        if (photo instanceof File) {
          formData.append('photos', photo);
        } else if (typeof photo === 'string') {
          // If it's an existing photo URL, append it as is
          formData.append('photos', photo);
        }
      });

      // Handle sharedWithGroups
      const sharedWithGroups = data.get('sharedWithGroups');
      if (sharedWithGroups) {
        try {
          const groups = JSON.parse(sharedWithGroups as string);
          if (Array.isArray(groups)) {
            formData.append('sharedWithGroups', JSON.stringify(groups));
          }
        } catch (e) {
          console.warn('Invalid sharedWithGroups format:', e);
        }
      }

      // Ensure featurePhotoIndex is set
      if (!formData.has('featurePhotoIndex')) {
        formData.set('featurePhotoIndex', '0');
      }

      // Log formData contents for debugging
      console.log('Creating catch with data:', {
        user: formData.get('user'),
        species: formData.get('species'),
        weight: formData.get('weight'),
        length: formData.get('length'),
        location: formData.get('location'),
        date: formData.get('date'),
        photos: Array.from(formData.getAll('photos')).length,
        sharedWithGroups: formData.get('sharedWithGroups'),
        featurePhotoIndex: formData.get('featurePhotoIndex'),
      });

      const record = await pb.collection('catches').create<Catch>(formData);
      return record;
    } catch (error) {
      console.error('Create catch error:', error);
      throw new ApiError('Failed to create catch', error);
    }
  },

  async update(id: string, data: FormData): Promise<Catch> {
    try {
      // Create a new FormData instance to avoid modifying the original
      const formData = new FormData();

      // Copy all fields except photos and sharedWithGroups
      for (const [key, value] of data.entries()) {
        if (key !== 'photos' && key !== 'sharedWithGroups') {
          formData.append(key, value);
        }
      }

      // Handle photos separately
      const photos = data.getAll('photos');
      photos.forEach((photo) => {
        if (photo instanceof File) {
          formData.append('photos', photo);
        } else if (typeof photo === 'string') {
          // If it's an existing photo URL, append it as is
          formData.append('photos', photo);
        }
      });

      // Handle sharedWithGroups
      const sharedWithGroups = data.get('sharedWithGroups');
      if (sharedWithGroups) {
        try {
          const groups = JSON.parse(sharedWithGroups as string);
          if (Array.isArray(groups)) {
            formData.append('sharedWithGroups', JSON.stringify(groups));
          }
        } catch (e) {
          console.warn('Invalid sharedWithGroups format:', e);
        }
      }

      // Log formData contents for debugging
      console.log('Updating catch with data:', {
        species: formData.get('species'),
        weight: formData.get('weight'),
        length: formData.get('length'),
        location: formData.get('location'),
        date: formData.get('date'),
        photos: Array.from(formData.getAll('photos')).length,
        sharedWithGroups: formData.get('sharedWithGroups'),
        featurePhotoIndex: formData.get('featurePhotoIndex'),
      });

      const record = await pb.collection('catches').update<Catch>(id, formData);
      return record;
    } catch (error) {
      console.error('Update catch error:', error);
      throw new ApiError('Failed to update catch', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await pb.collection('catches').delete(id);
    } catch (error) {
      throw new ApiError('Failed to delete catch', error);
    }
  },

  cancelRequest(key: string): void {
    const controller = cancelControllers.get(key);
    if (controller) {
      controller.abort();
      cancelControllers.delete(key);
    }
  }
};

export const groupsApi: BaseApi<FishingGroup> = {
  async list(
    filter = '',
    sort = '-created',
    expand = 'members,admins',
    options?: ListOptions
  ): Promise<ListResponse<FishingGroup>> {
    try {
      const { signal, ...restOptions } = options || {};

      const result = await pb.collection('fishing_groups').getList<FishingGroup>(1, 50, {
        filter,
        sort,
        expand,
        ...restOptions
      });

      return result;
    } catch (error) {
      throw new ApiError('Failed to fetch fishing groups', error);
    }
  },

  async create(data: FormData): Promise<FishingGroup> {
    try {
      return await pb.collection('fishing_groups').create<FishingGroup>(data);
    } catch (error) {
      throw new ApiError('Failed to create fishing group', error);
    }
  },

  async update(id: string, data: FormData): Promise<FishingGroup> {
    try {
      return await pb.collection('fishing_groups').update<FishingGroup>(id, data);
    } catch (error) {
      throw new ApiError('Failed to update fishing group', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await pb.collection('fishing_groups').delete(id);
    } catch (error) {
      throw new ApiError('Failed to delete fishing group', error);
    }
  },

  cancelRequest(key: string): void {
    const controller = cancelControllers.get(key);
    if (controller) {
      controller.abort();
      cancelControllers.delete(key);
    }
  }
};

// Type guard for User
function isUser(record: any): record is User {
  return (
    typeof record === 'object' &&
    record !== null &&
    'name' in record &&
    'email' in record
  );
}

export const authApi = {
  login: async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      const user = authData.record;
      if (!isUser(user)) {
        throw new ApiError('Invalid user data received from server');
      }
      return {
        user,
        token: pb.authStore.token,
      };
    } catch (error) {
      throw new ApiError('Failed to login', error);
    }
  },

  register: async (data: { email: string; password: string; name: string }) => {
    try {
      await pb.collection('users').create(data);
      const authData = await pb.collection('users').authWithPassword(data.email, data.password);
      const user = authData.record;
      if (!isUser(user)) {
        throw new ApiError('Invalid user data received from server');
      }
      return {
        user,
        token: pb.authStore.token,
      };
    } catch (error) {
      throw new ApiError('Failed to register user', error);
    }
  },

  logout: () => {
    pb.authStore.clear();
  },

  getCurrentUser: () => {
    if (pb.authStore.isValid && pb.authStore.model) {
      const user = pb.authStore.model;
      if (isUser(user)) {
        return user;
      }
    }
    return null;
  },

  updateProfile: async (userId: string, data: Partial<User>) => {
    try {
      const updated = await pb.collection('users').update(userId, data);
      if (!isUser(updated)) {
        throw new ApiError('Invalid user data received from server');
      }
      return updated;
    } catch (error) {
      throw new ApiError('Failed to update profile', error);
    }
  },
};

export const eventsApi: BaseApi<Event> = {
  async list(
    filter = '',
    sort = '-created',
    expand = 'group,participants,creator',
    options?: ListOptions
  ): Promise<ListResponse<Event>> {
    try {
      const { signal, ...restOptions } = options || {};

      const result = await pb.collection('events').getList<Event>(1, 50, {
        filter,
        sort,
        expand,
        ...restOptions
      });

      return result;
    } catch (error) {
      throw new ApiError('Failed to fetch events', error);
    }
  },

  async create(data: FormData): Promise<Event> {
    try {
      return await pb.collection('events').create<Event>(data);
    } catch (error) {
      throw new ApiError('Failed to create event', error);
    }
  },

  async update(id: string, data: FormData): Promise<Event> {
    try {
      return await pb.collection('events').update<Event>(id, data);
    } catch (error) {
      throw new ApiError('Failed to update event', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await pb.collection('events').delete(id);
    } catch (error) {
      throw new ApiError('Failed to delete event', error);
    }
  },

  cancelRequest(key: string): void {
    const controller = cancelControllers.get(key);
    if (controller) {
      controller.abort();
      cancelControllers.delete(key);
    }
  }
};

export const challengesApi: BaseApi<Challenge> = {
  async list(
    filter = '',
    sort = '-created',
    expand = 'group,participants,winner',
    options?: ListOptions
  ): Promise<ListResponse<Challenge>> {
    try {
      const { signal, ...restOptions } = options || {};

      const result = await pb.collection('challenges').getList<Challenge>(1, 50, {
        filter,
        sort,
        expand,
        ...restOptions
      });

      return result;
    } catch (error) {
      throw new ApiError('Failed to fetch challenges', error);
    }
  },

  async create(data: FormData): Promise<Challenge> {
    try {
      return await pb.collection('challenges').create<Challenge>(data);
    } catch (error) {
      throw new ApiError('Failed to create challenge', error);
    }
  },

  async update(id: string, data: FormData): Promise<Challenge> {
    try {
      return await pb.collection('challenges').update<Challenge>(id, data);
    } catch (error) {
      throw new ApiError('Failed to update challenge', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await pb.collection('challenges').delete(id);
    } catch (error) {
      throw new ApiError('Failed to delete challenge', error);
    }
  },

  cancelRequest(key: string): void {
    const controller = cancelControllers.get(key);
    if (controller) {
      controller.abort();
      cancelControllers.delete(key);
    }
  }
};

export const commentsApi: BaseApi<Comment> = {
  async list(
    filter = '',
    sort = '-created',
    expand = 'user,catch',
    options?: ListOptions
  ): Promise<ListResponse<Comment>> {
    try {
      const { signal, ...restOptions } = options || {};

      const result = await pb.collection('comments').getList<Comment>(1, 50, {
        filter,
        sort,
        expand,
        ...restOptions
      });

      return result;
    } catch (error) {
      throw new ApiError('Failed to fetch comments', error);
    }
  },

  async create(data: FormData): Promise<Comment> {
    try {
      return await pb.collection('comments').create<Comment>(data);
    } catch (error) {
      throw new ApiError('Failed to create comment', error);
    }
  },

  async update(id: string, data: FormData): Promise<Comment> {
    try {
      return await pb.collection('comments').update<Comment>(id, data);
    } catch (error) {
      throw new ApiError('Failed to update comment', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await pb.collection('comments').delete(id);
    } catch (error) {
      throw new ApiError('Failed to delete comment', error);
    }
  },

  cancelRequest(key: string): void {
    const controller = cancelControllers.get(key);
    if (controller) {
      controller.abort();
      cancelControllers.delete(key);
    }
  }
};

export { pb };
