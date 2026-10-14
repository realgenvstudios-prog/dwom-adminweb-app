import { useState } from "react";
import type { Order } from "../OrderTypes";
import ordersService from "../../../services/ordersService";
import workersService, { type Worker } from "../../../services/workersService";
import { logger } from '../../../utils/logger';

// The picker-assignment modal's own data fetch + assign action, mirroring
// useRiderAssignment exactly — same shape, same loading/error handling.
// Takes loading/setLoading from the caller — see useOrderStatusActions.
export function useWorkerAssignment(
  order: Order | null,
  onOrderUpdated: ((updatedOrder: Partial<Order>) => void) | undefined,
  setLoading: (loading: boolean) => void,
) {
  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);

  const openPickerModal = async () => {
    setPickerModalOpen(true);
    setWorkersLoading(true);
    try {
      const workers = await workersService.getAll();
      setAvailableWorkers(workers.filter((w) => w.active));
    } catch (error) {
      logger.error('❌ [OrderDetailsDrawer] Failed to fetch workers:', error);
      setAvailableWorkers([]);
    } finally {
      setWorkersLoading(false);
    }
  };

  const handleAssignWorker = async () => {
    if (!order || !selectedWorkerId) return;

    try {
      setLoading(true);
      await ordersService.assignPicker(parseInt(order.id), selectedWorkerId);

      const assignedWorker = availableWorkers.find((w) => w.id === selectedWorkerId);
      onOrderUpdated?.({
        picker: assignedWorker ? { id: String(assignedWorker.id), name: assignedWorker.name } : null,
      });
      setPickerModalOpen(false);
      setSelectedWorkerId(null);
    } catch (error) {
      logger.error('❌ [OrderDetailsDrawer] Failed to assign picker:', error);
      alert('Failed to assign picker');
    } finally {
      setLoading(false);
    }
  };

  return {
    pickerModalOpen,
    setPickerModalOpen,
    availableWorkers,
    workersLoading,
    selectedWorkerId,
    setSelectedWorkerId,
    openPickerModal,
    handleAssignWorker,
  };
}
