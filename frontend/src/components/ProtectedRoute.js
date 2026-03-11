import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ element, requiredRole = null }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</div>;

  if (!user) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (requiredRole && user.role !== requiredRole && requiredRole !== 'admin_or_seller') {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'admin_or_seller' && user.role !== 'admin' && user.role !== 'seller') {
    return <Navigate to="/" replace />;
  }

  return element;
};

export default ProtectedRoute;
