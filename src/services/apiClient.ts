import { API_CONFIG } from '../config/apiConfig';

class AdminApiClient {
  private baseURL: string;
  private token: string | null = null;
  private maxRetries = 2;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.loadToken();
  }

  /**
   * Retry a fetch with exponential backoff on 429 errors
   */
  private async fetchWithRetry(url: string, options: RequestInit, retries = this.maxRetries): Promise<Response> {
    const response = await fetch(url, options);
    if (response.status === 429 && retries > 0) {
      const delay = (this.maxRetries - retries + 1) * 1000; // 1s, 2s backoff
      console.warn(`⚠️ [AdminAPI] 429 rate limited, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.fetchWithRetry(url, options, retries - 1);
    }
    return response;
  }

  /**
   * Load token from sessionStorage
   */
  private loadToken(): void {
    this.token = sessionStorage.getItem('admin_token');
  }

  /**
   * Save token to sessionStorage
   */
  public setToken(token: string): void {
    this.token = token;
    sessionStorage.setItem('admin_token', token);
  }

  /**
   * Clear token from sessionStorage
   */
  public clearToken(): void {
    this.token = null;
    sessionStorage.removeItem('admin_token');
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      ...API_CONFIG.HEADERS,
    };

    if (this.token) {
      (headers as any)['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make a GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    try {
      // Reload token before each request in case it was updated
      this.loadToken();
      const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          sessionStorage.removeItem('admin_user');
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            sessionStorage.setItem('session_expired', '1');
            window.location.href = '/login';
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ [AdminAPI] GET ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      // Reload token before each request in case it was updated
      this.loadToken();
      const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          sessionStorage.removeItem('admin_user');
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            sessionStorage.setItem('session_expired', '1');
            window.location.href = '/login';
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error(`❌ [AdminAPI] POST ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    try {
      // Reload token before each request in case it was updated
      this.loadToken();
      const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          sessionStorage.removeItem('admin_user');
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            sessionStorage.setItem('session_expired', '1');
            window.location.href = '/login';
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error(`❌ [AdminAPI] PATCH ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      // Reload token before each request in case it was updated
      this.loadToken();
      const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          sessionStorage.removeItem('admin_user');
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            sessionStorage.setItem('session_expired', '1');
            window.location.href = '/login';
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error(`❌ [AdminAPI] PUT ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    try {
      // Reload token before each request in case it was updated
      this.loadToken();
      const response = await this.fetchWithRetry(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          sessionStorage.removeItem('admin_user');
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            sessionStorage.setItem('session_expired', '1');
            window.location.href = '/login';
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`❌ [AdminAPI] DELETE ${endpoint} failed:`, error);
      throw error;
    }
  }

  /**
   * Check if admin is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Get current token
   */
  public getToken(): string | null {
    return this.token;
  }
}

export const adminApiClient = new AdminApiClient();
export default adminApiClient;
