import adminApiClient from './apiClient';

/** Every flyer's QR code opens this, and it sends each phone to its own store. */
export const QR_HOST = 'https://get.dwom.org';

export interface ScanCounts {
  total: number;
  ios: number;
  android: number;
  other: number;
}

export interface QrCode {
  id: number;
  slug: string;
  name: string;
  archived: boolean;
  general: boolean;
  createdAt: string;
  scans: ScanCounts;
}

export interface QrStats {
  days: number;
  total: number;
  platforms: Omit<ScanCounts, 'total'>;
  daily: { day: string; scans: number }[];
  cities: { city: string; scans: number }[];
}

/** The General code is the bare address, so its QR is the simplest to scan. */
export const linkOf = (code: Pick<QrCode, 'slug' | 'general'>) => (code.general ? QR_HOST : `${QR_HOST}/${code.slug}`);

const qrCodeService = {
  list: (days: number) => adminApiClient.get<QrCode[]>(`/qr/codes?days=${days}`),
  stats: (days: number, codeId?: number) => adminApiClient.get<QrStats>(`/qr/stats?days=${days}${codeId ? `&codeId=${codeId}` : ''}`),
  create: (name: string) => adminApiClient.post<QrCode>('/qr/codes', { name }),
  setArchived: (id: number, archived: boolean) => adminApiClient.patch<QrCode>(`/qr/codes/${id}`, { archived }),
};

export default qrCodeService;
