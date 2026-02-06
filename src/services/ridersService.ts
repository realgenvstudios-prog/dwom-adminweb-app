const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dwom-backend.onrender.com';

export interface RiderData {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  licenseNumber: string;
  zone: string;
  zoneId: number;
  status: 'offline' | 'available' | 'busy' | 'on_delivery';
  isActive: boolean;
  bankAccount?: string;
  accountName?: string;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  currentLat?: number;
  currentLng?: number;
  createdAt: string;
  activeOrders: number;
}

export interface Zone {
  id: number;
  name: string;
  code: string;
  deliveryFee: number;
  estimatedTime: number;
  isActive: boolean;
}

export interface UpdateRiderStatusDto {
  status: 'offline' | 'available' | 'busy' | 'on_delivery';
}

export interface CreateRiderDto {
  userId: number;
  zoneId: number;
  vehicleType: string;
  licenseNumber: string;
  bankAccount?: string;
  accountName?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

class RidersService {
  /**
   * Get all riders for admin
   */
  async getAllRiders(): Promise<RiderData[]> {
    try {
      console.log('🚴 [RidersService] Fetching all riders');
      const response = await fetch(`${API_BASE_URL}/riders/admin/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch riders: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [RidersService] Riders fetched:', data.length);
      return data;
    } catch (error: any) {
      console.error('❌ [RidersService] Failed to fetch riders:', error);
      throw error;
    }
  }

  /**
   * Get all zones
   */
  async getAllZones(): Promise<Zone[]> {
    try {
      console.log('🗺️ [RidersService] Fetching all zones');
      const response = await fetch(`${API_BASE_URL}/riders/zones`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch zones: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [RidersService] Zones fetched:', data.length);
      return data;
    } catch (error: any) {
      console.error('❌ [RidersService] Failed to fetch zones:', error);
      throw error;
    }
  }

  /**
   * Create a new zone
   */
  async createZone(dto: { name: string; description?: string; lat: number; lng: number; radius: number; deliveryFee?: number }): Promise<Zone> {
    try {
      console.log('🗺️ [RidersService] Creating new zone');
      const response = await fetch(`${API_BASE_URL}/riders/zones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create zone: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [RidersService] Zone created successfully');
      return data;
    } catch (error: any) {
      console.error('❌ [RidersService] Failed to create zone:', error);
      throw error;
    }
  }

  /**
   * Update rider status (offline, available, busy, on_delivery)
   */
  async updateRiderStatus(riderId: number, status: string): Promise<RiderData> {
    try {
      console.log(`🚴 [RidersService] Updating rider ${riderId} status to ${status}`);
      const response = await fetch(`${API_BASE_URL}/riders/admin/${riderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update rider status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [RidersService] Rider ${riderId} status updated to ${status}`);
      return data;
    } catch (error: any) {
      console.error(`❌ [RidersService] Failed to update rider status:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a rider
   */
  async deactivateRider(riderId: number): Promise<RiderData> {
    try {
      console.log(`🚴 [RidersService] Deactivating rider ${riderId}`);
      const response = await fetch(`${API_BASE_URL}/riders/admin/${riderId}/deactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to deactivate rider: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [RidersService] Rider ${riderId} deactivated`);
      return data;
    } catch (error: any) {
      console.error(`❌ [RidersService] Failed to deactivate rider:`, error);
      throw error;
    }
  }

  /**
   * Register a new rider
   */
  async registerRider(dto: CreateRiderDto): Promise<RiderData> {
    try {
      console.log(`🚴 [RidersService] Registering new rider`);
      const response = await fetch(`${API_BASE_URL}/riders/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        throw new Error(`Failed to register rider: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [RidersService] Rider registered successfully`);
      return data;
    } catch (error: any) {
      console.error(`❌ [RidersService] Failed to register rider:`, error);
      throw error;
    }
  }

  /**
   * Create a new rider as admin (simplified flow)
   */
  async createRiderAdmin(dto: { name: string; phone: string; email?: string; vehicleType: string; licenseNumber?: string }): Promise<RiderData> {
    try {
      console.log(`🚴 [RidersService] Creating new rider as admin`);
      const response = await fetch(`${API_BASE_URL}/riders/admin/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to create rider: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [RidersService] Rider created successfully`);
      return data;
    } catch (error: any) {
      console.error(`❌ [RidersService] Failed to create rider:`, error);
      throw error;
    }
  }

  /**
   * Get all users (for rider registration dropdown)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      console.log('👤 [RidersService] Fetching all users');
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ [RidersService] Users fetched:', data.length);
      return data;
    } catch (error: any) {
      console.error('❌ [RidersService] Failed to fetch users:', error);
      throw error;
    }
  }

  /**
   * Reactivate a rider
   */
  async reactivateRider(riderId: number): Promise<RiderData> {
    try {
      console.log(`🚴 [RidersService] Reactivating rider ${riderId}`);
      const response = await fetch(`${API_BASE_URL}/riders/admin/${riderId}/reactivate`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to reactivate rider: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [RidersService] Rider ${riderId} reactivated`);
      return data;
    } catch (error: any) {
      console.error(`❌ [RidersService] Failed to reactivate rider:`, error);
      throw error;
    }
  }

  /**
   * Assign rider to a zone
   */
  async assignZone(riderId: number, zoneId: number): Promise<RiderData> {
    try {
      console.log(`🗺️ [RidersService] Assigning rider ${riderId} to zone ${zoneId}`);
      const response = await fetch(`${API_BASE_URL}/riders/admin/${riderId}/zone`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify({ zoneId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to assign zone: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ [RidersService] Rider ${riderId} assigned to zone ${zoneId}`);
      return data;
    } catch (error: any) {
      console.error(`❌ [RidersService] Failed to assign zone:`, error);
      throw error;
    }
  }
}

export default new RidersService();
