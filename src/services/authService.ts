import adminApiClient from './apiClient';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  admin: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export const adminAuthService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('🔐 [AuthService] Attempting admin login');
      const response = await adminApiClient.post<any>('/auth/admin/login', {
        email,
        password,
      });

      console.log('🔐 [AuthService] Login response:', { keys: Object.keys(response) });

      // Handle both 'accessToken' and 'token' fields
      const token = response.accessToken || response.token || response.access_token;
      
      if (token) {
        console.log('🔐 [AuthService] Found token, saving...');
        adminApiClient.setToken(token);
        
        // Store admin user data
        const adminData = response.admin || response.user || response.data?.admin || {};
        localStorage.setItem('admin_user', JSON.stringify(adminData));
        
        // Verify token was saved
        const savedToken = localStorage.getItem('admin_token');
        console.log('✅ [AuthService] Login successful, token saved:', { tokenExists: !!savedToken });
        
        return {
          accessToken: token,
          admin: adminData,
        };
      } else {
        console.error('❌ [AuthService] No token in response:', response);
        throw new Error('No access token in login response');
      }
    } catch (error: any) {
      console.error('❌ [AuthService] Login failed:', error);
      throw error;
    }
  },

  /**
   * Logout
   */
  logout(): void {
    try {
      console.log('🚪 [AuthService] Logging out');
      adminApiClient.clearToken();
      localStorage.removeItem('admin_user');
      console.log('✅ [AuthService] Logout successful');
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
    const userStr = localStorage.getItem('admin_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verify token is valid
   */
  async verifyToken(): Promise<boolean> {
    try {
      if (!adminApiClient.isAuthenticated()) {
        console.log('⚠️ [AuthService] No token found during verification');
        return false;
      }

      // Try to fetch admin profile to verify token
      console.log('🔐 [AuthService] Verifying token with backend...');
      const admin = await adminApiClient.get('/auth/admin/profile');
      console.log('✅ [AuthService] Token verification successful');
      if (admin) {
        localStorage.setItem('admin_user', JSON.stringify(admin));
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
