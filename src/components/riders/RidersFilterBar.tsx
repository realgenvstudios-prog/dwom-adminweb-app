import React from "react";

interface RidersFilterBarProps {
  dateRange: string;
  zone: string;
  status: string;
  search: string;
  zones: string[];
  onChange: (filters: { dateRange: string; zone: string; status: string; search: string }) => void;
}

const dateOptions = ["Today", "Last 7 days", "Last 30 days"];
const statusOptions = ["All", "Online", "On Delivery", "Offline"];

const RidersFilterBar: React.FC<RidersFilterBarProps> = ({ dateRange, zone, status, search, zones, onChange }) => (
  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center mb-4">
    <select className="border rounded-lg px-4 py-2 min-w-[140px] text-base" value={dateRange} onChange={e => onChange({ dateRange: e.target.value, zone, status, search })}>
      {dateOptions.map(opt => <option key={opt}>{opt}</option>)}
    </select>
    <select className="border rounded-lg px-4 py-2 min-w-[140px] text-base" value={zone} onChange={e => onChange({ dateRange, zone: e.target.value, status, search })}>
      <option value="All">All Zones</option>
      {zones.map(z => <option key={z}>{z}</option>)}
    </select>
    <select className="border rounded-lg px-4 py-2 min-w-[140px] text-base" value={status} onChange={e => onChange({ dateRange, zone, status: e.target.value, search })}>
      {statusOptions.map(opt => <option key={opt}>{opt}</option>)}
    </select>
    <input className="border rounded-lg px-4 py-2 min-w-[200px] flex-1 text-base" placeholder="Search by name or phone…" value={search} onChange={e => onChange({ dateRange, zone, status, search: e.target.value })} />
  </div>
);

export default RidersFilterBar;
