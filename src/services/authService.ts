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
    try {
      
      // Hardcoded demo admin credentials
      const DEMO_ADMIN_EMAIL = 'admin@dwom.com';
      const DEMO_ADMIN_PASSWORD = 'test@123';

      if (email !== DEMO_ADMIN_EMAIL || password !== DEMO_ADMIN_PASSWORD) {
        console.error('❌ [AuthService] Invalid credentials');
        throw new Error('Invalid email or password');
      }

      
      // Try to get token from backend, but fall back to local mock if backend fails
      let accessToken: string;
      let admin: AuthResponse['admin'];

      try {
        const backendUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/auth/admin/login`;
        
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          accessToken = data.access_token || data.accessToken || data.token;
          admin = data.admin;
        } else {
          console.warn('⚠️ [AuthService] Backend returned status', response.status, '- using local mock');
          throw new Error(`Backend error: ${response.status}`);
        }
      } catch (backendError: any) {
        
        // Generate a mock JWT token locally using browser btoa
        // Format: header.payload.signature (not validated, just for testing)
        const now = Math.floor(Date.now() / 1000);
        const payload = {
          sub: '1',
          email: DEMO_ADMIN_EMAIL,
          name: 'Admin User',
          iat: now,
          exp: now + 86400, // 24 hours
        };
        
        const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
        const payloadEncoded = btoa(JSON.stringify(payload));
        accessToken = `${header}.${payloadEncoded}.mockSignature`;
        
        admin = {
          id: 1,
          email: DEMO_ADMIN_EMAIL,
          name: 'Admin User',
          role: 'Super Admin',
          adminRole: 'super_admin',
        };
        
      }
      
      // Store the token and user
      adminApiClient.setToken(accessToken);
      sessionStorage.setItem('admin_user', JSON.stringify(admin));
      

      return {
        accessToken,
        admin,
      };
    } catch (error: any) {
      console.error('❌ [AuthService] Login failed:', error.message);
      throw error;
    }
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
