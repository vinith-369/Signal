"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from './api';
import { User } from './types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateProfile: (data: any) => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedToken = localStorage.getItem('signal_token');
    if (savedToken) {
      setToken(savedToken);
      api.getMe()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem('signal_token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    const newToken = res.access_token;
    localStorage.setItem('signal_token', newToken);
    setToken(newToken);
    const u = await api.getMe();
    setUser(u);
    router.push('/chat');
  }, [router]);

  const register = useCallback(async (data: any) => {
    await api.register(data);
    await login(data.username, data.password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('signal_token');
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const updateProfile = useCallback(async (data: any) => {
    const updated = await api.updateProfile(data);
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, isLoading, isAuthenticated: !!user, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
