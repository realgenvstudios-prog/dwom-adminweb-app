import apiClient from './apiClient';

export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  atRiskCustomers: number;
  churnedCustomers: number;
  newCustomers: number;
  totalRevenue: number;
  avgOrderValue: number;
  repurchaseRate: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  zone?: string;
  totalOrders: number;
  totalSpend: number;
  avgOrder: number;
  lastOrder: string | null;
  status: 'Active' | 'At Risk' | 'Churned' | 'New';
  joined: string;
  payment: string;
  email?: string;
  createdAt?: string;
}

export interface CustomerSegment {
  label: string;
  value: number;
  color: string;
}

export interface ChurnRisk {
  name: string;
  days: number;
  id: number;
  phone: string;
  lastOrder: string;
}

export interface CustomerChurnMetrics {
  atRisk: number;
  churnedLast30Days: number;
  recovered: number;
  churnList: ChurnRisk[];
}

class CustomersService {
  /**
   * Get all customers with their order statistics
   */
  async getAllCustomers(): Promise<Customer[]> {
    try {
      
      // Fetch all users from the backend
      const response = (await apiClient.get('/users')) as any;
      const users = response?.data || [];

      // For each user, fetch their orders to calculate stats
      const customersWithStats = await Promise.all(
        users.map(async (user: any) => {
          try {
            const ordersResponse = (await apiClient.get(`/orders?userId=${user.id}`)) as any;
            const orders = ordersResponse?.data || [];

            const totalOrders = orders.length;
            const totalSpend = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0);
            const avgOrder = totalOrders > 0 ? totalSpend / totalOrders : 0;
            const lastOrder = orders.length > 0 ? orders[0].createdAt : null;

            // Determine customer status
            const daysSinceLastOrder = lastOrder
              ? Math.floor((Date.now() - new Date(lastOrder).getTime()) / (1000 * 60 * 60 * 24))
              : null;

            let status: 'Active' | 'At Risk' | 'Churned' | 'New' = 'Active';
            if (totalOrders === 0) {
              status = 'New';
            } else if (daysSinceLastOrder !== null && daysSinceLastOrder > 30) {
              status = 'Churned';
            } else if (daysSinceLastOrder !== null && daysSinceLastOrder > 14) {
              status = 'At Risk';
            }

            return {
              id: user.id,
              name: user.name || 'Unknown',
              phone: user.phoneNumber || user.phone || 'N/A',
              zone: user.Address?.[0]?.zone || 'Unknown Zone',
              totalOrders,
              totalSpend: Math.round(totalSpend * 100) / 100,
              avgOrder: Math.round(avgOrder * 100) / 100,
              lastOrder: lastOrder ? new Date(lastOrder).toISOString().split('T')[0] : null,
              status,
              joined: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'Unknown',
              payment: 'Card', // Would need to fetch from payment records
              email: user.email,
            };
          } catch (error) {
            console.warn(`Failed to fetch orders for user ${user.id}:`, error);
            return {
              id: user.id,
              name: user.name || 'Unknown',
              phone: user.phoneNumber || user.phone || 'N/A',
              zone: 'Unknown Zone',
              totalOrders: 0,
              totalSpend: 0,
              avgOrder: 0,
              lastOrder: null,
              status: 'New' as const,
              joined: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : 'Unknown',
              payment: 'Card',
              email: user.email,
            };
          }
        })
      );

      return customersWithStats;
    } catch (error) {
      console.error('❌ [CustomersService] Error fetching customers:', error);
      return [];
    }
  }

  /**
   * Get customer metrics summary
   */
  async getCustomerMetrics(): Promise<CustomerMetrics> {
    try {
      const customers = await this.getAllCustomers();

      const activeCustomers = customers.filter(c => c.status === 'Active').length;
      const atRiskCustomers = customers.filter(c => c.status === 'At Risk').length;
      const churnedCustomers = customers.filter(c => c.status === 'Churned').length;
      const newCustomers = customers.filter(c => c.status === 'New').length;

      const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpend, 0);
      const avgOrderValue = customers.length > 0
        ? totalRevenue / customers.reduce((sum, c) => sum + c.totalOrders, 0) || 0
        : 0;

      const customersWithOrders = customers.filter(c => c.totalOrders > 0);
      const repurchaseRate = customers.length > 0
        ? (customersWithOrders.length / customers.length) * 100
        : 0;

      return {
        totalCustomers: customers.length,
        activeCustomers,
        atRiskCustomers,
        churnedCustomers,
        newCustomers,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        repurchaseRate: Math.round(repurchaseRate * 100) / 100,
      };
    } catch (error) {
      console.error('❌ [CustomersService] Error fetching metrics:', error);
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        atRiskCustomers: 0,
        churnedCustomers: 0,
        newCustomers: 0,
        totalRevenue: 0,
        avgOrderValue: 0,
        repurchaseRate: 0,
      };
    }
  }

  /**
   * Get customer segments
   */
  async getCustomerSegments(): Promise<CustomerSegment[]> {
    try {
      const customers = await this.getAllCustomers();

      // Segment logic:
      // Power Users: >50 orders
      // Loyal: 20-50 orders
      // Regular: 5-20 orders
      // New: 0-5 orders or created in last 30 days

      const powerUsers = customers.filter(c => c.totalOrders > 50).length;
      const loyal = customers.filter(c => c.totalOrders > 20 && c.totalOrders <= 50).length;
      const regular = customers.filter(c => c.totalOrders > 5 && c.totalOrders <= 20).length;
      const newCustomers = customers.filter(
        c => c.totalOrders <= 5 || (c.joined && 
          Math.floor((Date.now() - new Date(c.joined).getTime()) / (1000 * 60 * 60 * 24)) < 30)
      ).length;

      return [
        { label: 'Power Users', value: powerUsers, color: 'bg-blue-500' },
        { label: 'Loyal', value: loyal, color: 'bg-green-500' },
        { label: 'Regular', value: regular, color: 'bg-yellow-400' },
        { label: 'New', value: newCustomers, color: 'bg-gray-300' },
      ];
    } catch (error) {
      console.error('❌ [CustomersService] Error fetching segments:', error);
      return [];
    }
  }

  /**
   * Get churn risk metrics and at-risk customers
   */
  async getChurnMetrics(): Promise<CustomerChurnMetrics> {
    try {
      const customers = await this.getAllCustomers();

      const atRiskCustomers = customers.filter(c => c.status === 'At Risk');
      const churnedCustomers = customers.filter(c => c.status === 'Churned');

      // Calculate how many were recovered (have recent orders after being churned)
      const recovered = 0; // Would need more complex logic to track recovery

      // Get top 3 at-risk customers
      const churnList: ChurnRisk[] = atRiskCustomers
        .sort((a, b) => {
          const daysA = a.lastOrder
            ? Math.floor((Date.now() - new Date(a.lastOrder).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          const daysB = b.lastOrder
            ? Math.floor((Date.now() - new Date(b.lastOrder).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          return daysB - daysA;
        })
        .slice(0, 3)
        .map(c => ({
          name: c.name,
          id: c.id,
          phone: c.phone,
          lastOrder: c.lastOrder || 'N/A',
          days: c.lastOrder
            ? Math.floor((Date.now() - new Date(c.lastOrder).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        }));

      return {
        atRisk: atRiskCustomers.length,
        churnedLast30Days: churnedCustomers.length,
        recovered,
        churnList,
      };
    } catch (error) {
      console.error('❌ [CustomersService] Error fetching churn metrics:', error);
      return {
        atRisk: 0,
        churnedLast30Days: 0,
        recovered: 0,
        churnList: [],
      };
    }
  }

  /**
   * Get filtered customers by status
   */
  async getCustomersByStatus(status: string): Promise<Customer[]> {
    try {
      const allCustomers = await this.getAllCustomers();
      if (status === 'All') {
        return allCustomers;
      }
      return allCustomers.filter(c => c.status === status);
    } catch (error) {
      console.error(`❌ [CustomersService] Error fetching customers by status ${status}:`, error);
      return [];
    }
  }

  /**
   * Get filtered customers by zone
   */
  async getCustomersByZone(zone: string): Promise<Customer[]> {
    try {
      const allCustomers = await this.getAllCustomers();
      if (zone === 'all') {
        return allCustomers;
      }
      return allCustomers.filter(c => c.zone?.toLowerCase() === zone.toLowerCase());
    } catch (error) {
      console.error(`❌ [CustomersService] Error fetching customers by zone ${zone}:`, error);
      return [];
    }
  }

  /**
   * Search customers by name, phone, or ID
   */
  async searchCustomers(query: string): Promise<Customer[]> {
    try {
      const allCustomers = await this.getAllCustomers();
      const lowerQuery = query.toLowerCase();

      return allCustomers.filter(c =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.phone.includes(query) ||
        c.id.toString() === query
      );
    } catch (error) {
      console.error('❌ [CustomersService] Error searching customers:', error);
      return [];
    }
  }

  /**
   * Get single customer details
   */
  async getCustomerById(id: number): Promise<Customer | null> {
    try {
      const allCustomers = await this.getAllCustomers();
      return allCustomers.find(c => c.id === id) || null;
    } catch (error) {
      console.error(`❌ [CustomersService] Error fetching customer ${id}:`, error);
      return null;
    }
  }
}

const customersService = new CustomersService();
export default customersService;
