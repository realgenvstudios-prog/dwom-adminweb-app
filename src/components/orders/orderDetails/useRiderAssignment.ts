import { useState } from "react";
import type { Order } from "../OrderTypes";
import ordersService from "../../../services/ordersService";
import ridersService, { type RiderData } from "../../../services/ridersService";

// The rider-assignment modal's own data fetch + assign action, local to
// OrderDetailsDrawer (a separate, differently-shaped AssignRiderModal
// component also exists and is used by OrdersTable — this one predates
// unifying them and is out of scope for a structural split). Split out of
// the former monolithic OrderDetailsDrawer. Takes loading/setLoading from
// the caller — see useOrderStatusActions for why.
export function useRiderAssignment(
  order: Order | null,
  onOrderUpdated: ((updatedOrder: Partial<Order>) => void) | undefined,
  setLoading: (loading: boolean) => void,
) {
  const [riderModalOpen, setRiderModalOpen] = useState(false);
  const [availableRiders, setAvailableRiders] = useState<RiderData[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);

  // Fetch available riders when modal opens
  const openRiderModal = async () => {
    setRiderModalOpen(true);
    setRidersLoading(true);
    try {
      console.log('🚴 [OrderDetailsDrawer] Fetching available riders');
      const riders = await ridersService.getAllRiders();
      // Filter to only show active/available riders
      const activeRiders = riders.filter(r => r.isActive);
      setAvailableRiders(activeRiders);
      console.log('✅ [OrderDetailsDrawer] Loaded', activeRiders.length, 'active riders');
    } catch (error) {
      console.error('❌ [OrderDetailsDrawer] Failed to fetch riders:', error);
      setAvailableRiders([]);
    } finally {
      setRidersLoading(false);
    }
  };

  const handleAssignRider = async () => {
    if (!order || !selectedRiderId) return;

    try {
      setLoading(true);
      console.log(`📦 [OrderDetailsDrawer] Assigning rider ${selectedRiderId} to order ${order.id}`);
      await ordersService.assignRider(parseInt(order.id), selectedRiderId);

      const assignedRider = availableRiders.find(r => r.id === selectedRiderId);
      console.log('✅ [OrderDetailsDrawer] Rider assigned');

      onOrderUpdated?.({
        rider: assignedRider ? { id: String(assignedRider.id), name: assignedRider.name } : null
      });
      setRiderModalOpen(false);
      setSelectedRiderId(null);
    } catch (error) {
      console.error('❌ [OrderDetailsDrawer] Failed to assign rider:', error);
      alert('Failed to assign rider');
    } finally {
      setLoading(false);
    }
  };

  return {
    riderModalOpen,
    setRiderModalOpen,
    availableRiders,
    ridersLoading,
    selectedRiderId,
    setSelectedRiderId,
    openRiderModal,
    handleAssignRider,
  };
}
