import adminApiClient from './apiClient';
import { logger } from '../utils/logger';

// Support is one chat thread per customer (ChatMessage rows), keyed by the
// customer's user id. State is derived server-side from who spoke last.
export type ConversationState = 'needs_reply' | 'waiting' | 'resolved';

export interface SupportConversation {
  userId: number;
  customer: string | null;
  phone: string | null;
  email: string | null;
  state: ConversationState;
  lastMessage: string;
  lastSender: 'user' | 'support';
  lastMessageAt: string;
  firstMessageAt: string;
  /** Set while the customer is waiting: their first unanswered message. */
  waitingSince: string | null;
  messageCount: number;
}

export interface SupportMessage {
  id: number;
  sender: 'user' | 'support';
  text: string;
  createdAt: string;
}

export interface SupportThread {
  userId: number;
  customer: string | null;
  phone: string | null;
  email: string | null;
  customerSince: string;
  state: ConversationState;
  messages: SupportMessage[];
}

export interface SupportMetrics {
  conversations: number;
  needsReply: number;
  waiting: number;
  resolved: number;
  /** Over the last 30 days; null when there's nothing to measure yet. */
  medianFirstResponseMinutes: number | null;
  repliesLast7Days: number;
}

const supportService = {
  async getConversations(): Promise<SupportConversation[]> {
    const data = await adminApiClient.get<SupportConversation[]>('/chat/admin/support-tickets');
    return Array.isArray(data) ? data : [];
  },

  async getConversation(userId: number): Promise<SupportThread> {
    return adminApiClient.get<SupportThread>(`/chat/admin/support-tickets/${userId}`);
  },

  /** `notified` is false when the customer has no app/push token to receive it. */
  async reply(userId: number, message: string): Promise<SupportMessage & { notified: boolean }> {
    try {
      return await adminApiClient.post<SupportMessage & { notified: boolean }>('/chat/admin/support-reply', { userId, message });
    } catch (error) {
      logger.error('Failed to send support reply:', error);
      throw error;
    }
  },

  async setResolved(userId: number, resolved: boolean): Promise<SupportThread> {
    return adminApiClient.post<SupportThread>(`/chat/admin/support-tickets/${userId}/status`, { status: resolved ? 'resolved' : 'open' });
  },

  async getSupportMetrics(): Promise<SupportMetrics> {
    return adminApiClient.get<SupportMetrics>('/chat/admin/support-metrics');
  },
};

export default supportService;
