import type { Customer } from "./CustomerTypes";
import { statusColors, formatDate } from "./CustomerTypes";

interface CustomersTableProps {
  filtered: Customer[];
  totalCustomers: number;
  selectedCustomerId: number | undefined;
  onSelectCustomer: (customer: Customer) => void;
}

// The customer list table. Split out of the former monolithic
// CustomersPage.
export default function CustomersTable({ filtered, totalCustomers, selectedCustomerId, onSelectCustomer }: CustomersTableProps) {
  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="text-gray-400 text-5xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No customers found</h3>
        <p className="text-gray-500 text-sm">
          {totalCustomers === 0
            ? "Customers will appear here as they sign up"
            : "Try adjusting your search or filters"}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            <th className="px-4 py-3 font-medium text-gray-600">Customer</th>
            <th className="px-4 py-3 font-medium text-gray-600">Contact</th>
            <th className="px-4 py-3 font-medium text-gray-600">Orders</th>
            <th className="px-4 py-3 font-medium text-gray-600">Joined</th>
            <th className="px-4 py-3 font-medium text-gray-600">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filtered.map((customer) => (
            <tr
              key={customer.id}
              className={`hover:bg-blue-50 cursor-pointer transition ${
                selectedCustomerId === customer.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => onSelectCustomer(customer)}
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-500">ID: {customer.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="text-gray-900">{customer.phone}</div>
                <div className="text-xs text-gray-500">{customer.email || 'No email'}</div>
              </td>
              <td className="px-4 py-4">
                <div className="font-medium text-gray-900">{customer.totalOrders}</div>
                <div className="text-xs text-gray-500">GHS {customer.totalSpend}</div>
              </td>
              <td className="px-4 py-4 text-gray-600">
                {formatDate(customer.createdAt)}
              </td>
              <td className="px-4 py-4">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[customer.status]}`}>
                  {customer.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
