import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

export const AdminGuard: React.FC = () => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-bd-text">Cargando...</div>;
  }

  if (!token || !user || user.role !== Role.ADMIN) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};
