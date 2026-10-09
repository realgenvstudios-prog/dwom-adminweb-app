const STATUS_OPTIONS = ["All", "New", "Active", "At Risk", "Churned"];

interface CustomersFilterBarProps {
  search: string;
  setSearch: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
}

export default function CustomersFilterBar({ search, setSearch, selectedStatus, setSelectedStatus }: CustomersFilterBarProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by name, email, phone, or ID..."
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                selectedStatus === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setSelectedStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
