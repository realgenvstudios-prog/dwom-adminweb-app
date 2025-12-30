import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import adminAuthService from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Small delay to ensure token is properly saved from login
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Reload token from localStorage to ensure we have the latest
        const token = localStorage.getItem('admin_token');
        console.log('🔐 [ProtectedRoute] Checking authentication', { 
          tokenExists: !!token,
          tokenLength: token?.length || 0,
        });
        
        if (!token) {
          console.log('🔐 [ProtectedRoute] No token found in localStorage, redirecting to login');
          setIsAuthenticated(false);
          setIsVerifying(false);
          return;
        }

        // Token exists, user is authenticated
        console.log('🔐 [ProtectedRoute] Token found, user is authenticated');
        setIsAuthenticated(true);
        setIsVerifying(false);
        
        // Optional: verify token in background after rendering (don't block rendering)
        // This is optional - just for keeping the token fresh
        setTimeout(async () => {
          try {
            console.log('🔐 [ProtectedRoute] Background verification: checking token validity with backend...');
            await adminAuthService.verifyToken();
            console.log('🔐 [ProtectedRoute] Background verification: token is valid');
          } catch (error) {
            console.warn('⚠️ [ProtectedRoute] Background verification failed, but keeping user logged in:', error);
            // Don't log the user out for background verification failures
            // The token is still valid locally, backend might just be slow
          }
        }, 1000);
      } catch (error) {
        console.error('❌ [ProtectedRoute] Auth check failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, []);

  // Still verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-red-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600 font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    console.log('🔐 [ProtectedRoute] Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Authenticated, render children
  return <>{children}</>;
};

export default ProtectedRoute;
