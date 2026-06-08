import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, role: 'promoter' | 'supervisor', password?: string) => Promise<User>;
  register: (name: string, email: string, role: 'promoter' | 'supervisor', password?: string, supervisorId?: string, storeId?: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('solar_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, role: 'promoter' | 'supervisor', password?: string) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('solar_user', JSON.stringify(userData));
      return userData; // Return so caller knows the TRUE role
    } catch (error) {
      console.error('Login error:', error);
      alert('Falha no login. Verifique as credenciais.');
      throw error;
    }
  };

  const register = async (name: string, email: string, role: 'promoter' | 'supervisor', password?: string, supervisorId?: string, storeId?: string) => {
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, password, supervisorId, storeId })
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const userData = await response.json();
      setUser(userData);
      localStorage.setItem('solar_user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Registration error:', error);
      alert('Falha no cadastro. Verifique as informações.');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('solar_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
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
