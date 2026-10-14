import type { ConversationState, SupportConversation } from '../../services/supportService';

export const STATES: { value: ConversationState; label: string; dot: string; className: string }[] = [
  { value: 'needs_reply', label: 'Needs reply', dot: 'bg-amber-500', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700' },
  { value: 'waiting', label: 'Replied', dot: 'bg-sky-500', className: 'border-sky-500/20 bg-sky-500/10 text-sky-700' },
  { value: 'resolved', label: 'Resolved', dot: 'bg-emerald-500', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700' },
];

export const stateMeta = (s: ConversationState) => STATES.find((x) => x.value === s) ?? STATES[0];

export const displayName = (c: Pick<SupportConversation, 'customer' | 'phone' | 'userId'>) => c.customer || c.phone || `Customer #${c.userId}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /[A-Za-z]/.test(w[0] ?? ''))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '#';

/** "now", "5m", "3h", "2d", then a date. */
export function ago(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function minutesLabel(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} h ${mins % 60 ? `${mins % 60} min` : ''}`.trim();
  return `${Math.round(h / 24)} days`;
}
