import adminApiClient from './apiClient';
// import { supabase } from './supabaseClient'; // Disabled - using hardcoded login for now

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
   * Ensure the current Supabase session token is mirrored into adminApiClient/sessionStorage.
   * (Disabled for now - using hardcoded login instead)
   */
  async syncTokenFromSupabase(): Promise<string | null> {
    // const { data } = await supabase.auth.getSession();
    // const token = data.session?.access_token || null;
    // if (token) {
    //   adminApiClient.setToken(token);
    // } else {
    //   adminApiClient.clearToken();
    //   sessionStorage.removeItem('admin_user');
    // }
    return null;
  },

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
      const message = response.status === 401
        ? 'Invalid email or password'
        : `Login failed (server returned ${response.status})`;
      console.error('❌ [AuthService] Login failed:', message);
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
      throw new Error(body.message || `This invite link is invalid or has expired (server returned ${response.status})`);
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
   * Alternative Supabase login (commented out for now)
   */
  async loginWithSupabase(_email: string, _password: string): Promise<AuthResponse> {
    // try {
    //   console.log('🔐 [AuthService] Signing in with Supabase (email/password)');
    //   const { data, error } = await supabase.auth.signInWithPassword({
    //     email,
    //     password,
    //   });

    //   if (error) {
    //     throw new Error(error.message);
    //   }

    //   const token = data.session?.access_token;
    //   if (!token) {
    //     throw new Error('Supabase login did not return an access token');
    //   }

    //   adminApiClient.setToken(token);

    //   // Fetch admin profile from backend (ensures this Supabase account is authorized as admin)
    //   const admin = (await adminApiClient.get<any>('/auth/admin/profile')) as any;
    //   sessionStorage.setItem('admin_user', JSON.stringify(admin));

    //   return {
    //     accessToken: token,
    //     admin,
    //   };
    // } catch (error: any) {
    //   console.error('❌ [AuthService] Supabase login failed:', error);
    //   throw error;
    // }
    throw new Error('Supabase login disabled - use login() instead');
  },

  /**
   * Logout
   */
  logout(): void {
    try {
      // Logout from Supabase (if enabled in the future)
      // supabase.auth.signOut().catch(() => undefined);
      adminApiClient.clearToken();
      sessionStorage.removeItem('admin_user');
    } catch (error) {
      console.error('❌ [AuthService] Logout failed:', error);
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
  getCurrentAdmin(): any {
    const userStr = sessionStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verify token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      await this.syncTokenFromSupabase();
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
      console.error('⚠️ [AuthService] Token verification failed:', error);
      // Don't clear token here - let the caller decide what to do
      // This allows for temporary backend failures without logging users out
      throw error;
    }
  },
};

export default adminAuthService;
