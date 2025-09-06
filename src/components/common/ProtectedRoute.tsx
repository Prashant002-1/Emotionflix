/**
 * ProtectedRoute Component
 * 
 * Route wrapper that enforces user authentication requirements.
 * Redirects unauthenticated users to a fallback path and shows loading
 * state while checking authentication status.
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate(fallbackPath, { replace: true });
    }
  }, [user, loading, navigate, fallbackPath]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner message="Loading..." />
      </div>
    );
  }

  // If not authenticated, don't render children
  if (!user) {
    return null;
  }

  // If authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
