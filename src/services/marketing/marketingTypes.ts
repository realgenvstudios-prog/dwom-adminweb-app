export interface Campaign {
  id: number;
  name: string;
  description?: string;
  channel: 'social' | 'sms' | 'email' | 'in_app' | 'push';
  objective: 'awareness' | 'conversion' | 'retention' | 'engagement';
  status: 'draft' | 'active' | 'paused' | 'ended';
  startDate: string;
  endDate?: string;
  budget?: number;
  actualSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cac: number;
  roas: number;
  content: string;
  imageUrl?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: number;
  name: string;
  description?: string;
  title: string;
  body: string;
  imageUrl?: string;
  actionUrl?: string;
  inAppTitle?: string;
  inAppBody?: string;
  inAppImageUrl?: string;
  inAppCtaText?: string;
  inAppCtaLink?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSend {
  id: number;
  templateId: number;
  status: 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  pushSuccessCount?: number;
  pushFailureCount?: number;
  smsSuccessCount?: number;
  smsFailureCount?: number;
  emailSuccessCount?: number;
  emailFailureCount?: number;
  readCount: number;
  clickCount: number;
  createdAt: string;
}

export interface CartCodeAnalytics {
  id: number;
  code: string;
  creator: string;
  creatorId: number;
  totalShares: number;
  totalUsages: number;
  uniqueUsers: number;
  totalRevenue: number;
  lastUsedAt?: string;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface CampaignMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  avgRoas: number;
  activeCampaigns: number;
}
