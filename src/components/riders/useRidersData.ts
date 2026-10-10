import { useEffect, useState } from "react";
import ridersService from "../../services/ridersService";
import type { RiderData, Zone } from "../../services/ridersService";

// Fetches riders + zones, and owns the status/deactivate/reactivate
// actions. Split out of the former monolithic RidersPage.
export function useRidersData() {
  const [riders, setRiders] = useState<RiderData[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🚴 [RidersPage] Fetching riders and zones");

      const [ridersData, zonesData] = await Promise.all([
        ridersService.getAllRiders(),
        ridersService.getAllZones(),
      ]);

      console.log("✅ [RidersPage] Data loaded");
      setRiders(ridersData || []);
      setZones(zonesData || []);
    } catch (err: any) {
      console.error("❌ [RidersPage] Failed to fetch data:", err);
      setError(err.message || "Failed to load riders data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (rider: RiderData, newStatus: string) => {
    try {
      await ridersService.updateRiderStatus(rider.id, newStatus);
      setRiders(
        riders.map((r) =>
          r.id === rider.id ? { ...r, status: newStatus as any } : r
        )
      );
    } catch (err: any) {
      console.error("Failed to update status:", err);
      alert("Failed to update rider status");
    }
  };

  const handleDeactivate = async (rider: RiderData) => {
    if (
      !window.confirm(`Are you sure you want to deactivate ${rider.name}?`)
    ) {
      return;
    }

    try {
      await ridersService.deactivateRider(rider.id);
      setRiders(
        riders.map((r) =>
          r.id === rider.id ? { ...r, isActive: false, status: "offline" } : r
        )
      );
    } catch (err: any) {
      console.error("Failed to deactivate rider:", err);
      alert("Failed to deactivate rider");
    }
  };

  const handleReactivate = async (rider: RiderData) => {
    if (
      !window.confirm(`Are you sure you want to reactivate ${rider.name}?`)
    ) {
      return;
    }

    try {
      await ridersService.reactivateRider(rider.id);
      setRiders(
        riders.map((r) =>
          r.id === rider.id ? { ...r, isActive: true, status: "available" } : r
        )
      );
    } catch (err: any) {
      console.error("Failed to reactivate rider:", err);
      alert("Failed to reactivate rider");
    }
  };

  return { riders, zones, loading, error, fetchData, handleStatusChange, handleDeactivate, handleReactivate };
}
