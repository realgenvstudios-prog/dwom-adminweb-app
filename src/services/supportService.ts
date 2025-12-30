import apiClient from './apiClient';

export interface ChatMessage {
  id: number;
  userId: number;
  message: string;
  sender: 'user' | 'support' | 'admin';
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  customer: string;
  phone: string;
  topic: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  channel: 'In-app' | 'WhatsApp' | 'Phone' | 'Email';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated';
  lastUpdate: string;
  orderId?: string;
  created: string;
  subject: string;
  sla: string;
  conversation: Array<{ sender: string; time: string; text: string }>;
  assigned: string;
  userId: number;
}

export interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  escalatedTickets: number;
  avgResolutionTime: number;
  avgResponseTime: number;
  firstContactResolution: number;
}

const supportService = {
  // Get all support tickets from backend
  async getAllTickets(limit: number = 50): Promise<SupportTicket[]> {
    try {
      const response = await apiClient.get('/chat/admin/support-tickets');
      const tickets = ((response as any)?.data || []) as any[];

      // Convert to frontend format
      return tickets.slice(0, limit).map(t => ({
        id: t.id,
        customer: t.customer,
        phone: t.phone,
        topic: t.topic,
        priority: t.priority as 'Low' | 'Medium' | 'High' | 'Urgent',
        channel: t.channel as 'In-app' | 'WhatsApp' | 'Phone' | 'Email',
        status: t.status as 'Open' | 'In Progress' | 'Resolved' | 'Escalated',
        lastUpdate: t.lastUpdate,
        orderId: '',
        created: t.created,
        subject: t.subject,
        sla: t.sla,
        conversation: (t.messages || []).map((msg: any) => ({
          sender: msg.sender,
          time: msg.time,
          text: msg.text,
        })),
        assigned: t.assigned,
        userId: t.userId,
      }));
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
      return [];
    }
  },

  // Get single ticket details
  async getTicketById(ticketId: string): Promise<SupportTicket | null> {
    try {
      // Extract userId from ticket ID (T-1001 -> userId)
      const ticketNum = parseInt(ticketId.replace('T-', ''));
      const userId = ticketNum - 1001;
      
      const response = await apiClient.get(`/chat/admin/support-tickets/${userId}`);
      const t = (response as any)?.data;
      
      if (!t) return null;

      return {
        id: t.id,
        customer: t.customer,
        phone: t.phone,
        topic: t.topic,
        priority: t.priority as 'Low' | 'Medium' | 'High' | 'Urgent',
        channel: t.channel as 'In-app' | 'WhatsApp' | 'Phone' | 'Email',
        status: t.status as 'Open' | 'In Progress' | 'Resolved' | 'Escalated',
        lastUpdate: t.lastUpdate,
        orderId: '',
        created: t.created,
        subject: t.subject,
        sla: t.sla,
        conversation: t.conversation || [],
        assigned: t.assigned,
        userId: t.userId,
      };
    } catch (error) {
      console.error('Failed to fetch ticket:', error);
      return null;
    }
  },

  // Send reply to ticket
  async sendReply(ticketId: string, message: string): Promise<ChatMessage | null> {
    try {
      // Extract userId from ticket ID
      const ticketNum = parseInt(ticketId.replace('T-', ''));
      const userId = ticketNum - 1001;
      
      const response = await apiClient.post('/chat/admin/support-reply', { userId, message });
      return (((response as any)?.data || null) as ChatMessage);
    } catch (error) {
      console.error('Failed to send reply:', error);
      return null;
    }
  },

  // Get support metrics from backend
  async getSupportMetrics(): Promise<SupportMetrics> {
    try {
      const response = await apiClient.get('/chat/admin/support-metrics');
      const data = (response as any)?.data;

      return {
        totalTickets: data?.totalTickets || 0,
        openTickets: data?.openTickets || 0,
        inProgressTickets: data?.inProgressTickets || 0,
        resolvedTickets: data?.resolvedTickets || 0,
        escalatedTickets: data?.escalatedTickets || 0,
        avgResolutionTime: data?.avgResolutionTime || 0,
        avgResponseTime: data?.avgResponseTime || 0,
        firstContactResolution: data?.firstContactResolution || 0,
      };
    } catch (error) {
      console.error('Failed to fetch support metrics:', error);
      return {
        totalTickets: 0,
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        escalatedTickets: 0,
        avgResolutionTime: 0,
        avgResponseTime: 0,
        firstContactResolution: 0,
      };
    }
  },

  // Get tickets by status (client-side filter)
  async getTicketsByStatus(status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated'): Promise<SupportTicket[]> {
    try {
      const tickets = await this.getAllTickets(100);
      return tickets.filter(t => t.status === status);
    } catch (error) {
      console.error('Failed to fetch tickets by status:', error);
      return [];
    }
  },

  // Get tickets by channel (client-side filter)
  async getTicketsByChannel(channel: 'In-app' | 'WhatsApp' | 'Phone' | 'Email'): Promise<SupportTicket[]> {
    try {
      const tickets = await this.getAllTickets(100);
      return tickets.filter(t => t.channel === channel);
    } catch (error) {
      console.error('Failed to fetch tickets by channel:', error);
      return [];
    }
  },

  // Search tickets (client-side filter)
  async searchTickets(query: string): Promise<SupportTicket[]> {
    try {
      const tickets = await this.getAllTickets(100);
      return tickets.filter(t =>
        t.customer.toLowerCase().includes(query.toLowerCase()) ||
        t.id.toLowerCase().includes(query.toLowerCase()) ||
        t.topic.toLowerCase().includes(query.toLowerCase()) ||
        t.orderId?.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to search tickets:', error);
      return [];
    }
  },

  // Update ticket status (local only - would need backend PATCH endpoint)
  async updateTicketStatus(_ticketId: string, _status: 'Open' | 'In Progress' | 'Resolved' | 'Escalated'): Promise<SupportTicket | null> {
    try {
      // TODO: In production, send to backend: PATCH /chat/admin/support-tickets/:id/status
      console.log(`Updating ticket ${_ticketId} status to ${_status}`);
      return await this.getTicketById(_ticketId);
    } catch (error) {
      console.error('Failed to update ticket status:', error);
      return null;
    }
  },

  // Assign ticket (local only - would need backend PATCH endpoint)
  async assignTicket(_ticketId: string, _assignee: string): Promise<SupportTicket | null> {
    try {
      // TODO: In production, send to backend: PATCH /chat/admin/support-tickets/:id/assign
      console.log(`Assigning ticket ${_ticketId} to ${_assignee}`);
      return await this.getTicketById(_ticketId);
    } catch (error) {
      console.error('Failed to assign ticket:', error);
      return null;
    }
  },

  // Update ticket priority (local only - would need backend PATCH endpoint)
  async updateTicketPriority(_ticketId: string, _priority: 'Low' | 'Medium' | 'High' | 'Urgent'): Promise<SupportTicket | null> {
    try {
      // TODO: In production, send to backend: PATCH /chat/admin/support-tickets/:id/priority
      console.log(`Updating ticket ${_ticketId} priority to ${_priority}`);
      return await this.getTicketById(_ticketId);
    } catch (error) {
      console.error('Failed to update ticket priority:', error);
      return null;
    }
  },
};

export default supportService;
