import api from '../config';
import {
  GetCountersResponse,
  OpenCounterRequest,
  OpenCounterResponse,
  CloseCounterRequest,
  CloseCounterResponse,
  GetCurrentCounterResponse,
  GetCurrentPatientResponse,
  QueueResponseNormalized,
  QueueStatusRaw,
  CallNextPatientResponse,
  SkipCurrentPatientResponse,
  MarkServedResponse,
} from '../types/reception';

// Types for prescription queue endpoints
interface PendingServiceItem {
  prescriptionServiceId: string; // ID của prescription service
  serviceId: string;
  serviceName: string;
  status: 'PENDING' | 'RESCHEDULED' | 'WAITING_RESULT';
  doctorId?: string | null;
  technicianId?: string | null;
  doctorName?: string | null;
  technicianName?: string | null;
  isDoctorNotWorking?: boolean;
  isTechnicianNotWorking?: boolean;
}

export interface PendingServicesResponse {
  prescriptionId: string;
  prescriptionCode: string;
  services: PendingServiceItem[];
  status: 'PENDING' | 'RESCHEDULED' | 'MIXED';
  totalCount: number;
}

export interface AssignNextServiceRequest {
  prescriptionCode: string;
  prescriptionServiceIds: string[];
}

export interface AssignNextServiceResponse {
  assignedService?: {
    prescriptionId: string;
    serviceId: string;
    status: string;
    doctorId?: string | null;
    technicianId?: string | null;
    workSessionId: string;
  };
  assignedServices?: Array<{
    prescriptionServiceId: string;
    prescriptionId: string;
    serviceId: string;
    serviceName?: string;
    oldStatus: string;
    newStatus: string;
    doctorId?: string | null;
    technicianId?: string | null;
    workSessionId: string;
    chosenSession?: {
      id: string;
      doctorId?: string | null;
      doctorName?: string | null;
      technicianId?: string | null;
      technicianName?: string | null;
      startTime: string;
      endTime: string;
      boothId?: string | null;
      boothCode?: string | null;
      boothName?: string | null;
      clinicRoomId?: string | null;
      clinicRoomCode?: string | null;
      clinicRoomName?: string | null;
    };
  }>;
  chosenSession: {
    id: string;
    doctorId?: string | null;
    doctorName?: string | null;
    technicianId?: string | null;
    technicianName?: string | null;
    startTime: string;
    endTime: string;
    boothId?: string | null;
    boothCode?: string | null;
    boothName?: string | null;
    clinicRoomId?: string | null;
    clinicRoomCode?: string | null;
    clinicRoomName?: string | null;
  };
  queuePreview?: {
    patients: unknown[];
    totalCount: number;
  };
}

class ReceptionService {
  private countersBase = '/receptionists/counters';
  private assignBase = '/counter-assignment';

  async getAllCounters(): Promise<GetCountersResponse> {
    const res = await api.get(this.countersBase);
    return res.data;
  }

  async getCurrentCounter(): Promise<GetCurrentCounterResponse | null> {
    try {
      const res = await api.get(`${this.countersBase}/current`);
      return res.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e.response?.status === 404) return null;
      throw e;
    }
  }

  async openCounter(data: OpenCounterRequest): Promise<OpenCounterResponse> {
    const res = await api.post(`${this.countersBase}/open`, data);
    return res.data;
  }

  async closeCounter(data: CloseCounterRequest): Promise<CloseCounterResponse> {
    const res = await api.post(`${this.countersBase}/close`, data);
    return res.data;
  }

  async getCurrentPatient(counterId: string): Promise<GetCurrentPatientResponse> {
    const res = await api.get(`${this.assignBase}/counters/${counterId}/current-patient`);
    return res.data;
  }

  async getCounterQueue(counterId: string): Promise<QueueResponseNormalized> {
    const res = await api.get(`${this.assignBase}/counters/${counterId}/queue`);
    const data = res.data;
    if (Array.isArray(data)) {
      return { queue: data, total: data.length };
    }
    // If backend wraps
    if (Array.isArray(data?.queue)) {
      return { queue: data.queue, total: data.queue.length };
    }
    return { queue: [], total: 0 };
  }

  async getCounterQueueStatus(counterId: string): Promise<QueueStatusRaw> {
    const res = await api.get(`${this.assignBase}/counters/${counterId}/queue-status`);
    const raw = res.data;
    if (raw && raw.success !== undefined && raw.status) return raw as QueueStatusRaw;
    return { success: true, status: raw?.status ?? {} } as QueueStatusRaw;
  }

  async callNextPatient(counterId: string): Promise<CallNextPatientResponse> {
    const res = await api.post(`${this.assignBase}/next-patient/${counterId}`);
    const d = res.data;
    return {
      success: d.success ?? d.ok ?? false,
      message: d.message,
      patient: d.patient,
    };
  }

  async skipCurrentPatient(counterId: string): Promise<SkipCurrentPatientResponse> {
    const res = await api.post(`${this.assignBase}/skip-current/${counterId}`);
    const d = res.data;
    return {
      success: d.success ?? d.ok ?? false,
      message: d.message,
      patient: d.patient,
      skippedPatient: d.skippedPatient,
    };
  }

  async markPatientServed(counterId: string): Promise<MarkServedResponse> {
    const res = await api.post(`${this.assignBase}/mark-served/${counterId}`);
    const d = res.data;
    return {
      success: d.success ?? d.ok ?? false,
      message: d.message,
    };
  }

  async getPendingServices(prescriptionCode: string): Promise<PendingServicesResponse> {
    const res = await api.get(`/prescriptions/pending-services/${encodeURIComponent(prescriptionCode)}`);
    return res.data as PendingServicesResponse;
  }

  async assignNextService(payload: AssignNextServiceRequest): Promise<AssignNextServiceResponse> {
    const res = await api.post('/prescriptions/assign-next-service', payload);
    return res.data as AssignNextServiceResponse;
  }
}

export const receptionService = new ReceptionService();

