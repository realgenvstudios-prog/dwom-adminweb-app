import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

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
  /** 'approved' for working riders; anything else is still an application. */
  approvalStatus?: string;
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
      return await adminApiClient.get<RiderData[]>('/riders/admin/all');
    } catch (error) {
      logger.error('❌ [RidersService] Failed to fetch riders:', error);
      throw error;
    }
  }

  /**
   * Get all zones
   */
  async getAllZones(): Promise<Zone[]> {
    try {
      return await adminApiClient.get<Zone[]>('/riders/zones');
    } catch (error) {
      logger.error('❌ [RidersService] Failed to fetch zones:', error);
      throw error;
    }
  }

  /**
   * Create a new zone
   */
  async createZone(dto: { name: string; description?: string; lat: number; lng: number; radius: number; deliveryFee?: number; polygon?: { lat: number; lng: number }[] }): Promise<Zone> {
    try {
      return await adminApiClient.post<Zone>('/riders/zones', dto);
    } catch (error) {
      logger.error('❌ [RidersService] Failed to create zone:', error);
      throw error;
    }
  }

  /**
   * Update rider status (offline, available, busy, on_delivery)
   */
  async updateRiderStatus(riderId: number, status: string): Promise<RiderData> {
    try {
      return await adminApiClient.patch<RiderData>(`/riders/admin/${riderId}/status`, { status });
    } catch (error) {
      logger.error(`❌ [RidersService] Failed to update rider status:`, error);
      throw error;
    }
  }

  /**
   * Deactivate a rider
   */
  async deactivateRider(riderId: number): Promise<RiderData> {
    try {
      return await adminApiClient.patch<RiderData>(`/riders/admin/${riderId}/deactivate`);
    } catch (error) {
      logger.error(`❌ [RidersService] Failed to deactivate rider:`, error);
      throw error;
    }
  }

  /**
   * Register a new rider
   */
  async registerRider(dto: CreateRiderDto): Promise<RiderData> {
    try {
      return await adminApiClient.post<RiderData>('/riders/register', dto);
    } catch (error) {
      logger.error(`❌ [RidersService] Failed to register rider:`, error);
      throw error;
    }
  }

  /**
   * Create a new rider as admin (simplified flow)
   */
  async createRiderAdmin(dto: { name: string; phone: string; email?: string; vehicleType: string; licenseNumber?: string }): Promise<RiderData> {
    try {
      return await adminApiClient.post<RiderData>('/riders/admin/create', dto);
    } catch (error) {
      logger.error(`❌ [RidersService] Failed to create rider:`, error);
      throw error;
    }
  }

  /**
   * Get all users (for rider registration dropdown)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      return await adminApiClient.get<User[]>('/users');
    } catch (error) {
      logger.error('❌ [RidersService] Failed to fetch users:', error);
      throw error;
    }
  }

  /**
   * Reactivate a rider
   */
  async reactivateRider(riderId: number): Promise<RiderData> {
    try {
      return await adminApiClient.patch<RiderData>(`/riders/admin/${riderId}/reactivate`);
    } catch (error) {
      logger.error(`❌ [RidersService] Failed to reactivate rider:`, error);
      throw error;
    }
  }

  /**
   * Assign rider to a zone
   */
  async assignZone(riderId: number, zoneId: number): Promise<RiderData> {
    try {
      return await adminApiClient.patch<RiderData>(`/riders/admin/${riderId}/zone`, { zoneId });
    } catch (error) {
      logger.error(`❌ [RidersService] Failed to assign zone:`, error);
      throw error;
    }
  }
}

export default new RidersService();
