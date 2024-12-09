import { create } from 'zustand';
import { pb } from '../pocketbase';
import type { User } from '../pocketbase';

interface AuthState {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: pb.authStore.model as User | null,
  token: pb.authStore.token,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  logout: () => {
    pb.authStore.clear();
    set({ user: null, token: null });
  },
}));

// Subscribe to auth store changes
pb.authStore.onChange((token, model) => {
  useAuth.setState({
    token,
    user: model as User | null,
  });
});