export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  createdAt: string;
  address: string | null;
  totalOrders: number;
  totalSpend: number;
  avgOrder: number;
  lastOrder: string | null;
  status: 'Active' | 'At Risk' | 'Churned' | 'New';
}

export interface OrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  image: string | null;
}

export interface CustomerOrder {
  id: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
  createdAt: string;
  address: string | null;
  items: OrderItem[];
}

export const statusColors: Record<string, string> = {
  "Active": "bg-green-100 text-green-700",
  "At Risk": "bg-yellow-100 text-yellow-700",
  "Churned": "bg-red-100 text-red-700",
  "New": "bg-blue-100 text-blue-700"
};

export function formatDate(dateString: string) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}
