import { useEffect, useState } from "react";
import deliveryService from "../../services/deliveryService";
import type { DeliveryZone } from "../../services/deliveryService";

// Fetches delivery zones, auto-dismisses success/error banners, and owns
// toggle/delete actions. Split out of the former monolithic
// DeliveryZonesPage.
export function useZonesData() {
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getAllZones();
      setZones(data);
    } catch (err: any) {
      setError("Failed to load delivery zones");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleToggleZone = async (zone: DeliveryZone) => {
    try {
      await deliveryService.toggleZone(zone.id);
      setSuccessMsg(`Zone "${zone.name}" ${zone.isActive ? "disabled" : "enabled"} successfully!`);
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Failed to toggle zone");
    }
  };

  const handleDeleteZone = async (zone: DeliveryZone) => {
    if (!window.confirm(`Are you sure you want to delete zone "${zone.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deliveryService.deleteZone(zone.id);
      setSuccessMsg(`Zone "${zone.name}" deleted successfully!`);
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Failed to delete zone");
    }
  };

  return {
    zones,
    loading,
    error,
    setError,
    successMsg,
    setSuccessMsg,
    fetchZones,
    handleToggleZone,
    handleDeleteZone,
  };
}
