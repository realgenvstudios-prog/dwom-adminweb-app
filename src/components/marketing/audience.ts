export type AudienceMode = 'everyone' | 'customers' | 'group';

export interface AudienceValue {
  mode: AudienceMode;
  zones: number[];
  status: string;
  userIds: number[];
  groupId: string;
}

export const defaultAudience = (patch: Partial<AudienceValue> = {}): AudienceValue => ({ mode: 'everyone', zones: [], status: 'all', userIds: [], groupId: '', ...patch });

/** A problem with the chosen audience, or null when it's fine. */
export function audienceProblem(a: AudienceValue): string | null {
  if (a.mode === 'customers' && a.userIds.length === 0) return 'Choose at least one customer.';
  if (a.mode === 'group' && !a.groupId) return 'Choose a group.';
  return null;
}

/** The request fields for this audience. */
export function audienceFields(a: AudienceValue) {
  if (a.mode === 'customers') return { targetUserIds: a.userIds };
  if (a.mode === 'group') return { groupId: Number(a.groupId) };
  return { targetZones: a.zones.length ? a.zones : undefined, targetSubscriptionStatus: a.status };
}
