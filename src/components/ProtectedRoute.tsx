import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { logger } from '../utils/logger';
import adminAuthService from '../services/authService';
import { canAccessRoute, resolveUiRole, DEFAULT_ROUTE } from '../config/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('admin_token');
      const adminUser = sessionStorage.getItem('admin_user');

      logger.log('🔐 [ProtectedRoute] Checking auth:', {
        hasToken: !!token,
        hasUser: !!adminUser,
        path: location.pathname
      });

      const authenticated = !!(token && adminUser);
      setIsAuthenticated(authenticated);
      setIsVerifying(false);

      if (!authenticated) {
        logger.log('❌ [ProtectedRoute] Not authenticated, will redirect to login');
      } else {
        logger.log('✅ [ProtectedRoute] Authenticated, showing protected content');
      }
    };

    // Small delay to ensure sessionStorage is fully ready
    const timer = setTimeout(checkAuth, 50);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentAdmin = adminAuthService.getCurrentAdmin();
  const role = resolveUiRole(currentAdmin);

  if (!canAccessRoute(role, location.pathname)) {
    logger.log(`⛔ [ProtectedRoute] Role "${role}" cannot access ${location.pathname}, redirecting`);
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
