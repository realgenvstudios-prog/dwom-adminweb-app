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
      const response = await fetch(`${API_BASE_URL}/delivery/zones`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch zones: ${response.status}`);
      }

      const data = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/delivery/zones/${zoneId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to update zone: ${response.status}`);
      }

      const result = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/delivery/zones/${zoneId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to toggle zone: ${response.status}`);
      }

      const result = await response.json();
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
      const response = await fetch(`${API_BASE_URL}/delivery/zones/${zoneId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Failed to delete zone: ${response.status}`);
      }

      const result = await response.json();
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
          'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
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

  /**
   * Google Places Autocomplete (proxied through backend to avoid CORS)
   */
  async placesAutocomplete(input: string): Promise<{
    status: string;
    predictions: { place_id: string; description: string; main_text: string; secondary_text: string }[];
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/delivery/geocode/autocomplete?input=${encodeURIComponent(input)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Autocomplete failed: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ [DeliveryService] Autocomplete failed:', error);
      throw error;
    }
  },

  /**
   * Google Place Details (proxied through backend to avoid CORS)
   */
  async placeDetails(placeId: string): Promise<{
    status: string;
    result: { name: string; formatted_address: string; lat: number; lng: number } | null;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/delivery/geocode/details?placeId=${encodeURIComponent(placeId)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('admin_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Place details failed: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('❌ [DeliveryService] Place details failed:', error);
      throw error;
    }
  },
};

export default deliveryService;
