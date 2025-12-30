import React from "react";
import type { OrdersFilterState, RiderSummary, OrderStatus, PaymentStatus } from "./OrderTypes";

interface Props {
  filter: OrdersFilterState;
  onChange: (f: Partial<OrdersFilterState>) => void;
  zones: string[];
  riders: RiderSummary[];
}

const statusOptions: (OrderStatus | "All")[] = ["All", "Pending", "Preparing", "Ready", "On the way", "Delivered", "Canceled"];
const paymentOptions: (PaymentStatus | "All")[] = ["All", "Paid", "Pending", "Failed"];

const OrdersFiltersBar: React.FC<Props> = ({ filter, onChange, zones, riders }) => (
  <div className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-2 flex flex-wrap gap-3 items-center mb-4">
    {/* Date Range Picker (stub) */}
    <input
      type="date"
      className="border rounded px-2 py-1 text-sm"
      value={filter.dateRange[0]}
      onChange={e => onChange({ dateRange: [e.target.value, filter.dateRange[1]] })}
    />
    <span className="mx-1 text-gray-400">–</span>
    <input
      type="date"
      className="border rounded px-2 py-1 text-sm"
      value={filter.dateRange[1]}
      onChange={e => onChange({ dateRange: [filter.dateRange[0], e.target.value] })}
    />
    {/* Status */}
    <select
      className="border rounded px-2 py-1 text-sm"
      value={filter.status}
      onChange={e => onChange({ status: e.target.value as OrdersFilterState["status"] })}
    >
      {statusOptions.map(s => <option key={s}>{s}</option>)}
    </select>
    {/* Payment Status */}
    <select
      className="border rounded px-2 py-1 text-sm"
      value={filter.paymentStatus}
      onChange={e => onChange({ paymentStatus: e.target.value as OrdersFilterState["paymentStatus"] })}
    >
      {paymentOptions.map(s => <option key={s}>{s}</option>)}
    </select>
    {/* Zone */}
    <select
      className="border rounded px-2 py-1 text-sm"
      value={filter.zone}
      onChange={e => onChange({ zone: e.target.value })}
    >
      <option value="All">All Zones</option>
      {zones.map(z => <option key={z}>{z}</option>)}
    </select>
    {/* Rider */}
    <select
      className="border rounded px-2 py-1 text-sm"
      value={filter.rider}
      onChange={e => onChange({ rider: e.target.value })}
    >
      <option value="All">All Riders</option>
      {riders.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
    </select>
    {/* Search */}
    <input
      className="border rounded px-2 py-1 text-sm min-w-[180px] flex-1"
      placeholder="Search by order ID, customer, phone…"
      value={filter.search}
      onChange={e => onChange({ search: e.target.value })}
    />
  </div>
);

export default OrdersFiltersBar;
