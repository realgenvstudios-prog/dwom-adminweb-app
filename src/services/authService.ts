import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  admin: {
    id: number | string;
    email: string;
    name: string;
    role: string;
    adminRole?: string;
  };
}

export const adminAuthService = {
  /**
   * Login with hardcoded credentials (temporary - works without backend)
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    // Always go through the real backend — it already validates credentials
    // and issues a properly signed JWT. A previous version of this method
    // fabricated an unsigned mock token locally whenever this call failed
    // (network error, CORS, backend 500, etc.) and reported login as
    // "successful" anyway. The backend's auth guard rejects that token on
    // every subsequent request, so any transient failure here used to turn
    // into silent 401s across the entire dashboard, not just this page.
    const backendUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/admin/login`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      // Show the server's reason (e.g. "This admin account is suspended…");
      // the rate limit is 5 attempts per 15 minutes.
      const body = await response.json().catch(() => ({}));
      const serverMessage = typeof body?.message === 'string' ? body.message : '';
      const message =
        response.status === 429
          ? 'Too many sign-in attempts. Wait 15 minutes and try again.'
          : serverMessage || (response.status === 401 ? 'Invalid email or password' : `Sign-in failed (server returned ${response.status})`);
      logger.error('❌ [AuthService] Login failed:', message);
      throw new Error(message);
    }

    const data = await response.json();
    const accessToken = data.access_token || data.accessToken || data.token;
    const admin = data.admin;

    if (!accessToken || !admin) {
      throw new Error('Login response was missing an access token or admin profile');
    }

    adminApiClient.setToken(accessToken);
    sessionStorage.setItem('admin_user', JSON.stringify(admin));

    return { accessToken, admin };
  },
  
  /**
   * Accept an admin invite — sets a password (and phone, for brand-new
   * accounts) and logs straight in, same response shape as login().
   */
  async acceptInvite(token: string, password: string, phone: string): Promise<AuthResponse> {
    const backendUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/admin/accept-invite`;

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, phone }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      if (response.status === 429) throw new Error('Too many attempts. Wait 15 minutes and try again.');
      const m = Array.isArray(body.message) ? body.message.join('. ') : body.message;
      throw new Error(m || `This invite link is invalid or has expired (server returned ${response.status})`);
    }

    const data = await response.json();
    const accessToken = data.accessToken;
    const admin = data.admin;

    if (!accessToken || !admin) {
      throw new Error('Accept-invite response was missing an access token or admin profile');
    }

    adminApiClient.setToken(accessToken);
    sessionStorage.setItem('admin_user', JSON.stringify(admin));

    return { accessToken, admin };
  },

  /**
   * Logout
   */
  logout(): void {
    try {
      adminApiClient.clearToken();
      sessionStorage.removeItem('admin_user');
    } catch (error) {
      logger.error('❌ [AuthService] Logout failed:', error);
    }
  },

  /**
   * Check if admin is authenticated
   */
  isAuthenticated(): boolean {
    return adminApiClient.isAuthenticated();
  },

  /**
   * Get current admin user
   */
  getCurrentAdmin(): AuthResponse['admin'] | null {
    const userStr = sessionStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verify token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      if (!adminApiClient.isAuthenticated()) {
        return false;
      }

      // Try to fetch admin profile to verify token
      const admin = await adminApiClient.get('/auth/admin/profile');
      if (admin) {
        sessionStorage.setItem('admin_user', JSON.stringify(admin));
        return true;
      }
      return false;
    } catch (error) {
      logger.error('⚠️ [AuthService] Token verification failed:', error);
      // Don't clear token here - let the caller decide what to do
      // This allows for temporary backend failures without logging users out
      throw error;
    }
  },
};

export default adminAuthService;
