import { Bell, Mail, Megaphone, MessageSquare, Smartphone, type LucideIcon } from 'lucide-react';
import type { Campaign } from '../../services/marketingService';

export const CHANNELS: { value: Campaign['channel']; label: string; icon: LucideIcon; hint: string }[] = [
  { value: 'push', label: 'Push', icon: Bell, hint: 'Phone notification to app users' },
  { value: 'in_app', label: 'In-app', icon: Smartphone, hint: 'Shows in the app’s notification inbox' },
  { value: 'sms', label: 'SMS', icon: MessageSquare, hint: 'Text message to each customer’s phone' },
  { value: 'email', label: 'Email', icon: Mail, hint: 'To customers who have an email address' },
  { value: 'social', label: 'Social', icon: Megaphone, hint: 'You post it yourself — results are entered by hand' },
];

export const OBJECTIVES: { value: Campaign['objective']; label: string }[] = [
  { value: 'awareness', label: 'Awareness' },
  { value: 'conversion', label: 'Sales' },
  { value: 'retention', label: 'Win back / retain' },
  { value: 'engagement', label: 'Engagement' },
];

export const STATUSES: { value: Campaign['status']; label: string; className: string }[] = [
  { value: 'draft', label: 'Draft', className: 'text-muted-foreground' },
  { value: 'active', label: 'Live', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' },
  { value: 'paused', label: 'Paused', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700' },
  { value: 'ended', label: 'Ended', className: 'border-zinc-500/20 bg-zinc-500/10 text-zinc-600' },
];

// Mirrors the backend's targetSubscriptionStatus filter.
export const AUDIENCES = [
  { value: 'all', label: 'All customers' },
  { value: 'active', label: 'Active subscribers' },
  { value: 'paused', label: 'Paused subscribers' },
  { value: 'failed', label: 'Subscribers with a failed payment' },
];

export const channelOf = (v: string) => CHANNELS.find((c) => c.value === v) ?? CHANNELS[0];
export const statusOf = (v: string) => STATUSES.find((s) => s.value === v) ?? STATUSES[0];
export const objectiveLabel = (v: string) => OBJECTIVES.find((o) => o.value === v)?.label ?? v;

/** Decimal-safe number read (budget/spend/cac arrive as numbers, but be defensive). */
export const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
