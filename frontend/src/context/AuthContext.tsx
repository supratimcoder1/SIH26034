import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  token: string | null;
  user: Partial<User> | null;
  login: (token: string, id: string, email: string, name: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("metroguard_jwt"));
  const [user, setUser] = useState<Partial<User> | null>(() => {
    const saved = localStorage.getItem("metroguard_user");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      localStorage.removeItem("metroguard_user");
      return null;
    }
  });

  const login = (newToken: string, id: string, email: string, name: string, role: string) => {
    localStorage.setItem("metroguard_jwt", newToken);
    setToken(newToken);
    const userData = { id, email, name, role: role as UserRole };
    localStorage.setItem("metroguard_user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("metroguard_jwt");
    localStorage.removeItem("metroguard_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      login,
      logout,
      isAuthenticated: !!token,
      role: user?.role || null
    }}>
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
