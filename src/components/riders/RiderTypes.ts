export type RiderStatus = "Online" | "On Delivery" | "Offline";
export type VehicleType = "Motorbike" | "Car" | "Bicycle";

export interface Rider {
  id: string;
  name: string;
  phone: string;
  zone: string;
  vehicleType: VehicleType;
  status: RiderStatus;
  avatar?: string;
  rating: number;
  lastActive: string;
  deliveriesToday: number;
  earningsToday: number;
  lifetimeDeliveries: number;
  lifetimeEarnings: number;
}

export interface RiderOrder {
  id: string;
  total: number;
  deliveredAt: string;
}

export interface RiderStats {
  totalRiders: number;
  online: number;
  onDelivery: number;
  offline: number;
}

export interface ZoneLoad {
  zone: string;
  riders: number;
  deliveries: number;
}
