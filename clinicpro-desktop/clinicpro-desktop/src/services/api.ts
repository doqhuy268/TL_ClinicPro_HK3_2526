// API service for Desktop Counter App

import {
  Counter,
  CountersResponse,
  CurrentPatientResponse,
  QueueResponse,
  NextPatientResponse,
  SkipPatientResponse,
  TakeNumberRequest,
  TakeNumberResponse,
  QueueSnapshot,
  PendingServicesResponse,
  StartServiceRequestItem,
  StartServicesResponse,
} from '../types';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // Try to parse error message from response body
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData.statusCode && errorData.message) {
            errorMessage = `${errorData.statusCode}: ${errorData.message}`;
          }
        } catch {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            if (text) {
              errorMessage = text;
            }
          } catch {
            // Keep default error message
          }
        }
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Lấy danh sách counters
  async getCounters(): Promise<Counter[]> {
    const response = await this.request<CountersResponse>(
      '/api/counter-assignment/counters'
    );

    if (Array.isArray(response)) {
      return response;
    }

    if (response?.counters && Array.isArray(response.counters)) {
      return response.counters;
    }

    console.warn('Unexpected counters response format', response);
    return [];
  }

  // Lấy bệnh nhân hiện tại
  async getCurrentPatient(counterId: string): Promise<CurrentPatientResponse> {
    return this.request<CurrentPatientResponse>(
      `/api/counter-assignment/counters/${counterId}/current-patient`
    );
  }

  // Lấy hàng đợi
  async getQueue(counterId: string): Promise<QueueResponse> {
    return this.request<QueueResponse>(
      `/api/counter-assignment/counters/${counterId}/queue`
    );
  }

  async getQueueSnapshot(counterId: string): Promise<QueueSnapshot> {
    return this.request<QueueSnapshot>(
      `/api/counter-assignment/queue/${counterId}`
    );
  }

  // Gọi bệnh nhân tiếp theo
  async callNextPatient(counterId: string): Promise<NextPatientResponse> {
    const res = await this.request<NextPatientResponse>(
      `/api/counter-assignment/next-patient/${counterId}`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
    try {
      if (res && (res as any).patient) {
        // The API returns the promoted ticket under `patient`
        console.log('[api] next-patient received ticket:', (res as any).patient);
      } else {
        console.log('[api] next-patient response:', res);
      }
    } catch {}
    return res;
  }

  // Bỏ qua bệnh nhân hiện tại
  async skipCurrentPatient(counterId: string): Promise<SkipPatientResponse> {
    return this.request<SkipPatientResponse>(
      `/api/counter-assignment/skip-current/${counterId}`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );
  }

  // Hoàn thành phục vụ
  async completePatient(patientProfileId: string, roomId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      '/api/routing/status/completed',
      {
        method: 'POST',
        body: JSON.stringify({
          patientProfileId,
          roomId,
        }),
      }
    );
  }

  // Kiosk: Bốc số cho bệnh nhân
  async takeNumber(payload: TakeNumberRequest): Promise<TakeNumberResponse> {
    const res = await this.request<TakeNumberResponse>(
      '/api/take-number/take',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    try {
      if (res && (res as any).ticket) {
        console.log('[api] take-number received ticket:', (res as any).ticket);
      } else {
        console.log('[api] take-number response:', res);
      }
    } catch {}
    return res;
  }

  // Prescription: Get pending services by prescription code
  async getPendingServicesByCode(prescriptionCode: string): Promise<PendingServicesResponse> {
    return this.request<PendingServicesResponse>(
      `/api/prescriptions/pending-services/${encodeURIComponent(prescriptionCode)}`,
      {
        method: 'GET',
      }
    );
  }

  // Prescription: Start services
  async startServices(items: StartServiceRequestItem[]): Promise<StartServicesResponse> {
    return this.request<StartServicesResponse>(
      '/api/prescriptions/start-services',
      {
        method: 'POST',
        body: JSON.stringify({ services: items }),
      }
    );
  }

  // Get patient profile by code (for QR scanning)
  async getPatientProfileByCode(code: string): Promise<{
    name: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
    profileCode: string;
    dateOfBirth?: string;
    phone?: string;
    isPregnant?: boolean;
    isDisabled?: boolean;
  }> {
    const response = await this.request<any>(
      `/api/patient-profiles/code/${encodeURIComponent(code)}`,
      {
        method: 'GET',
      }
    );
    
    // Calculate age from dateOfBirth
    let age = 0;
    if (response.dateOfBirth) {
      const birthDate = new Date(response.dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    // Normalize gender from database format (male/female) to enum format (MALE/FEMALE)
    const normalizeGender = (gender: string | null | undefined): 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN' => {
      if (!gender) return 'UNKNOWN';
      const genderLower = gender.toLowerCase();
      if (genderLower === 'male' || genderLower === 'm' || genderLower === 'nam') {
        return 'MALE';
      } else if (genderLower === 'female' || genderLower === 'f' || genderLower === 'nữ') {
        return 'FEMALE';
      } else if (genderLower === 'other' || genderLower === 'o' || genderLower === 'khác') {
        return 'OTHER';
      }
      return 'UNKNOWN';
    };
    
    return {
      name: response.name || '',
      age,
      gender: normalizeGender(response.gender),
      profileCode: response.profileCode || code,
      dateOfBirth: response.dateOfBirth,
      phone: response.phone,
      isPregnant: response.isPregnant,
      isDisabled: response.isDisabled,
    };
  }

  // Clinic Rooms: Get all clinic rooms
  async getClinicRooms(page: number = 1, limit: number = 100, specialtyId?: string): Promise<{
    data: Array<{
      id: string;
      roomCode: string;
      roomName: string;
      specialty?: {
        id: string;
        name: string;
        specialtyCode: string;
      };
    }>;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (specialtyId) {
      params.append('specialtyId', specialtyId);
    }
    return this.request(`/api/clinic-rooms?${params.toString()}`);
  }

  // Clinic Rooms: Get prescription services by clinic room
  async getPrescriptionServicesByClinicRoom(clinicRoomId: string): Promise<Array<{
    id: string;
    prescriptionId: string;
    prescriptionCode: string;
    serviceId: string;
    serviceName: string;
    status: string;
    patientProfileId: string;
    patientName: string;
    doctorId?: string;
    doctorName?: string;
    technicianId?: string;
    technicianName?: string;
    boothId?: string;
    boothCode?: string;
    boothName?: string;
  }>> {
    return this.request(`/api/clinic-rooms/${clinicRoomId}/prescription-services`);
  }

  // Appointment: Get appointment by code
  async getAppointmentByCode(code: string): Promise<{
    appointmentId: string;
    appointmentCode: string;
    patientProfile: {
      id: string;
      profileCode: string;
      name: string;
      age?: number;
      gender?: string;
      dateOfBirth?: string;
      phone?: string;
      isPregnant?: boolean;
      isDisabled?: boolean;
    };
    doctor?: {
      id: string;
      name: string;
    };
    specialty?: {
      id: string;
      name: string;
    };
    service?: {
      id: string;
      name: string;
    };
    appointmentDate?: string;
    startTime?: string;
    endTime?: string;
  }> {
    return this.request(`/api/appointment-booking/appointments/code/${encodeURIComponent(code)}`);
  }

  // Patient Profile: Get patient profile by phone number
  async getPatientProfileByPhone(phone: string): Promise<{
    name: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
    profileCode: string;
    dateOfBirth?: string;
    phone?: string;
    isPregnant?: boolean;
    isDisabled?: boolean;
  } | null> {
    try {
      const response = await this.request<any>(
        `/api/patient-profiles/search?phone=${encodeURIComponent(phone)}`,
        {
          method: 'GET',
        }
      );
      
      // Response có thể là array hoặc object với data array
      const profiles = Array.isArray(response) ? response : (response?.data || []);
      
      if (!profiles || profiles.length === 0) {
        return null;
      }
      
      // Lấy profile đầu tiên (mới nhất nếu đã được sort)
      const profile = profiles[0];
      
      // Calculate age from dateOfBirth
      let age = 0;
      if (profile.dateOfBirth) {
        const birthDate = new Date(profile.dateOfBirth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }
      
      // Normalize gender
      const normalizeGender = (gender: string | null | undefined): 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN' => {
        if (!gender) return 'UNKNOWN';
        const genderLower = gender.toLowerCase();
        if (genderLower === 'male' || genderLower === 'm' || genderLower === 'nam') {
          return 'MALE';
        } else if (genderLower === 'female' || genderLower === 'f' || genderLower === 'nữ') {
          return 'FEMALE';
        } else if (genderLower === 'other' || genderLower === 'o' || genderLower === 'khác') {
          return 'OTHER';
        }
        return 'UNKNOWN';
      };
      
      return {
        name: profile.name || '',
        age,
        gender: normalizeGender(profile.gender),
        profileCode: profile.profileCode || '',
        dateOfBirth: profile.dateOfBirth,
        phone: profile.phone,
        isPregnant: profile.isPregnant,
        isDisabled: profile.isDisabled,
      };
    } catch (error) {
      console.error('Error getting patient profile by phone:', error);
      return null;
    }
  }

  // AI Triage
  async triageSymptoms(symptoms: string): Promise<{ suggestedSpecialty: string; reasoning: string }> {
    return this.request<{ suggestedSpecialty: string; reasoning: string }>(
      '/api/ai-chatbot/triage',
      {
        method: 'POST',
        body: JSON.stringify({ symptoms }),
      }
    );
  }
}

export const apiService = new ApiService();
