import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  can: (permission: string) => boolean;
  updateLoggedUser: (user: User) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('acrc.user') || 'null'); } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('acrc.token'));

  function login(u: User, t: string) {
    setUser(u); setToken(t);
    localStorage.setItem('acrc.user', JSON.stringify(u));
    localStorage.setItem('acrc.token', t);
  }

  function logout() {
    setUser(null); setToken(null);
    localStorage.removeItem('acrc.user');
    localStorage.removeItem('acrc.token');
  }

  function can(permission: string): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return (user.permissions ?? []).includes(permission);
  }

  function updateLoggedUser(u: User) {
    setUser(u);
    localStorage.setItem('acrc.user', JSON.stringify(u));
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, can, updateLoggedUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
