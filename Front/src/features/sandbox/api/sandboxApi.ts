import { apiClient } from '../../../lib/axios/apiClient';

export const sandboxApi = {
  resetSandbox: async (): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>('/api/sandbox/reset');
    return response.data;
  },
};
