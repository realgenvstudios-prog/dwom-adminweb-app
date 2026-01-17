import adminApiClient from './apiClient';

export type NotesAnalytics = {
  stats: {
    totalNotes: number;
    processedNotes: number;
    errorNotes: number;
    addedToCart: number;
    avgConfidence: number;
  };
  commonSearches: Array<{
    text: string;
    count: number;
  }>;
  commonProducts: any[];
  errorNotes: Array<{
    id: number;
    originalText: string;
    notes: string;
    confidence: number;
    createdAt: string;
  }>;
  lowConfidenceMatches: Array<{
    originalText: string;
    searchedAs: string;
    matchedProduct: string;
    confidence: number;
    matchRatio: number;
  }>;
};

export const notesService = {
  async getAnalytics(): Promise<NotesAnalytics> {
    try {
      const response = await adminApiClient.get<NotesAnalytics>('/notes/analytics');
      return response;
    } catch (error: any) {
      console.error('Failed to fetch notes analytics:', error);
      throw error;
    }
  },

  async getAllNotes(status?: string, userId?: number, skip: number = 0, take: number = 20) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (userId) params.append('userId', String(userId));
      params.append('skip', String(skip));
      params.append('take', String(take));

      const response = await adminApiClient.get(`/notes/admin/all?${params.toString()}`);
      return response;
    } catch (error: any) {
      console.error('Failed to fetch notes:', error);
      throw error;
    }
  },
};

export default notesService;
