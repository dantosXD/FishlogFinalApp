import { pb } from '../pocketbase';
import type { User } from '../pocketbase/types';

export const authApi = {
  async login(email: string, password: string) {
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      return authData.record as User;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async register(email: string, password: string, name: string) {
    try {
      const data = {
        email,
        password,
        passwordConfirm: password,
        name,
      };
      
      const record = await pb.collection('users').create(data);
      await pb.collection('users').authWithPassword(email, password);
      return record as User;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  getCurrentUser() {
    return pb.authStore.model as User | null;
  },

  logout() {
    pb.authStore.clear();
  },

  isAuthenticated() {
    return pb.authStore.isValid;
  },
};