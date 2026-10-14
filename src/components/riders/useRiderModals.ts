import { useState } from "react";
import type { RiderData } from "../../services/ridersService";

// The 3 rider-related modals' visibility + selection state. Split out of
// the former monolithic RidersPage. Takes fetchData from useRidersData
// since a successful create/zone-assign action refreshes the list.
// Zone CRUD itself lives on the Field Operations page's Zones tab, not a
// modal here anymore.
export function useRiderModals(fetchData: () => Promise<void>) {
  const [isCreateRiderModalOpen, setIsCreateRiderModalOpen] = useState(false);
  const [isAssignZoneModalOpen, setIsAssignZoneModalOpen] = useState(false);
  const [selectedRiderForZone, setSelectedRiderForZone] = useState<RiderData | null>(null);
  const [isRiderDetailsOpen, setIsRiderDetailsOpen] = useState(false);
  const [selectedRiderForDetails, setSelectedRiderForDetails] = useState<RiderData | null>(null);

  const handleViewDetails = (rider: RiderData) => {
    setSelectedRiderForDetails(rider);
    setIsRiderDetailsOpen(true);
  };

  const handleCreateRider = () => {
    setIsCreateRiderModalOpen(true);
  };

  const handleAssignZone = (rider: RiderData) => {
    setSelectedRiderForZone(rider);
    setIsAssignZoneModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchData();
  };

  return {
    isCreateRiderModalOpen,
    setIsCreateRiderModalOpen,
    isAssignZoneModalOpen,
    setIsAssignZoneModalOpen,
    selectedRiderForZone,
    isRiderDetailsOpen,
    setIsRiderDetailsOpen,
    selectedRiderForDetails,
    handleViewDetails,
    handleCreateRider,
    handleAssignZone,
    handleModalSuccess,
  };
}
