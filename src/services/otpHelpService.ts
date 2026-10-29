import adminApiClient from './apiClient';

// "I didn't get my code" requests from the customer app. Admins never see a
// login code: they call the number and confirm the help code the customer
// reads off their own screen.
export type OtpHelpStatus = 'open' | 'verified' | 'signed_in' | 'closed' | 'expired' | 'replaced';

export interface OtpSmsAttempt {
  createdAt: string;
  messageId: string | null;
  status: string | null;
  networkId: string | null;
  httpStatus: number | null;
  error: string | null;
}

export interface OtpHelpRequest {
  id: number;
  phoneNumber: string;
  flow: 'signup' | 'login';
  name: string | null;
  customerId: number | null;
  status: OtpHelpStatus;
  attempts: number;
  createdAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  closedNote: string | null;
  codesSent: OtpSmsAttempt[];
}

const otpHelpService = {
  count: () => adminApiClient.get<{ open: number }>('/admin/otp-help/count'),
  list: (scope: 'open' | 'recent') => adminApiClient.get<OtpHelpRequest[]>(`/admin/otp-help?scope=${scope}`),
  resend: (id: number) => adminApiClient.post<{ sent: boolean }>(`/admin/otp-help/${id}/resend`),
  verify: (id: number, helpCode: string) => adminApiClient.post<{ status: OtpHelpStatus }>(`/admin/otp-help/${id}/verify`, { helpCode }),
  close: (id: number, note?: string) => adminApiClient.post<{ status: OtpHelpStatus }>(`/admin/otp-help/${id}/close`, { note }),
};

export default otpHelpService;
