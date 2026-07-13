/**
 * ProtectedRoute Component
 * 
 * Route wrapper that enforces user authentication requirements.
 * Redirects unauthenticated users to a fallback path and shows loading
 * state while checking authentication status.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { LoadingSpinner } from './index';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * ProtectedRoute component that guards routes requiring authentication.
 * @param children - Components to render when user is authenticated
 * @param fallbackPath - Path to redirect to when user is not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallbackPath = '/' 
}) => {
  const { user, loading } = useUser();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner message="Loading account" />;
  }

  // If not authenticated, don't render children
  if (!user) {
    return <Navigate replace to={fallbackPath} />;
  }

  // If authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
