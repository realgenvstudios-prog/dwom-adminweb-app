interface CouponsFilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  filterStatus: 'all' | 'active' | 'inactive';
  setFilterStatus: (status: 'all' | 'active' | 'inactive') => void;
}

export default function CouponsFilterBar({ search, setSearch, filterStatus, setFilterStatus }: CouponsFilterBarProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 mb-6 flex flex-col sm:flex-row gap-3">
      <input
        className="border rounded-lg px-4 py-2 flex-1 text-sm"
        placeholder="Search by code or description…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <select
        className="border rounded-lg px-4 py-2 text-sm min-w-[140px]"
        value={filterStatus}
        onChange={e => setFilterStatus(e.target.value as any)}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
}
