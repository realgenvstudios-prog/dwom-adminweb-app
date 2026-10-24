import type { SocialPost, SocialStatus } from '../../services/socialService';

export const PLATFORMS: Record<string, { label: string; dot: string; captionLimit: number; note?: string }> = {
  instagram: { label: 'Instagram', dot: 'bg-pink-500', captionLimit: 2200, note: 'Needs a photo or video. Links in captions can’t be tapped.' },
  tiktok: { label: 'TikTok', dot: 'bg-neutral-900 dark:bg-neutral-100', captionLimit: 2200, note: 'Needs a video.' },
  facebook: { label: 'Facebook', dot: 'bg-blue-600', captionLimit: 63206 },
  twitter: { label: 'X', dot: 'bg-neutral-700', captionLimit: 280 },
  linkedin: { label: 'LinkedIn', dot: 'bg-sky-700', captionLimit: 3000 },
  threads: { label: 'Threads', dot: 'bg-neutral-600', captionLimit: 500 },
  youtube: { label: 'YouTube', dot: 'bg-red-600', captionLimit: 5000, note: 'Needs a video.' },
  pinterest: { label: 'Pinterest', dot: 'bg-red-500', captionLimit: 500, note: 'Needs a photo.' },
  bluesky: { label: 'Bluesky', dot: 'bg-sky-500', captionLimit: 300 },
  whatsapp: { label: 'WhatsApp', dot: 'bg-green-600', captionLimit: 4096 },
};

export const platformOf = (p: string) => PLATFORMS[p] ?? { label: p.charAt(0).toUpperCase() + p.slice(1), dot: 'bg-muted-foreground', captionLimit: 5000 };

export const STATUSES: Record<SocialStatus, { label: string; className: string }> = {
  scheduled: { label: 'Scheduled', className: 'border-sky-500/30 bg-sky-500/10 text-sky-700' },
  publishing: { label: 'Posting', className: 'border-violet-500/30 bg-violet-500/10 text-violet-700' },
  published: { label: 'Posted', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' },
  partial: { label: 'Partly posted', className: 'border-amber-500/30 bg-amber-500/10 text-amber-700' },
  failed: { label: 'Failed', className: 'border-red-500/30 bg-red-500/10 text-red-700' },
  cancelled: { label: 'Cancelled', className: 'border-border bg-muted text-muted-foreground' },
};

export const statusOf = (s: string) => STATUSES[s as SocialStatus] ?? STATUSES.scheduled;

/** Zernio's metric names differ a little by platform; read the first that's there. */
const pick = (m: SocialPost['metrics'], ...keys: string[]) => {
  for (const k of keys) {
    const v = m?.[k];
    if (typeof v === 'number') return v;
  }
  return null;
};

export function metricsOf(post: SocialPost) {
  const m = post.metrics;
  const likes = pick(m, 'likes', 'reactions');
  const comments = pick(m, 'comments', 'replies');
  const shares = pick(m, 'shares', 'reposts', 'retweets');
  const saves = pick(m, 'saves', 'saved');
  const engagement = pick(m, 'engagement', 'engagements') ?? (likes ?? 0) + (comments ?? 0) + (shares ?? 0) + (saves ?? 0);
  return {
    reach: pick(m, 'reach', 'impressions', 'views'),
    views: pick(m, 'views', 'videoViews', 'plays'),
    likes,
    comments,
    shares,
    engagement: m ? engagement : null,
  };
}

export const fmt = (n: number | null | undefined) => (n == null ? '—' : n.toLocaleString());

export function whenLabel(post: SocialPost) {
  const iso = post.publishedAt ?? post.scheduledFor ?? post.createdAt;
  return new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
