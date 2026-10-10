interface RidersFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
}

export default function RidersFilterBar({ searchQuery, setSearchQuery, sortBy, setSortBy, filterStatus, setFilterStatus }: RidersFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <input
        type="text"
        placeholder="Search by name, phone, or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="name">Sort by Name</option>
        <option value="earnings">Sort by Earnings</option>
        <option value="rating">Sort by Rating</option>
        <option value="deliveries">Sort by Deliveries</option>
        <option value="status">Sort by Status</option>
      </select>
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All Riders</option>
        <option value="active">Active Only</option>
        <option value="inactive">Inactive Only</option>
      </select>
    </div>
  );
}
