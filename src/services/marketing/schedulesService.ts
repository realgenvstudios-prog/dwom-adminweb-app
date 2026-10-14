import adminApiClient from '../apiClient';
import type { MessageSchedule, RepeatInput } from './marketingTypes';

export interface ScheduleInput {
  name?: string;
  templateId?: number;
  title?: string;
  body?: string;
  sendPush?: boolean;
  sendSms?: boolean;
  sendEmail?: boolean;
  targetZones?: number[];
  targetSubscriptionStatus?: string;
  targetUserIds?: number[];
  groupId?: number;
  repeat: RepeatInput;
}

/** Notifications and campaigns that go out later or repeatedly. */
export const schedulesService = {
  list(): Promise<MessageSchedule[]> {
    return adminApiClient.get<MessageSchedule[]>('/marketing/schedules');
  },
  create(data: ScheduleInput): Promise<MessageSchedule> {
    return adminApiClient.post<MessageSchedule>('/marketing/schedules', data);
  },
  /** Pause/resume, or change when it stops (clearEndsOn = until stopped). */
  update(id: number, data: { active?: boolean; endsOn?: string | null; clearEndsOn?: boolean }): Promise<MessageSchedule> {
    return adminApiClient.patch<MessageSchedule>(`/marketing/schedules/${id}`, data);
  },
  remove(id: number): Promise<{ deleted?: boolean; stopped?: boolean }> {
    return adminApiClient.delete(`/marketing/schedules/${id}`);
  },
};

export default schedulesService;
