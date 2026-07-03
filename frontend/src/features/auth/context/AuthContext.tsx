import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { api } from '../../../utils/api';
import type { User, LoginCredentials, RegisterData } from '../types';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { first_name?: string; last_name?: string; avatar_url?: string; language?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    // Also call the logout endpoint to clear the HttpOnly cookie
    api.post('/auth/logout').catch(console.error);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // Assuming there is a /users/me endpoint to get current user info
      const userData = await api.get<User>('/users/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginCredentials) => {
    try {
      await api.post<{ user: User }>('/auth/login', credentials);
      await refreshUser();
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      await api.post('/auth/register', data);
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (data: { first_name?: string; last_name?: string; avatar_url?: string; language?: string }) => {
    try {
      const updatedUser = await api.patch<User>('/users/me', data);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    updateProfile,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
