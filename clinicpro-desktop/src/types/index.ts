// Types for the Desktop Counter App

export interface Counter {
  counterId: string;
  counterCode: string;
  counterName: string;
  location: string;
}

export interface Patient {
  ticketId: string;
  patientName: string;
  patientPhone: string;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  patientAge?: number;
  priorityLevel: 'NORMAL' | 'VIP' | 'Rất cao' | 'Thấp';
  queueNumber: string;
  startedAt?: string;
  createdAt?: string;
  isSkipped?: boolean;
  isPregnant?: boolean;
  isDisabled?: boolean;
  isElderly?: boolean;
  isVIP?: boolean;
}

export type TicketStatus = 'WAITING' | 'NEXT' | 'SERVING' | 'SKIPPED' | 'COMPLETED';

export interface Ticket {
  ticketId: string;
  patientName: string;
  patientPhone: string;
  priorityLevel: 'NORMAL' | 'VIP';
  queueNumber: string;
  counterId: string;
  status: TicketStatus;
  callCount: number;
  createdAt: string;
  startedAt?: string;
}

export interface QueueTicketSnapshot {
  ticketId: string;
  patientName: string;
  patientAge?: number;
  status: TicketStatus;
  callCount: number;
  queuePriority: number;
  queueNumber: string;
  assignedAt?: string;
  isOnTime: boolean;
  isPregnant: boolean;
  isDisabled: boolean;
  isEmergency: boolean;
  isVIP: boolean;
  isElderly: boolean;
  isChild?: boolean;
  patientProfileCode?: string;
  appointmentCode?: string;
  metadata?: Record<string, unknown> | null;
}

export interface QueueSnapshot {
  counterId: string;
  current: QueueTicketSnapshot | null;
  next: QueueTicketSnapshot | null;
  queue: QueueTicketSnapshot[];
  ordered: QueueTicketSnapshot[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export type CountersResponse = { counters: Counter[] } | Counter[];

export interface CurrentPatientResponse {
  success: boolean;
  patient?: Patient;
  hasPatient: boolean;
}

export type QueueResponse = Ticket[];

export interface NextPatientResponse {
  patient: Patient;
  message: string;
}

export interface SkipPatientResponse {
  ok: boolean;
  patient: Patient;
  message: string;
  status: string;
}

// Kiosk types
export type AppMode = 'counter' | 'clinic' | 'kiosk' | 'start-services';
export type AppStep = 'select-mode' | 'select-counter' | 'counter-dashboard' | 'kiosk' | 'start-services';

export interface TakeNumberRequest {
  patientName?: string;
  patientAge?: number;
  patientGender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
  patientPhone?: string;
  isPregnant?: boolean;
  isDisabled?: boolean;
  isElderly?: boolean;
  isVIP?: boolean;
  notes?: string;
  patientProfileCode?: string;
  appointmentCode?: string;
}

export interface TakeNumberTicket {
  ticketId: string;
  queueNumber: string;
  counterId: string;
  counterCode: string;
  counterName: string;
  patientName: string;
  patientAge: number;
  priorityScore: number;
  priorityLevel: string;
  estimatedWaitTime: number;
  assignedAt: string;
}

export interface TakeNumberResponse {
  success: boolean;
  ticket: TakeNumberTicket;
  patientInfo: {
    name: string;
    age: number;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
    hasAppointment: boolean;
    appointmentDetails?: unknown;
  };
}

// Prescription services
export interface PendingServiceItem {
  serviceId: string;
  serviceName: string;
}

export interface PendingServicesResponse {
  prescriptionId: string;
  prescriptionCode: string;
  services: PendingServiceItem[];
  status: 'PENDING';
  totalCount: number;
}

export interface StartServiceRequestItem {
  prescriptionId: string; // using prescriptionCode as identifier if ID not available on client
  serviceId: string;
}

export interface StartServicesResponseItemSuccess {
  prescriptionId: string;
  serviceId: string;
  status: 'WAITING';
  startedAt: string;
}

export interface StartServicesResponseItemFailed {
  prescriptionId: string;
  serviceId: string;
  reason: string;
}

export interface StartServicesResponse {
  success: boolean;
  startedServices: StartServicesResponseItemSuccess[];
  failedServices: StartServicesResponseItemFailed[];
  totalStarted: number;
  totalFailed: number;
}

// Global window interface for kiosk bridge
declare global {
  interface Window {
    kiosk?: {
      printOrSaveTicket: (html: string) => Promise<void>;
    };
  }

  namespace NodeJS {
    interface ProcessEnv {
      API_BASE_URL?: string;
      WEBSOCKET_URL?: string;
    }
  }
}
