import adminApiClient from './apiClient';

/** A social account connected in Zernio (the key stays on the server). */
export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  picture: string | null;
  followers: number | null;
  needsReconnection: boolean;
  active: boolean;
  rateLimitedUntil: string | null;
}

export type SocialStatus = 'scheduled' | 'publishing' | 'published' | 'partial' | 'failed' | 'cancelled';

export interface SocialPlatformResult {
  platform: string;
  accountId: string;
  username: string;
  status: string;
  url: string | null;
  error: string | null;
  publishedAt: string | null;
}

export interface SocialPost {
  id: number;
  zernioPostId: string | null;
  content: string;
  mediaUrls: string[];
  targets: { platform: string; accountId: string; username?: string }[];
  scheduledFor: string | null;
  timezone: string;
  status: SocialStatus;
  results: SocialPlatformResult[] | null;
  /** Zernio's numbers (reach, impressions, likes, comments, shares, saves, clicks, views…). */
  metrics: Record<string, number | null> | null;
  metricsUpdatedAt: string | null;
  publishedAt: string | null;
  error: string | null;
  productId: number | null;
  bundleId: number | null;
  couponId: number | null;
  linkCode: string | null;
  linkTarget: string | null;
  linkClicks: number;
  createdAt: string;
  /** Orders that used the post's discount code after it went out. */
  orders: { count: number; revenue: number } | null;
}

export interface CreateSocialPostPayload {
  content: string;
  mediaUrls?: string[];
  accountIds: string[];
  scheduledFor?: string;
  publishNow?: boolean;
  timezone?: string;
  productId?: number;
  bundleId?: number;
  couponId?: number;
  includeLink?: boolean;
  linkTarget?: string;
}

const socialService = {
  accounts: () => adminApiClient.get<{ configured: boolean; accounts: SocialAccount[] }>('/admin/social/accounts'),
  posts: () => adminApiClient.get<SocialPost[]>('/admin/social/posts'),
  create: (payload: CreateSocialPostPayload) => adminApiClient.post<SocialPost>('/admin/social/posts', payload),
  sync: (id: number) => adminApiClient.post<SocialPost>(`/admin/social/posts/${id}/sync`),
  cancel: (id: number) => adminApiClient.delete<SocialPost>(`/admin/social/posts/${id}`),
};

export default socialService;
