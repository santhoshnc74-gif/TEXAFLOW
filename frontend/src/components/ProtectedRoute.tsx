import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const role = authService.getUserRole();
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect worker to worker dashboard if they try to access admin pages
    if (role === 'WORKER') {
      return <Navigate to="/worker-dashboard" replace />;
    }
    // Admin trying to access worker-only page, redirect to admin dashboard
    if (role === 'ADMIN') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
