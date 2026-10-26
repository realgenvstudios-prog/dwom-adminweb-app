import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

export interface DeliveryZone {
  id: number;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  radius: number; // in km (derived from the corners when polygon is set)
  /** Free-form boundary; when present it defines the zone instead of the circle. */
  polygon?: { lat: number; lng: number }[] | null;
  deliveryFee: number;
  /** What a rider earns per delivery here; the default rider pay when empty. */
  riderPay?: number | string | null;
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
      return await adminApiClient.get<DeliveryZone[]>('/delivery/zones');
    } catch (error) {
      logger.error('❌ [DeliveryService] Failed to fetch zones:', error);
      throw error;
    }
  },

  /**
   * Update a delivery zone
   */
  async updateZone(zoneId: number, data: Partial<DeliveryZone>): Promise<DeliveryZone> {
    try {
      return await adminApiClient.patch<DeliveryZone>(`/delivery/zones/${zoneId}`, data);
    } catch (error) {
      logger.error('❌ [DeliveryService] Failed to update zone:', error);
      throw error;
    }
  },

  /**
   * Toggle zone active/disabled
   */
  async toggleZone(zoneId: number): Promise<DeliveryZone> {
    try {
      return await adminApiClient.patch<DeliveryZone>(`/delivery/zones/${zoneId}/toggle`);
    } catch (error) {
      logger.error('❌ [DeliveryService] Failed to toggle zone:', error);
      throw error;
    }
  },

  /**
   * Delete a delivery zone
   */
  async deleteZone(zoneId: number): Promise<{ success: boolean; message: string }> {
    try {
      return await adminApiClient.delete<{ success: boolean; message: string }>(`/delivery/zones/${zoneId}`);
    } catch (error) {
      logger.error('❌ [DeliveryService] Failed to delete zone:', error);
      throw error;
    }
  },

  /**
   * Check delivery availability for a location
   */
  async checkDelivery(lat: number, lng: number): Promise<DeliveryCheckResult> {
    try {
      return await adminApiClient.get<DeliveryCheckResult>(`/delivery/check?lat=${lat}&lng=${lng}`);
    } catch (error) {
      logger.error('❌ [DeliveryService] Failed to check delivery:', error);
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
      return await adminApiClient.get(`/delivery/geocode/autocomplete?input=${encodeURIComponent(input)}`);
    } catch (error) {
      logger.error('❌ [DeliveryService] Autocomplete failed:', error);
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
      return await adminApiClient.get(`/delivery/geocode/details?placeId=${encodeURIComponent(placeId)}`);
    } catch (error) {
      logger.error('❌ [DeliveryService] Place details failed:', error);
      throw error;
    }
  },
};

export default deliveryService;
