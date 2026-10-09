interface CustomersStatsCardsProps {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
}

export default function CustomersStatsCards({ totalCustomers, newCustomers, activeCustomers, totalRevenue }: CustomersStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="text-sm font-medium text-gray-500">Total Customers</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">{totalCustomers}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="text-sm font-medium text-gray-500">New Customers</div>
        <div className="text-3xl font-bold text-blue-600 mt-1">{newCustomers}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="text-sm font-medium text-gray-500">Active Customers</div>
        <div className="text-3xl font-bold text-green-600 mt-1">{activeCustomers}</div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="text-sm font-medium text-gray-500">Total Revenue</div>
        <div className="text-3xl font-bold text-gray-900 mt-1">GHS {totalRevenue.toLocaleString()}</div>
      </div>
    </div>
  );
}
