import api from '@/lib/config';

export interface DoctorRatingPayload {
  doctorId: string;
  medicalRecordId: string;
  rating: number;
  comment?: string;
}

export interface DoctorRating extends DoctorRatingPayload {
  id: string;
  patientId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DoctorRatingStats {
  doctorId?: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  recentComments: {
    id: string;
    comment: string;
    rating: number;
    patientName: string;
    createdAt: string;
  }[];
}

export interface PaginatedDoctorRatings {
  data: DoctorRating[];
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

class DoctorRatingService {
  async createRating(payload: DoctorRatingPayload): Promise<DoctorRating> {
    const response = await api.post('/doctor-ratings', payload);
    return response.data;
  }

  async updateRating(ratingId: string, payload: Partial<DoctorRatingPayload>): Promise<DoctorRating> {
    const response = await api.patch(`/doctor-ratings/${ratingId}`, payload);
    return response.data;
  }

  async getDoctorStats(doctorId: string): Promise<DoctorRatingStats> {
    const response = await api.get(`/doctor-ratings/doctor/${doctorId}/stats`);
    return response.data;
  }

  async getRatingsByDoctor(doctorId: string, page = 1, limit = 10): Promise<PaginatedDoctorRatings | DoctorRating[]> {
    const response = await api.get(`/doctor-ratings/doctor/${doctorId}`, {
      params: { page, limit },
    });
    return response.data;
  }

  async getPatientRatings(page = 1, limit = 100): Promise<PaginatedDoctorRatings> {
    const response = await api.get('/doctor-ratings/patient/my-ratings', {
      params: { page, limit },
    });
    return response.data;
  }
}

export const doctorRatingService = new DoctorRatingService();

