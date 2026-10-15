import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { logger } from '../utils/logger';
import adminAuthService from '../services/authService';
import { canAccessRoute, resolveUiRole, landingRoute } from '../config/permissions';
import { usePermissions } from '@/hooks/use-permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const location = useLocation();
  usePermissions();

  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem('admin_token');
      const adminUser = sessionStorage.getItem('admin_user');

      logger.log('🔐 [ProtectedRoute] Checking auth:', {
        hasToken: !!token,
        hasUser: !!adminUser,
        path: location.pathname,
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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-foreground"></div>
          <p className="text-sm text-muted-foreground">Checking your session…</p>
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
    const landing = landingRoute(role);
    // No page ticked at all: say so rather than redirecting in a loop.
    if (!canAccessRoute(role, landing)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center">
          <div className="max-w-sm space-y-2">
            <p className="text-lg font-semibold">No pages assigned yet</p>
            <p className="text-sm text-muted-foreground">Your account doesn’t have access to any part of the dashboard. Ask a Super Admin to tick the pages you need.</p>
            <button
              type="button"
              className="text-sm underline underline-offset-4"
              onClick={() => {
                adminAuthService.logout();
                window.location.assign('/login');
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      );
    }
    logger.log(`⛔ [ProtectedRoute] Role "${role}" cannot access ${location.pathname}, redirecting`);
    return <Navigate to={landing} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
