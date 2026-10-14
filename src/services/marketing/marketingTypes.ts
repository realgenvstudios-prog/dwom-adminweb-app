export interface Campaign {
  id: number;
  name: string;
  description?: string;
  channel: 'social' | 'sms' | 'email' | 'in_app' | 'push';
  objective: 'awareness' | 'conversion' | 'retention' | 'engagement';
  status: 'draft' | 'active' | 'paused' | 'ended';
  targetZones?: number[] | null;
  targetSubscriptionStatus?: string | null;
  /** Non-empty = only these customers; zones/status ignored. */
  targetUserIds?: number[];
  /** A saved customer group, read fresh at every send. */
  targetGroupId?: number | null;
  /** Present when the campaign repeats or waits for a set time. */
  Schedule?: MessageSchedule | null;
  startDate: string;
  endDate?: string;
  budget?: number;
  actualSpend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  cac: number;
  roas: number;
  // True when conversions/revenue/cac/roas are the manually-typed columns
  // rather than real Order/Coupon data — no paid order has been
  // attributed to this campaign yet (e.g. a social campaign with no
  // trackable link).
  metricsAreEstimate: boolean;
  Coupon?: { id: number; code: string; usageCount: number; discountValue: number; discountType: string; active: boolean }[];
  content: string;
  imageUrl?: string;
  title?: string;
  cta?: string | null;
  ctaLink?: string | null;
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
  /** Null when the message was written for this send only (see title/body). */
  templateId: number | null;
  title?: string | null;
  body?: string | null;
  /** Non-empty when sent to chosen customers or a saved group. */
  targetUserIds?: number[];
  audienceLabel?: string | null;
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
  targetZones?: number[] | null;
  targetSubscriptionStatus?: string | null;
  template?: { id: number; name: string; title: string; body: string } | null;
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

export interface CustomerGroupMember {
  id: number;
  name: string | null;
  phoneNumber: string | null;
}

export interface CustomerGroup {
  id: number;
  name: string;
  description: string | null;
  userIds: number[];
  members: CustomerGroupMember[];
  createdAt: string;
  updatedAt: string;
}

/** When a message goes out. Times are Ghana time (UTC). */
export interface RepeatInput {
  frequency: 'once' | 'daily' | 'weekly';
  daysOfWeek?: number[];
  timeOfDay: string;
  startsOn: string;
  endsOn?: string | null;
}

export interface MessageSchedule {
  id: number;
  kind: 'campaign' | 'notification';
  campaignId: number | null;
  Campaign?: { id: number; name: string; channel: string; status: string } | null;
  name: string | null;
  templateId: number | null;
  title: string | null;
  body: string | null;
  sendPush: boolean;
  sendSms: boolean;
  sendEmail: boolean;
  targetUserIds: number[];
  groupId: number | null;
  frequency: RepeatInput['frequency'];
  daysOfWeek: number[];
  timeOfDay: string;
  startsOn: string;
  endsOn: string | null;
  active: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
  runCount: number;
  lastError: string | null;
  /** e.g. "Every Tuesday at 09:00, until stopped" */
  summary?: string;
  createdAt: string;
}
