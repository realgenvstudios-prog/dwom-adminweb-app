import { Bell, Mail, Megaphone, MessageSquare, Smartphone, type LucideIcon } from 'lucide-react';
import type { Campaign } from '../../services/marketingService';

// `credit` says how orders get attributed — verified against the app:
// a push tap or opening the inbox message is captured (72h window); dwom://
// links aren't tappable in SMS/most email apps, so those rely on a code.
export const CHANNELS: { value: Campaign['channel']; label: string; icon: LucideIcon; hint: string; credit: string }[] = [
  {
    value: 'push',
    label: 'Push',
    icon: Bell,
    hint: 'A phone notification to customers with the app. Free.',
    credit: 'Orders placed within 3 days of tapping it are credited automatically.',
  },
  {
    value: 'in_app',
    label: 'In-app',
    icon: Smartphone,
    hint: 'Appears in the app’s notification inbox only — no phone alert. Free.',
    credit: 'Orders placed within 3 days of opening it in the inbox are credited (app update required).',
  },
  {
    value: 'sms',
    label: 'SMS',
    icon: MessageSquare,
    hint: 'A text to every matching customer’s phone. Uses SMS credit.',
    credit: 'Put a discount code linked to this campaign in the message — orders using it are credited.',
  },
  {
    value: 'email',
    label: 'Email',
    icon: Mail,
    hint: 'To matching customers who added an email address.',
    credit: 'Put a discount code linked to this campaign in the message — orders using it are credited.',
  },
  {
    value: 'social',
    label: 'Social',
    icon: Megaphone,
    hint: 'You post it yourself. Nothing is sent from here — use it to track spend and results.',
    credit: 'Link a discount code to credit orders automatically; anything else you enter by hand.',
  },
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
