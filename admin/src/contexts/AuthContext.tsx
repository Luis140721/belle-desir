import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { User, Role } from '../types';
import { authApi } from '../api/adminApi';

interface DecodedToken {
  id: string;
  email: string;
  name: string;
  role: Role;
  exp: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('belle_admin_token');
    if (savedToken) {
      try {
        const decoded = jwtDecode<DecodedToken>(savedToken);
        const isExpired = decoded.exp < Date.now() / 1000;
        
        if (!isExpired && decoded.role === Role.ADMIN) {
          setToken(savedToken);
          setUser({
            id: decoded.id,
            email: decoded.email,
            name: decoded.name,
            role: decoded.role,
            createdAt: '', // Not needed for general use
            updatedAt: '',
          });
        } else {
          localStorage.removeItem('belle_admin_token');
        }
      } catch (err) {
        localStorage.removeItem('belle_admin_token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authApi.login(email, password);
      
      if (data.user.role !== Role.ADMIN) {
        throw new Error('No tienes permisos de administrador');
      }

      localStorage.setItem('belle_admin_token', data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
    } catch (err: any) {
      throw new Error(err.message || 'Error al iniciar sesión');
    }
  };

  const logout = () => {
    localStorage.removeItem('belle_admin_token');
    setToken(null);
    setUser(null);
    window.location.href = '/admin/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
