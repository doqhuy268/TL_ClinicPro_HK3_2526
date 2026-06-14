import api from '../config';
import type { WorkSession } from '@/lib/types/work-session';

class WorkSessionService {
  // GET /work-sessions/today/my
  async getTodayMyWorkSessions(): Promise<WorkSession[]> {
    const response = await api.get('/work-sessions/today/my');
    // Backend may return either array or { data: array }
    const data = Array.isArray(response.data) ? response.data : response.data?.data;
    return (data || []) as WorkSession[];
  }

  // PUT /work-sessions/:id { status }
  async updateStatus(id: string, status: 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'CANCELED' | 'COMPLETED') {
    const response = await api.put(`/work-sessions/${id}`, { status });
    return response.data;
  }
}

export const workSessionService = new WorkSessionService();
export default workSessionService;


