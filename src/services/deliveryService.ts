const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dwom-backend.onrender.com';

export interface DeliveryZone {
  id: number;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  radius: number; // in km
  deliveryFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  Rider?: { id: number }[]; // count of active riders in zone
}

export interface DeliveryCheckResult {
  deliverable: boolean;
  zone?: {
    id: number;
    name: string;
    description?: string;
    deliveryFee: number;
  };
  deliveryFee?: number;
  message: string;
}

const deliveryService = {
  /**
   * Get all delivery zones (active + inactive) for admin management
   */
  async getAllZones(): Promise<DeliveryZone[]> {
    try {
      console.log('🗺️ [DeliveryService] Fetching all delivery zones');
      const response = await fetch(`${API_BASE_URL}/delivery/zones`, {
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
      console.log('✅ [DeliveryService] Zones fetched:', data.length);
      return data;
    } catch (error: any) {
      console.error('❌ [DeliveryService] Failed to fetch zones:', error);
      throw error;
    }
  },

  /**
   * Update a delivery zone
   */
  async updateZone(zoneId: number, data: Partial<DeliveryZone>): Promise<DeliveryZone> {
    try {
      console.log(`🗺️ [DeliveryService] Updating zone ${zoneId}`);
      const response = await fetch(`${API_BASE_URL}/delivery/zones/${zoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update zone: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [DeliveryService] Zone updated');
      return result;
    } catch (error: any) {
      console.error('❌ [DeliveryService] Failed to update zone:', error);
      throw error;
    }
  },

  /**
   * Toggle zone active/disabled
   */
  async toggleZone(zoneId: number): Promise<DeliveryZone> {
    try {
      console.log(`🗺️ [DeliveryService] Toggling zone ${zoneId}`);
      const response = await fetch(`${API_BASE_URL}/delivery/zones/${zoneId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to toggle zone: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [DeliveryService] Zone toggled');
      return result;
    } catch (error: any) {
      console.error('❌ [DeliveryService] Failed to toggle zone:', error);
      throw error;
    }
  },

  /**
   * Delete a delivery zone
   */
  async deleteZone(zoneId: number): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗺️ [DeliveryService] Deleting zone ${zoneId}`);
      const response = await fetch(`${API_BASE_URL}/delivery/zones/${zoneId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to delete zone: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [DeliveryService] Zone deleted');
      return result;
    } catch (error: any) {
      console.error('❌ [DeliveryService] Failed to delete zone:', error);
      throw error;
    }
  },

  /**
   * Check delivery availability for a location
   */
  async checkDelivery(lat: number, lng: number): Promise<DeliveryCheckResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/check?lat=${lat}&lng=${lng}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to check delivery: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ [DeliveryService] Failed to check delivery:', error);
      throw error;
    }
  },
};

export default deliveryService;
