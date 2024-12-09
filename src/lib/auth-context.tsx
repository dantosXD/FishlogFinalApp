import { createContext, useContext, useState, useEffect } from 'react';
import { pb } from './pocketbase';
import type { User } from './pocketbase/types';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => pb.authStore.model as User | null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Subscribe to auth state changes
  useEffect(() => {
    pb.authStore.onChange((token, model) => {
      console.log('Auth state changed:', { token, model });
      setUser(model ? model as User : null);
    });

    // Check initial auth state
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { record } = await pb.collection('users').authWithPassword(email, password);
      setUser(record as User);
      toast({
        title: 'Welcome back!',
        description: 'Successfully logged in.',
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: 'Invalid email or password.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      const data = {
        email,
        password,
        passwordConfirm: password,
        name,
      };
      await pb.collection('users').create(data);
      const { record } = await pb.collection('users').authWithPassword(email, password);
      setUser(record as User);
      toast({
        title: 'Welcome!',
        description: 'Your account has been created successfully.',
      });
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: 'Please check your information and try again.',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    pb.authStore.clear();
    setUser(null);
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}