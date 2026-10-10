import { useState } from "react";
import type { RiderData } from "../../services/ridersService";

// Search/sort/status filtering of the riders list. Split out of the
// former monolithic RidersPage.
export function useRidersFilters(riders: RiderData[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredRiders = riders
    .filter((rider) => {
      const matchesSearch =
        rider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rider.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all"
          ? true
          : filterStatus === "active"
          ? rider.isActive
          : !rider.isActive;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "earnings":
          return b.totalEarnings - a.totalEarnings;
        case "rating":
          return b.rating - a.rating;
        case "deliveries":
          return b.totalDeliveries - a.totalDeliveries;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  return { searchQuery, setSearchQuery, sortBy, setSortBy, filterStatus, setFilterStatus, filteredRiders };
}
